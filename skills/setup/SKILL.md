---
name: english-learning-setup
description: >
  First-time setup for the English Learning plugin. Creates the Notion database
  and saves the configuration. Trigger when the user says "setup english learning",
  "run setup", or when the session context says setup is required.
---

# English Learning Setup

One-time setup that creates the Notion database and saves the config for future sessions.

## Step 1 — Check existing config

Check if `${CLAUDE_PLUGIN_DATA}/config.json` already exists using the Read tool.

If it exists and contains a valid `notion_db_id`, tell the user:
```
Setup already complete. Notion DB ID: <id>
Run setup again to replace it.
```
Then ask if they want to continue. If no, stop.

## Step 2 — Ask where to create the database

Ask the user to provide a Notion page ID or URL where the database should be created.

```
Please provide the Notion page where you'd like to create your English Learning database.
You can paste the page URL or page ID.
```

Extract the page ID from the URL if needed (the 32-character string after the last `-` or `/`).

## Step 3 — Create the Notion database

Use Notion MCP to create a new database inside the specified page with exactly these properties:

| Property | Type | Options |
|---|---|---|
| Word / Phrase | title | — |
| Type | select | vocab, grammar |
| Definition | rich_text | — |
| Example | rich_text | — |
| Chinese | rich_text | — |
| Familiarity | select | low, medium, high |
| Date | date | — |

Database title: `English Learning`

## Step 4 — Save config

After the database is created, save the returned database ID to `${CLAUDE_PLUGIN_DATA}/config.json`:

```json
{
  "notion_db_id": "<returned-database-id>"
}
```

Use the Write tool to create this file.

## Step 5 — Confirm

```
✅ Setup complete!

Your English Learning database has been created in Notion.
DB ID saved to config — all future sessions will connect to this database automatically.

You can now:
• Say "add [word] to learning list" to collect words
• Say "save my list" to save words to Notion
• Say "create an article from my words" to generate a practice article
```
