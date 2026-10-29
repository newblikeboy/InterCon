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
  const selectedMedia = () => mediaState.assets.find(asset => asset.mediaId === fields.mediaId.value);
  const feedback = (text, error = false) => { status.textContent = text; status.classList.toggle("error", error); };
  function preview() {
    const asset = selectedMedia();
    const file = asset ? { name: asset.title, size: asset.bytes, type: asset.mimeType } : fields.file.files[0];
    document.querySelector("[data-recipient-preview-number]").textContent = fields.to.value || "Recipient";
    document.querySelector("[data-recipient-preview-file]").textContent = file?.name || "No file selected";
    document.querySelector("[data-recipient-preview-file-size]").textContent = file ? formatMediaBytes(file.size) : "";
    document.querySelector("[data-recipient-preview-document]").hidden = !file || file.type.startsWith("image/") || file.type.startsWith("video/");
    const values = [...variableContainer.querySelectorAll("input")].map(input => input.value);
    document.querySelector("[data-recipient-preview-text]").textContent = selected()?.body?.replace(/\{\{\s*(\d+)\s*\}\}/g,
      (match, number) => values[Number(number) - 1] || match) || "Select a template to preview.";
  }
  function renderLibraryFiles() {
    const previous = fields.mediaId.value;
    fields.mediaId.replaceChildren(new Option("Upload a new file instead", ""));
    for (const asset of mediaState.assets.filter(asset => isUniqueMedia(asset)
      && asset.purpose === fields.purpose.value && isCompatibleWhatsAppMedia(asset, selected()?.headerType))) {
      fields.mediaId.add(new Option(`${asset.title} - ${asset.recipientContactId ? "Recipient assigned" : "Unassigned"}`, asset.mediaId));
    }
    fields.mediaId.value = [...fields.mediaId.options].some(option => option.value === previous) ? previous : "";
    attachmentChanged();
  }
  function attachmentChanged() {
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    const asset = selectedMedia();
    fields.file.disabled = Boolean(asset);
    fields.file.required = !asset;
    document.querySelector("[data-recipient-upload-field]").hidden = Boolean(asset);
    const container = document.querySelector("[data-recipient-preview-media]");
    container.replaceChildren(); container.hidden = true;
    const file = asset ? { type: asset.mimeType } : fields.file.files[0];
    if (file && ["image/jpeg", "image/png", "video/mp4", "video/3gpp"].includes(file.type)) {
      const element = document.createElement(file.type.startsWith("image/") ? "img" : "video");
      element.src = asset ? asset.url : (objectUrl = URL.createObjectURL(fields.file.files[0]));
      if (element.tagName === "VIDEO") { element.controls = true; element.preload = "metadata"; }
      else element.alt = "Selected recipient photo";
      container.append(element); container.hidden = false;
    }
    preview();
  }
  function renderTemplates() {
    const previous = fields.templateChoice.value;
    fields.templateChoice.replaceChildren(new Option("Choose a media template", ""));
    for (const template of templates.filter(template => template.mediaMode !== "common" && ["image", "video", "document"].includes(template.headerType)
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
    renderLibraryFiles();
  }
  async function changeMode() {
    const personal = modes.find(mode => mode.checked)?.value === "recipient";
    panel.hidden = !personal; document.querySelector("[data-shared-send-layout]").hidden = personal;
    if (!personal) return;
    try {
      const [data] = await Promise.all([requestJson("/api/templates/approved"), loadMediaLibrary()]); templates = data.templates || []; renderTemplates();
      feedback(templates.some(template => template.mediaMode !== "common" && ["image", "video", "document"].includes(template.headerType)) ? "" : "Create an approved Unique Media template first.");
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
  fields.file.addEventListener("change", attachmentChanged);
  fields.mediaId.addEventListener("change", attachmentChanged);
  document.addEventListener("media-library-updated", renderLibraryFiles);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const template = selected(), asset = selectedMedia(), file = asset ? null : fields.file.files[0];
    if (!template || (!file && !asset)) return feedback("Choose a media template and one file.", true);
    const limit = template.headerType === "image" ? 5 : template.headerType === "video" ? 16 : 50;
    if ((asset?.bytes || file?.size) > limit * 1024 * 1024) return feedback(`This file must be ${limit} MB or smaller.`, true);
    const body = new FormData(form); body.delete("templateChoice");
    if (!asset) body.delete("mediaId");
    body.set("templateName", template.name); body.set("language", template.language);
    body.set("variables", JSON.stringify([...variableContainer.querySelectorAll("input")].map(input => input.value)));
    const controls = [...form.querySelectorAll("input,select,button")]; controls.forEach(control => { control.disabled = true; });
    try {
      if (!await requirePlatformAccessBeforeAction(feedback)) return;
      const fileDigest = file ? await crypto.subtle.digest("SHA-256", await file.arrayBuffer()) : null;
      const fileHash = asset ? `library:${asset.mediaId}` : Array.from(new Uint8Array(fileDigest), byte => byte.toString(16).padStart(2, "0")).join("");
      const summary = JSON.stringify([...body.entries()].filter(([name]) => name !== "file")) + fileHash;
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(summary));
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      const storageKey = `intercon_pending_media_${setupState.user?.tenantId}_${fingerprint}`;
      let pending; try { pending = JSON.parse(sessionStorage.getItem(storageKey)); } catch {}
      if (pending?.fingerprint !== fingerprint) pending = { fingerprint, key: crypto.randomUUID() };
      if (!await showConfirmModal({ title: `Send file to ${body.get("to")}?`, message: `${asset?.title || file.name} · ${template.name}`, confirmText: "Send file" })) return;
      sessionStorage.setItem(storageKey, JSON.stringify(pending));
      feedback(asset ? "Queueing file..." : "Uploading file...");
      const response = await fetch("/api/messages/send-media", { method: "POST", credentials: "same-origin", headers: { "Idempotency-Key": pending.key }, body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delivery could not be queued. Retry with the same file and details.");
      sessionStorage.removeItem(storageKey);
      await loadMediaLibrary(true);
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
    finally { controls.forEach(control => { control.disabled = false; }); fields.file.disabled = Boolean(selectedMedia()); }
  });
})();
