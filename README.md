# English Learning Claude Plugin

A Claude Code plugin for English vocabulary learning. Collect words during conversations, save them to Notion, and generate practice articles — plus a companion Chrome extension for saving words while browsing.

## Skills

| Skill | Trigger | What it does |
|---|---|---|
| `english-learning-setup` | "run setup" | One-time setup: creates your Notion DB automatically |
| `english-learning-save-list` | "save my list", "show my list" | Saves words collected in the session to Notion |
| `english-learning-create-article` | "create an article from my words" | Fetches words from Notion and writes a practice article |

## Prerequisites

- **Notion MCP** configured in Claude Code
- **Notion integration token** with access to your workspace

> The Notion database is created automatically by `/english-learning-setup` — no manual setup needed.

## Install

```bash
claude plugin install english-learning@<marketplace>
```

Then restart Claude Code and run the one-time setup:

```
/english-learning-setup
```

This creates your Notion database with the correct schema and saves the configuration. All future sessions connect to it automatically.

## Usage

### Collect and save words

During any conversation, say:
- "add 'nevertheless' to learning list"
- "add 'feasible' to learning list"

When ready to save:
- "show my list" — preview collected words
- "save my list" — save to Notion (skips duplicates)

### Generate a practice article

- "create an article from my words"
- "write a story using this week's words"
- "generate a blog post using my low familiarity words"

Claude fetches words from Notion, confirms the list, then writes a 150–250 word article with every word bolded on first use.

## Chrome Extension

Select text on any webpage to translate and save words directly to your Notion database. See [`english-extension/CLAUDE.md`](english-extension/CLAUDE.md) for setup details.
