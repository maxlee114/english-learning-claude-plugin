const SCHEMA_VERSION = 2;

// Each entry corresponds to a version upgrade.
// MIGRATIONS[N] = migration that upgrades from version N to N+1.
// Existing users with no schemaVersion in storage are treated as v1
// (the original setup.sh release).
const MIGRATIONS = [
  // v0 → v1: not needed (v1 was the initial setup.sh release)
  null,

  // v1 → v2: add Date field to Articles DB
  async (headers, { articlesDbId }) => {
    if (!articlesDbId) return;
    await fetch(`https://api.notion.com/v1/databases/${articlesDbId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        properties: { 'Date': { date: {} } }
      })
    });
  }
];

function notionHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Notion-Version': '2022-06-28'
  };
}

function extractId(input) {
  const match = (input || '').match(/[0-9a-f]{32}/);
  return match ? match[0] : input;
}

// ── Setup ──────────────────────────────────────────────────────────────────────

async function handleSetup({ notionKey, parentPageUrl }) {
  if (!notionKey || !parentPageUrl) {
    return { success: false, error: 'Missing Notion token or parent page URL.' };
  }

  const parentPageId = extractId(parentPageUrl);
  if (!parentPageId) {
    return { success: false, error: 'Could not extract page ID from URL.' };
  }

  const headers = notionHeaders(notionKey);

  try {
    // 1. Create container page
    const containerRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: parentPageId },
        properties: {
          title: [{ text: { content: 'English Learning' } }]
        }
      })
    });
    const container = await containerRes.json();
    if (!container.id) return { success: false, error: container.message || 'Failed to create container page.' };
    const containerId = container.id;

    // 2. Create Articles DB
    const articlesRes = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { page_id: containerId },
        title: [{ text: { content: 'Articles' } }],
        properties: {
          'Title': { title: {} },
          'URL':   { url: {} },
          'Date':  { date: {} }
        }
      })
    });
    const articlesDb = await articlesRes.json();
    if (!articlesDb.id) return { success: false, error: articlesDb.message || 'Failed to create Articles DB.' };
    const articlesDbId = articlesDb.id;

    // 3. Create Words DB (with relation to Articles)
    const wordsRes = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { page_id: containerId },
        title: [{ text: { content: 'Words' } }],
        properties: {
          'Word / Phrase':  { title: {} },
          'Part of Speech': { select: { options: [
            { name: 'noun',      color: 'blue' },
            { name: 'verb',      color: 'green' },
            { name: 'adjective', color: 'yellow' },
            { name: 'adverb',    color: 'orange' },
            { name: 'phrase',    color: 'purple' },
            { name: 'idiom',     color: 'pink' }
          ]}},
          'Definition':  { rich_text: {} },
          'Example':     { rich_text: {} },
          'Chinese':     { rich_text: {} },
          'Familiarity': { select: { options: [
            { name: 'low',    color: 'red' },
            { name: 'medium', color: 'yellow' },
            { name: 'high',   color: 'green' }
          ]}},
          'Date':    { date: {} },
          'Article': { relation: {
            database_id: articlesDbId,
            type: 'dual_property',
            dual_property: {}
          }}
        }
      })
    });
    const wordsDb = await wordsRes.json();
    if (!wordsDb.id) return { success: false, error: wordsDb.message || 'Failed to create Words DB.' };
    const wordsDbId = wordsDb.id;

    // 4. Save IDs and mark schema version
    await chrome.storage.sync.set({
      notionDbId: wordsDbId,
      notionArticlesDbId: articlesDbId,
      schemaVersion: SCHEMA_VERSION
    });

    await appendLog({ type: 'setup', to: SCHEMA_VERSION, success: true });

    return { success: true, wordsDbId, articlesDbId };

  } catch (e) {
    await appendLog({ type: 'setup', to: SCHEMA_VERSION, success: false, error: e.message });
    return { success: false, error: e.message };
  }
}

// ── Logging ────────────────────────────────────────────────────────────────────

async function appendLog(entry) {
  const { migrationLogs = [] } = await chrome.storage.local.get(['migrationLogs']);
  migrationLogs.push({ ...entry, timestamp: new Date().toISOString() });
  // Keep last 50 entries
  if (migrationLogs.length > 50) migrationLogs.splice(0, migrationLogs.length - 50);
  await chrome.storage.local.set({ migrationLogs });
}

// ── Migrations ─────────────────────────────────────────────────────────────────

async function runMigrations() {
  const data = await chrome.storage.sync.get(['schemaVersion', 'notionKey', 'notionDbId', 'notionArticlesDbId']);
  // Users with no schemaVersion are from the original setup.sh release (v1)
  const currentVersion = data.schemaVersion ?? 1;

  if (currentVersion >= SCHEMA_VERSION) return;
  if (!data.notionKey || !data.notionDbId) return;

  const headers = notionHeaders(data.notionKey);
  const ids = { wordsDbId: data.notionDbId, articlesDbId: data.notionArticlesDbId };

  for (let v = currentVersion; v < SCHEMA_VERSION; v++) {
    if (MIGRATIONS[v]) {
      try {
        await MIGRATIONS[v](headers, ids);
        await chrome.storage.sync.set({ schemaVersion: v + 1 });
        await appendLog({ from: v, to: v + 1, success: true });
        console.log(`[EL] Migration v${v}→v${v + 1} succeeded`);
      } catch (e) {
        await appendLog({ from: v, to: v + 1, success: false, error: e.message });
        console.error(`[EL] Migration v${v}→v${v + 1} failed:`, e.message);
        return; // Stop on failure, retry next time
      }
    } else {
      await chrome.storage.sync.set({ schemaVersion: v + 1 });
    }
  }
}
