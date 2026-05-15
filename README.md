# English Learning Claude Plugin

A Claude Code plugin that adds two AI-powered English learning skills connected to your Notion database, plus a companion Chrome extension for saving words while browsing.

## Components

### Claude Code Skills

| Skill | Trigger | What it does |
|---|---|---|
| `english-learning-save-list` | "save my list", "show my list" | Saves words collected in the session to Notion |
| `english-learning-create-article` | "create an article from my words" | Fetches words from Notion and writes a practice article |

### Chrome Extension (`english-extension/`)

Select text on any webpage to translate, define, and save words directly to your Notion database. See [`english-extension/CLAUDE.md`](english-extension/CLAUDE.md) for setup details.

## Prerequisites

1. **Notion MCP** configured in Claude Code (the skills use Notion MCP to read/write your database)
2. **Notion integration token** with access to your English Learning database
3. A Notion database with these properties:
   - `Word / Phrase` (Title)
   - `Type` (Select: vocab / grammar)
   - `Definition` (Rich Text)
   - `Example` (Rich Text)
   - `Chinese` (Rich Text)
   - `Familiarity` (Select: low / medium / high)
   - `Date` (Date)

## Install

```bash
git clone https://github.com/maxlee114/english-learning-claude-plugin.git
cd english-learning-claude-plugin
chmod +x install.sh uninstall.sh
./install.sh
```

Then restart Claude Code. Both skills will appear automatically.

## Uninstall

```bash
./uninstall.sh
```

## Usage

### Save words to Notion

During a Claude conversation, say things like:
- "add 'nevertheless' to learning list"
- "add 'feasible' to learning list"

Then when ready:
- "show my list" — preview collected words
- "save my list to Notion" — save all new words (skips duplicates)

### Generate a practice article

- "create an article from my words"
- "write a story using this week's words"
- "generate a blog post using my low familiarity words"

Claude will fetch matching words from Notion, confirm the list with you, then write a 150–250 word article with every word bolded on first use.
