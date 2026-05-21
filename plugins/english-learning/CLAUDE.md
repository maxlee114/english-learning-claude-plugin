# English Learning Claude Plugin

## Project Overview

A Claude Code plugin for English vocabulary learning. Users collect words during conversations, save them to Notion, and generate practice articles. Includes a companion Chrome extension for saving words while browsing.

## Repository Structure

```
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest (name, version, author)
├── skills/
│   ├── setup/
│   │   └── SKILL.md         # One-time setup: creates Notion DB via MCP, saves DB ID to config
│   ├── save-list/
│   │   └── SKILL.md         # Collects words from session and saves to Notion
│   └── create-article/
│       └── SKILL.md         # Fetches words from Notion and generates a practice article
├── hooks/
│   └── hooks.json           # SessionStart hook: runs session-start.sh on every session
├── scripts/
│   └── session-start.sh     # Reads DB ID from config, injects into session context
├── english-extension/       # Chrome extension (independent from the plugin)
│   └── CLAUDE.md            # Chrome extension development guide
└── README.md
```

## How It Works

### Config & Session Injection

The plugin stores the Notion DB ID as plain text at `${CLAUDE_PLUGIN_DATA}/config` (written by the setup skill). On every session start, `session-start.sh` reads this file and injects the DB ID into Claude's context via `additionalContext`. If the config doesn't exist, it prompts the user to run `/english-learning-setup`.

### Skills

- **english-learning-setup** — Uses Notion MCP to create the database with the correct schema, then writes the returned DB ID to `${CLAUDE_PLUGIN_DATA}/config`.
- **english-learning-save-list** — Scans the conversation for words added via "add [word] to list", deduplicates against Notion, and POSTs new entries.
- **english-learning-create-article** — Queries Notion for words (with optional filters), confirms with user, generates a 150–250 word article with all words bolded.

### Notion DB Schema

| Column | Type | Options |
|---|---|---|
| Word / Phrase | Title | — |
| Type | Select | vocab, grammar |
| Definition | Rich Text | — |
| Example | Rich Text | — |
| Chinese | Rich Text | — |
| Familiarity | Select | low, medium, high |
| Date | Date | — |

### Chrome Extension

Independent from the Claude plugin. Uses OpenAI API to generate definitions and POSTs directly to Notion. Has its own settings UI for API keys and DB ID. See `english-extension/CLAUDE.md` for details.

## Key Constraints

- `session-start.sh` uses only `cat` and `bash` builtins — no external dependencies — to ensure compatibility across all environments.
- The DB ID is injected via `SessionStart` hook, so all skills read it from session context rather than hardcoding it.
- `${CLAUDE_PLUGIN_DATA}` persists across sessions and plugin updates; only removed on plugin uninstall.
