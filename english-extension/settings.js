const openaiKeyInput        = document.getElementById('openaiKey');
const openaiModelSelect     = document.getElementById('openaiModel');
const notionKeyInput        = document.getElementById('notionKey');
const notionDbIdInput       = document.getElementById('notionDbId');
const notionArticlesDbIdInput = document.getElementById('notionArticlesDbId');
const fontSizeSelect        = document.getElementById('fontSize');
const parentPageUrlInput    = document.getElementById('parentPageUrl');
const saveBtn               = document.getElementById('saveBtn');
const setupBtn              = document.getElementById('setupBtn');
const status                = document.getElementById('status');
const setupStatus           = document.getElementById('setupStatus');

const STORAGE_KEYS = ['openaiKey', 'openaiModel', 'notionKey', 'notionDbId', 'notionArticlesDbId', 'fontSize', 'parentPageUrl'];

function extractNotionId(input) {
  const match = input.match(/[0-9a-f]{32}/);
  return match ? match[0] : input;
}

function loadStorageIntoForm(data) {
  if (data.openaiKey)          openaiKeyInput.value = data.openaiKey;
  if (data.openaiModel)        openaiModelSelect.value = data.openaiModel;
  if (data.notionKey)          notionKeyInput.value = data.notionKey;
  if (data.notionDbId)         notionDbIdInput.value = data.notionDbId;
  if (data.notionArticlesDbId) notionArticlesDbIdInput.value = data.notionArticlesDbId;
  if (data.fontSize)           fontSizeSelect.value = data.fontSize;
  if (data.parentPageUrl)      parentPageUrlInput.value = data.parentPageUrl;
}

// Load saved settings on open
chrome.storage.sync.get(STORAGE_KEYS, loadStorageIntoForm);

// Show schema version + migration logs
chrome.storage.sync.get(['schemaVersion'], ({ schemaVersion }) => {
  const current = schemaVersion ?? 1;
  chrome.runtime.sendMessage({ action: 'getSchemaVersion' }, (target) => {
    const el = document.getElementById('schemaInfo');
    if (!el) return;

    const upToDate = current >= (target ?? current);
    el.innerHTML = `schema v${current} / v${target ?? current}` +
      (upToDate ? '' : ' <span style="color:#cc5555">⚠ migration pending</span>');
  });
});

chrome.runtime.sendMessage({ action: 'getMigrationLogs' }, (logs) => {
  const el = document.getElementById('schemaInfo');
  const logPanel = document.getElementById('logPanel');
  const logsBtn = document.getElementById('logsBtn');
  if (!el || !logPanel || !logsBtn) return;

  // Show last migration result under schema version
  if (logs?.length) {
    const last = logs[logs.length - 1];
    const time = new Date(last.timestamp).toLocaleString();
    const label = last.type === 'setup' ? `setup v${last.to}` : `migrate v${last.from}→v${last.to}`;
    const color = last.success ? '#55aa55' : '#cc5555';
    const icon = last.success ? '✓' : '✘';
    el.insertAdjacentHTML('beforeend', `<div style="color:${color};margin-top:3px;">${icon} ${label} (${time})</div>`);
  } else {
    el.insertAdjacentHTML('beforeend', '<div style="color:#333;margin-top:3px;">no logs yet</div>');
  }

  // Populate log panel
  logPanel.innerHTML = logs?.length
    ? logs.slice().reverse().map(l => {
        const t = new Date(l.timestamp).toLocaleString();
        const label = l.type === 'setup' ? `setup v${l.to}` : `migrate v${l.from}→v${l.to}`;
        return l.success
          ? `<div>✓ ${label} — ${t}</div>`
          : `<div style="color:#cc5555">✘ ${label} — ${t}<br>&nbsp;&nbsp;${l.error}</div>`;
      }).join('')
    : '<div>no logs yet</div>';

  // Toggle log panel
  logsBtn.addEventListener('click', () => {
    const open = logPanel.style.display !== 'none';
    logPanel.style.display = open ? 'none' : 'block';
    logsBtn.textContent = open ? '▸ View Logs' : '▾ Hide Logs';
  });
});

// Re-populate DB ID fields if storage changes (e.g. after setup)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.notionDbId)         notionDbIdInput.value = changes.notionDbId.newValue || '';
  if (changes.notionArticlesDbId) notionArticlesDbIdInput.value = changes.notionArticlesDbId.newValue || '';
});

// ── Save Settings ──────────────────────────────────────────────────────────────

saveBtn.addEventListener('click', () => {
  const newNotionDbId         = extractNotionId(notionDbIdInput.value.trim());
  const newNotionArticlesDbId = extractNotionId(notionArticlesDbIdInput.value.trim());

  chrome.storage.sync.get(['notionDbId', 'notionArticlesDbId'], (prev) => {
    const dbChanged = newNotionDbId !== prev.notionDbId ||
                      newNotionArticlesDbId !== prev.notionArticlesDbId;

    const data = {
      openaiKey:          openaiKeyInput.value.trim(),
      openaiModel:        openaiModelSelect.value,
      notionKey:          notionKeyInput.value.trim(),
      notionDbId:         newNotionDbId,
      notionArticlesDbId: newNotionArticlesDbId,
      fontSize:           fontSizeSelect.value,
      parentPageUrl:      parentPageUrlInput.value.trim()
    };

    // If DB IDs changed, reset schemaVersion so migrations re-run against the new DB
    if (dbChanged) data.schemaVersion = 1;

    chrome.storage.sync.set(data, () => {
      showStatus(status, '✓ Settings saved!', 'success');
      if (data.notionKey && data.notionDbId) {
        chrome.runtime.sendMessage({ action: 'runMigrations' });
      }
    });
  });
});

// ── Setup Notion ───────────────────────────────────────────────────────────────

setupBtn.addEventListener('click', async () => {
  const notionKey    = notionKeyInput.value.trim();
  const parentPageUrl = parentPageUrlInput.value.trim();

  if (!notionKey) {
    showStatus(setupStatus, '✘ Enter your Notion token first.', 'error');
    return;
  }
  if (!parentPageUrl) {
    showStatus(setupStatus, '✘ Enter a parent page URL.', 'error');
    return;
  }

  setupBtn.disabled = true;
  showStatus(setupStatus, 'Setting up...', '');

  // Save token first so background can use it
  await chrome.storage.sync.set({ notionKey, parentPageUrl });

  const result = await chrome.runtime.sendMessage({
    action: 'setup',
    data: { notionKey, parentPageUrl }
  });

  setupBtn.disabled = false;

  if (result.success) {
    showStatus(setupStatus, '✓ Done! DB IDs have been filled in.', 'success');
  } else {
    showStatus(setupStatus, `✘ ${result.error}`, 'error');
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function showStatus(el, message, type) {
  el.textContent = message;
  el.className = `status ${type}`;
  if (type === 'success') {
    setTimeout(() => { el.textContent = ''; el.className = 'status'; }, 3000);
  }
}
