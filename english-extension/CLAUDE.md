# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chrome Extension (Manifest V3) that lets users select text on any webpage to get OpenAI-powered translations/definitions, then save vocabulary entries to a Notion database.

## Development & Installation

No build system — this is a raw Chrome extension with no npm dependencies or compilation step.

**Load in Chrome:**
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory

**Reload after changes:** Click the refresh icon on the extension card in `chrome://extensions`, then reload the target page.

## Architecture

Three components communicate via Chrome's message passing:

- **`background.js`** — Service worker. Reads credentials from `chrome.storage.sync`, calls the OpenAI Chat Completions API (`translate` action) and Notion Pages API (`saveToNotion` action). All external API calls live here due to Manifest V3 CSP restrictions.

- **`content.js`** — Injected into all pages. Detects `mouseup` text selections (1–100 chars), renders the "Translate" trigger button and the result popup, and routes messages to/from the background worker.

- **`settings.html` / `settings.js`** — Extension action popup. Stores OpenAI key + model and Notion token + database ID into `chrome.storage.sync`.

### Message Flow

```
content.js  →  chrome.runtime.sendMessage({ action: 'translate' | 'saveToNotion', ... })
            →  background.js handles request, calls external API
            →  returns result to content.js callback
```

### API Contracts

**OpenAI** — returns JSON with fields: `word`, `type` (`vocab`|`grammar`), `definition`, `example`, `chinese`

**Notion** — creates a page with properties: Title (word), Type (select), Definition (rich_text), Example (rich_text), Familiarity (select, default `"low"`), Date (date)

## Key Constraints

- Manifest V3: network requests must originate from the background service worker, not the content script.
- Credentials are stored in `chrome.storage.sync` (synced across the user's Chrome profile).
- Host permissions are locked to `https://api.openai.com/*` and `https://api.notion.com/*` — any new external API calls require adding a host permission in `manifest.json`.
- Content script UI uses scoped document-level variables (`popup`, `triggerBtn`, `selectedText`) — avoid naming collisions with page globals.
