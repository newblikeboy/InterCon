const Campaign = require("../models/Campaign");
const Contact = require("../models/Contact");
const MediaAsset = require("../models/MediaAsset");
const Template = require("../models/Template");
const HttpError = require("../utils/httpError");

function normalizeCampaign(body) {
  return {
    name: String(body.name || "").trim(),
    templateName: String(body.templateName || body.template_name || "").trim(),
    mediaId: String(body.mediaId || body.media_id || "").trim(),
    category: String(body.category || "").toLowerCase().trim(),
    audienceTag: String(body.audienceTag || body.audience_tag || "").trim(),
    scheduledAt: body.scheduledAt || body.scheduled_at ? new Date(body.scheduledAt || body.scheduled_at) : undefined
  };
}

async function countAudience(tenantId, audienceTag) {
  const filter = {
    tenantId,
    status: "active",
    "optIn.status": true
  };

  if (audienceTag) {
    filter.tags = audienceTag;
  }

  return Contact.countDocuments(filter);
}

async function listCampaigns(tenantId) {
  return Campaign.find({ tenantId }).sort({ createdAt: -1 }).limit(100);
}

async function createCampaign(tenantId, body) {
  const payload = normalizeCampaign(body);

  if (!payload.name || !payload.templateName || !payload.category) {
    throw new HttpError(400, "Campaign name, template name, and category are required");
  }

  if (!["utility", "marketing", "authentication"].includes(payload.category)) {
    throw new HttpError(400, "Campaign category must be utility, marketing, or authentication");
  }

  const approvedTemplate = await Template.findOne({
    tenantId,
    name: payload.templateName,
    category: payload.category,
    status: "approved"
  });

  if (!approvedTemplate) {
    throw new HttpError(400, "Select a Meta-approved template that matches the campaign category");
  }

  if (approvedTemplate.headerType && approvedTemplate.headerType !== "none") {
    payload.mediaId = payload.mediaId || approvedTemplate.headerMediaId || "";
    if (!payload.mediaId) {
      throw new HttpError(400, `This campaign template requires a ${approvedTemplate.headerType} from the Media Library`);
    }

    const media = await MediaAsset.findOne({
      tenantId,
      mediaId: payload.mediaId,
      mediaType: approvedTemplate.headerType
    }).lean();
    if (!media) {
      throw new HttpError(400, `Choose a valid ${approvedTemplate.headerType} from the Media Library`);
    }
    const validMimeType = approvedTemplate.headerType === "image"
      ? ["image/jpeg", "image/png"].includes(media.mimeType)
      : ["video/mp4", "video/3gpp"].includes(media.mimeType);
    const maximumBytes = approvedTemplate.headerType === "image" ? 5 * 1024 * 1024 : 16 * 1024 * 1024;
    if (!validMimeType || Number(media.bytes || 0) > maximumBytes) {
      throw new HttpError(400, `Choose a WhatsApp-compatible ${approvedTemplate.headerType} from the Media Library`);
    }
  } else {
    payload.mediaId = "";
  }

  const recipients = await countAudience(tenantId, payload.audienceTag);

  const status = payload.scheduledAt && payload.scheduledAt > new Date()
    ? "scheduled"
    : "draft";

  return Campaign.create({
    tenantId,
    ...payload,
    status,
    stats: {
      recipients
    }
  });
}

async function updateCampaignStatus(tenantId, campaignId, status) {
  if (!["draft", "scheduled", "sending", "sent", "paused", "failed"].includes(status)) {
    throw new HttpError(400, "Invalid campaign status");
  }

  const campaign = await Campaign.findOneAndUpdate(
    { _id: campaignId, tenantId },
    { $set: { status } },
    { returnDocument: "after" }
  );

  if (!campaign) {
    throw new HttpError(404, "Campaign not found");
  }

  return campaign;
}

module.exports = {
  listCampaigns,
  createCampaign,
  updateCampaignStatus
};
