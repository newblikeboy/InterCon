(() => {
  const selector = '[role="dialog"][aria-modal="true"]';
  const focusable = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const opened = new Map();
  let active = null;
  const visible = node => !node.hidden && node.getClientRects().length > 0;
  function controls(dialog) {
    return [...dialog.querySelectorAll(focusable)].filter(node => !node.disabled && visible(node));
  }
  function synchronize() {
    for (const dialog of document.querySelectorAll(selector)) {
      if (visible(dialog) && !opened.has(dialog)) {
        opened.set(dialog, document.activeElement);
        active = dialog;
        dialog.tabIndex = -1;
        if (!dialog.contains(document.activeElement)) (controls(dialog)[0] || dialog).focus();
      } else if (!visible(dialog) && opened.has(dialog)) {
        const previous = opened.get(dialog);
        opened.delete(dialog);
        active = [...opened.keys()].at(-1) || null;
        if (previous?.isConnected && visible(previous)) previous.focus();
      }
    }
  }
  document.addEventListener('keydown', event => {
    if (!active || event.key !== 'Tab') return;
    const items = controls(active);
    const index = items.indexOf(document.activeElement);
    if (!items.length) { event.preventDefault(); active.focus(); }
    else if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1).focus(); }
    else if (!event.shiftKey && (index === items.length - 1 || index < 0)) { event.preventDefault(); items[0].focus(); }
  });
  document.addEventListener('focusin', event => {
    if (active && visible(active) && !active.contains(event.target)) (controls(active)[0] || active).focus();
  });
  new MutationObserver(synchronize).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class'], childList: true });
  document.querySelectorAll('[data-form-message], [data-contact-message], [data-send-message]').forEach(node => {
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
  });
  synchronize();
})();
