(() => {
  const modes = [...document.querySelectorAll("[data-delivery-mode]")];
  const panel = document.querySelector("[data-recipient-delivery-panel]");
  const form = document.querySelector("[data-recipient-delivery-form]");
  if (!modes.length || !form) return;
  const fields = form.elements;
  const status = document.querySelector("[data-recipient-delivery-status]");
  const variableContainer = document.querySelector("[data-recipient-delivery-variables]");
  const templateHint = document.querySelector("[data-recipient-template-hint]");
  let templates = [], objectUrl, activeTemplateKey = "";
  const selected = () => templates.find(template => JSON.stringify([template.name, template.language]) === fields.templateChoice.value);
  const feedback = (text, error = false) => { status.textContent = text; status.classList.toggle("error", error); };
  function preview() {
    const file = fields.file.files[0];
    document.querySelector("[data-recipient-preview-number]").textContent = fields.to.value || "Recipient";
    document.querySelector("[data-recipient-preview-file]").textContent = file?.name || "No file selected";
    document.querySelector("[data-recipient-preview-file-size]").textContent = file ? formatMediaBytes(file.size) : "";
    document.querySelector("[data-recipient-preview-document]").hidden = !file || file.type.startsWith("image/") || file.type.startsWith("video/");
    const values = [...variableContainer.querySelectorAll("input")].map(input => input.value);
    document.querySelector("[data-recipient-preview-text]").textContent = selected()?.body?.replace(/\{\{\s*(\d+)\s*\}\}/g,
      (match, number) => values[Number(number) - 1] || match) || "Select a template to preview.";
  }
  function renderTemplates() {
    const previous = fields.templateChoice.value;
    fields.templateChoice.replaceChildren(new Option("Choose a media template", ""));
    for (const template of templates.filter(template => ["image", "video", "document"].includes(template.headerType)
      && (fields.purpose.value !== "patient_report" || template.category === "utility" && template.headerType === "document"))) {
      fields.templateChoice.add(new Option(`${template.name} - ${template.headerType} (${template.language})`, JSON.stringify([template.name, template.language])));
    }
    fields.templateChoice.value = [...fields.templateChoice.options].some(option => option.value === previous) ? previous : "";
    templateChanged();
  }
  function templateChanged() {
    const template = selected();
    if (activeTemplateKey !== fields.templateChoice.value) {
      activeTemplateKey = fields.templateChoice.value;
      variableContainer.replaceChildren();
      for (let i = 0; i < Number(template?.parameterCount || 0); i++) {
        const label = document.createElement("label"); label.textContent = `Text variable ${i + 1}`;
        const input = document.createElement("input"); input.required = true; input.maxLength = 4096;
        input.setAttribute("aria-label", `Text variable ${i + 1}`); label.append(input); variableContainer.append(label);
      }
    }
    const type = template?.headerType;
    fields.file.accept = type === "document" ? ".pdf,application/pdf" : type === "image" ? ".jpg,.jpeg,.png,image/jpeg,image/png"
      : type === "video" ? ".mp4,.3gp,video/mp4,video/3gpp" : ".pdf,.jpg,.jpeg,.png,.mp4,.3gp";
    templateHint.hidden = Boolean(template);
    templateHint.textContent = "Choose a template with a matching media header.";
    document.querySelector("[data-recipient-file-hint]").textContent = type === "document" ? "PDF · Up to 50 MB"
      : type === "image" ? "JPG or PNG · Up to 5 MB" : type === "video" ? "MP4 or 3GP · Up to 16 MB"
        : "PDF 50 MB · JPG/PNG 5 MB · MP4/3GP 16 MB";
    preview();
  }
  async function changeMode() {
    const personal = modes.find(mode => mode.checked)?.value === "recipient";
    panel.hidden = !personal; document.querySelector("[data-shared-send-layout]").hidden = personal;
    if (!personal) return;
    try {
      const data = await requestJson("/api/templates/approved"); templates = data.templates || []; renderTemplates();
      feedback(templates.some(template => ["image", "video", "document"].includes(template.headerType)) ? "" : "Create an approved media-header template first.");
    } catch (error) { feedback(error.message, true); }
  }
  modes.forEach(mode => mode.addEventListener("change", changeMode));
  document.querySelector("[data-refresh-send-data]")?.addEventListener("click", () => {
    if (modes.some(mode => mode.checked && mode.value === "recipient")) changeMode();
  });
  fields.templateChoice.addEventListener("change", templateChanged);
  fields.purpose.addEventListener("change", () => {
    const report = fields.purpose.value === "patient_report";
    document.querySelector("[data-recipient-reference-field]").hidden = !report;
    document.querySelector("[data-recipient-terms-note]").hidden = !report;
    fields.consentReference.required = report; renderTemplates();
  });
  form.addEventListener("input", preview);
  fields.file.addEventListener("change", () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const container = document.querySelector("[data-recipient-preview-media]"); container.replaceChildren();
    const file = fields.file.files[0];
    container.hidden = true;
    if (file && ["image/jpeg", "image/png", "video/mp4", "video/3gpp"].includes(file.type)) {
      objectUrl = URL.createObjectURL(file);
      const element = document.createElement(file.type.startsWith("image/") ? "img" : "video");
      element.src = objectUrl;
      if (element.tagName === "VIDEO") { element.controls = true; element.preload = "metadata"; }
      else element.alt = "Selected recipient photo";
      container.append(element);
      container.hidden = false;
    }
    preview();
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const template = selected(), file = fields.file.files[0];
    if (!template || !file) return feedback("Choose a media template and one file.", true);
    const limit = template.headerType === "image" ? 5 : template.headerType === "video" ? 16 : 50;
    if (file.size > limit * 1024 * 1024) return feedback(`This file must be ${limit} MB or smaller.`, true);
    const body = new FormData(form); body.delete("templateChoice");
    body.set("templateName", template.name); body.set("language", template.language);
    body.set("variables", JSON.stringify([...variableContainer.querySelectorAll("input")].map(input => input.value)));
    const controls = [...form.querySelectorAll("input,select,button")]; controls.forEach(control => { control.disabled = true; });
    try {
      if (!await requirePlatformAccessBeforeAction(feedback)) return;
      const fileDigest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const fileHash = Array.from(new Uint8Array(fileDigest), byte => byte.toString(16).padStart(2, "0")).join("");
      const summary = JSON.stringify([...body.entries()].filter(([name]) => name !== "file")) + fileHash;
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(summary));
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      const storageKey = `intercon_pending_media_${setupState.user?.tenantId}_${fingerprint}`;
      let pending; try { pending = JSON.parse(sessionStorage.getItem(storageKey)); } catch {}
      if (pending?.fingerprint !== fingerprint) pending = { fingerprint, key: crypto.randomUUID() };
      if (!await showConfirmModal({ title: `Send file to ${body.get("to")}?`, message: `${file.name} · ${template.name}`, confirmText: "Send file" })) return;
      sessionStorage.setItem(storageKey, JSON.stringify(pending));
      feedback("Uploading file...");
      const response = await fetch("/api/messages/send-media", { method: "POST", credentials: "same-origin", headers: { "Idempotency-Key": pending.key }, body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delivery could not be queued. Retry with the same file and details.");
      sessionStorage.removeItem(storageKey);
      feedback(`${data.idempotent ? "Already queued" : "Queued"}. Message ID: ${data.messageId}`);
      form.reset(); variableContainer.replaceChildren();
      activeTemplateKey = "";
      document.querySelector("[data-recipient-reference-field]").hidden = true; fields.consentReference.required = false;
      document.querySelector("[data-recipient-terms-note]").hidden = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      document.querySelector("[data-recipient-preview-media]").replaceChildren();
      document.querySelector("[data-recipient-preview-media]").hidden = true;
      templateChanged();
      await loadSendHistory();
    } catch (error) { feedback(error.message, true); }
    finally { controls.forEach(control => { control.disabled = false; }); }
  });
})();
