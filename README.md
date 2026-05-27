# English Learning Claude Plugin

A Claude Code plugin for English vocabulary learning. Collect words during conversations, save them to Notion, and generate practice articles — plus a companion Chrome extension for saving words while browsing.

## Skills

| Skill | Trigger | What it does |
|---|---|---|
| `english-learning-save-list` | "save my list", "show my list" | Saves words collected in the session to Notion |
| `english-learning-create-article` | "create an article from my words" | Fetches words from Notion and writes a practice article |

## Prerequisites

- **Notion MCP** configured in Claude Code
- **Notion integration token** with access to your workspace

## Install

```bash
claude plugin marketplace add maxlee114/english-learning-claude-plugin
claude plugin install english-learning
```

## Setup

### 1. Create a Notion integration token

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration**
3. Give it a name (e.g. "English Learning")
4. Under **Capabilities**, make sure these are checked:
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
5. Click **Save** and copy the **Internal Integration Token** (`secret_xxx...`)

### 2. Create a parent page in Notion

The integration cannot create pages at workspace root, so you need a parent page:

1. Open Notion and create a new page anywhere (e.g. "My Databases")
2. Click `...` in the top right → **Connections** → add your integration
3. Copy the page URL from the browser address bar

### 3. Configure the Claude plugin

Add your Notion token to Claude Code settings so the plugin skills can access your databases.

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

Select text on any webpage to translate and save words directly to your Notion database.

### Install

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** and select the `english-extension/` folder

### Setup

Click the extension icon → ⚙️ → fill in your credentials, then scroll down to **Setup Notion**:

| Field | Where to get it |
|---|---|
| OpenAI API Key | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| OpenAI Model | Default: `gpt-4o-mini` |
| Notion Integration Token | From step 1 above (`secret_xxx...`) |
| Parent Page URL | The page URL from step 2 above |

Click **Setup Notion Databases** — the extension will automatically create the Words and Articles databases and fill in the DB IDs.

**Already have existing databases?** You can skip Setup and paste the DB URLs or IDs directly into the Words DB ID and Articles DB ID fields.

### Usage

1. Select any word or phrase on a webpage
2. Click the **Translate** button that appears
3. Review the translation popup — shows word, part of speech, definition, example, and Chinese translation
4. Click **Save to Notion** to save to your Words DB (automatically linked to the current page)

Click the extension icon to open the **Side Panel** and see all words saved from the current page.
