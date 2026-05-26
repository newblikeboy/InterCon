const Contact = require("../models/Contact");
const Message = require("../models/Message");
const Template = require("../models/Template");
const Tenant = require("../models/Tenant");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

function normalizeVariables(variables) {
  if (Array.isArray(variables)) {
    return variables.map((value) => String(value).trim()).filter(Boolean);
  }

  return String(variables || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildTemplateComponents(variables) {
  if (!variables.length) return undefined;

  return [{
    type: "body",
    parameters: variables.map((value) => ({
      type: "text",
      text: value
    }))
  }];
}

async function assertWabaCanSendTemplates(tenant, accessToken) {
  if (!tenant?.meta?.wabaId || !accessToken) return;

  const response = await fetch(`https://graph.facebook.com/${env.metaGraphApiVersion}/${tenant.meta.wabaId}?fields=health_status`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new HttpError(response.status || 400, data.error?.message || "Unable to verify WABA health before sending", data.error || data);
  }

  const entities = data.health_status?.entities || [];
  const wabaEntity = entities.find((entity) => String(entity.entity_type || "").toUpperCase() === "WABA");
  const paymentError = wabaEntity?.errors?.find((error) => {
    const description = `${error.error_description || ""} ${error.possible_solution || ""}`.toLowerCase();
    return description.includes("payment method") || description.includes("payment");
  });

  if (paymentError) {
    throw new HttpError(403, paymentError.possible_solution || "Add a valid payment method in WhatsApp Manager before sending template messages.", paymentError);
  }
}

async function listMessages(tenantId) {
  return Message.find({ tenantId }).sort({ createdAt: -1 }).limit(100);
}

async function sendTemplateMessage(tenantId, body) {
  const contactId = body.contactId || body.contact_id;
  const templateName = String(body.templateName || body.template_name || "").trim();
  const language = String(body.language || "en").trim();
  const variables = normalizeVariables(body.variables);

  if (!contactId || !templateName) {
    throw new HttpError(400, "Contact and approved template are required");
  }

  const [tenant, contact, template] = await Promise.all([
    Tenant.findById(tenantId).select("+meta.accessToken"),
    Contact.findOne({ _id: contactId, tenantId }),
    Template.findOne({ tenantId, name: templateName, status: "approved" })
  ]);

  if (!contact) {
    throw new HttpError(404, "Contact not found");
  }

  if (contact.status !== "active" || !contact.optIn?.status) {
    throw new HttpError(400, "Only active opted-in contacts can receive WhatsApp messages");
  }

  if (!template) {
    throw new HttpError(400, "Select a Meta-approved template");
  }

  const accessToken = tenant?.getMetaAccessToken();

  if (!tenant?.meta?.phoneNumberId || !accessToken) {
    throw new HttpError(409, "Connect WhatsApp first. Phone number ID and Meta access token are required before sending messages.");
  }

  await assertWabaCanSendTemplates(tenant, accessToken);

  const message = await Message.create({
    tenantId,
    contactId: contact._id,
    to: contact.phone,
    templateName,
    language,
    variables,
    status: "queued"
  });

  const payload = {
    messaging_product: "whatsapp",
    to: contact.phone.replace(/^\+/, ""),
    type: "template",
    template: {
      name: template.name,
      language: {
        code: language || template.language || "en"
      }
    }
  };

  const components = buildTemplateComponents(variables);
  if (components) {
    payload.template.components = components;
  }

  const response = await fetch(`https://graph.facebook.com/${env.metaGraphApiVersion}/${tenant.meta.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const metaResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    message.status = "failed";
    message.error = metaResponse.error?.message || "Meta message send failed";
    await message.save();
    throw new HttpError(response.status, message.error, metaResponse.error || metaResponse);
  }

  message.status = "sent";
  message.metaMessageId = metaResponse.messages?.[0]?.id || "";
  await message.save();

  return {
    message,
    meta: metaResponse
  };
}

module.exports = {
  listMessages,
  sendTemplateMessage
};
