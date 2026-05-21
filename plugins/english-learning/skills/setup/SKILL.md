---
name: english-learning-setup
description: >
  First-time setup for the English Learning plugin. Creates the Notion database
  and saves the configuration. Trigger when the user says "setup english learning",
  "run setup", or when the session context says setup is required.
---

# English Learning Setup

One-time setup that connects to a Notion database and saves the config for future sessions.

## Step 1 — Check existing config

Check if `${CLAUDE_PLUGIN_DATA}/config` already exists using the Read tool.

If it exists and contains a DB ID, tell the user:
```
Setup already complete. Notion DB ID: <id>
Run setup again to replace it.
```
Then ask if they want to continue. If no, stop.

## Step 2 — Ask if user has an existing database

Ask the user:

```
Do you already have an English Learning database in Notion?
• Yes — paste your existing database URL or ID
• No — I'll create one for you
```

### If Yes (existing DB)

Extract the database ID from the URL or use the provided ID directly (the 32-character string after the last `-` or `/`).

Skip to Step 4.

### If No (create new DB)

Proceed to Step 3.

## Step 3 — Create the Notion database

Ask the user:

```
Where and what should I name your Notion database?
Default: workspace root, named "English Learning DB" — or tell me a custom location (page URL / page ID) and/or a custom name.
```

Use the defaults for anything the user doesn't specify.

If the user provides a page URL or ID, extract the page ID (the 32-character string after the last `-` or `/`) and use it as the parent page.

Use Notion MCP to create a new database with exactly these properties:

| Property | Type | Options |
|---|---|---|
| Word / Phrase | title | — |
| Type | select | vocab, grammar |
| Definition | rich_text | — |
| Example | rich_text | — |
| Chinese | rich_text | — |
| Familiarity | select | low, medium, high |
| Date | date | — |

Database title: user-provided name, or `English Learning DB` if not specified.

## Step 4 — Save config

Save the database ID as plain text to `${CLAUDE_PLUGIN_DATA}/config`.

The file should contain only the database ID, nothing else. Use the Write tool to create this file.

## Step 5 — Confirm

```
✅ Setup complete!

Notion DB ID saved to config — all future sessions will connect to this database automatically.

You can now:
• Say "add [word] to learning list" to collect words
• Say "save my list" to save words to Notion
• Say "create an article from my words" to generate a practice article
```
