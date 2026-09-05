(() => {
  const status = document.querySelector('[data-admin-status]');
  const host = document.querySelector('[data-admin-records]');
  const more = document.querySelector('[data-admin-more]');
  let kind = 'tenants', cursor = null, rows = [], version = 0;
  async function request(path, options = {}) {
    const response = await fetch(path, { credentials: 'include', ...options });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'The request failed');
    return data;
  }
  function value(record, path) {
    const result = path.split('.').reduce((item, key) => item?.[key], record);
    return result == null ? '?' : String(result);
  }
  function render(fields) {
    host.replaceChildren();
    const table = document.createElement('table'), head = document.createElement('thead'), body = document.createElement('tbody');
    const heading = document.createElement('tr');
    for (const field of fields) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = field; heading.append(th); }
    head.append(heading);
    for (const record of rows) {
      const tr = document.createElement('tr');
      for (const field of fields) { const td = document.createElement('td'); td.textContent = value(record, field); tr.append(td); }
      body.append(tr);
    }
    if (!rows.length) { host.textContent = 'No records found.'; return; }
    table.append(head, body); host.append(table);
  }
  async function load(append = false) {
    const token = ++version;
    status.textContent = 'Loading?'; more.disabled = true;
    try {
      const data = await request('/api/admin/records/' + kind + (append && cursor ? '?after=' + encodeURIComponent(cursor) : ''));
      if (token !== version) return;
      rows = append ? rows.concat(data.records) : data.records;
      cursor = data.nextCursor; render(data.fields); more.hidden = !cursor;
      status.textContent = rows.length + ' records displayed.';
    } catch (error) { if (token === version) status.textContent = error.message; }
    finally { if (token === version) more.disabled = false; }
  }
  async function overview() {
    try {
      const data = await request('/api/admin/overview');
      const stats = document.querySelector('[data-admin-stats]'); stats.replaceChildren();
      const labels = { tenants: 'Workspaces', queued: 'Messages awaiting delivery', uncertain: 'Messages needing review', failedWebhooks: 'Failed webhooks', payments: 'Captured payments' };
      for (const [key, count] of Object.entries(data.counts)) {
        const item = document.createElement('div'), label = document.createElement('span'), number = document.createElement('strong');
        label.textContent = labels[key]; number.textContent = count; item.append(label, number); stats.append(item);
      }
    } catch (error) { status.textContent = error.message; }
  }
  document.querySelectorAll('[data-records]').forEach(button => button.addEventListener('click', () => {
    kind = button.dataset.records; cursor = null;
    document.querySelector('[data-admin-title]').textContent = button.textContent;
    document.querySelectorAll('[data-records]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    load();
  }));
  more.addEventListener('click', () => load(true));
  document.querySelector('[data-admin-refresh]').addEventListener('click', () => { overview(); load(); });
  document.querySelector('[data-admin-logout]').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try { await request('/api/auth/logout', { method: 'POST' }); window.location.replace('/'); }
    catch (error) { status.textContent = 'Logout failed. You are still signed in. ' + error.message; event.target.disabled = false; }
  });
  overview(); load();
})();