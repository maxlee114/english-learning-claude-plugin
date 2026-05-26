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

Then complete the one-time setup below.

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
2. Copy the page URL from the browser address bar

### 3. Connect the integration to the page

1. Open the parent page in Notion
2. Click `...` in the top right → **Connections**
3. Find and add your integration

### 4. Run the setup script

**macOS / Linux**

```bash
cd plugins/english-learning
./scripts/setup.sh --token secret_xxx --parent https://www.notion.so/your-page-url
```

You can also pass the token via environment variable:

```bash
NOTION_API_KEY=secret_xxx ./scripts/setup.sh --parent https://www.notion.so/your-page-url
```

**Windows (PowerShell)**

Windows blocks `.ps1` scripts by default. Run this once to allow scripts from your current user:

```powershell
# RemoteSigned = local scripts run freely, downloaded scripts require a digital signature
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run the setup:

```powershell
.\scripts\setup.ps1 -Token secret_xxx -Parent https://www.notion.so/your-page-url
```

Or via environment variable:

```powershell
$env:NOTION_API_KEY = "secret_xxx"
.\scripts\setup.ps1 -Parent https://www.notion.so/your-page-url
```

This creates the **Words** and **Articles** databases inside the parent page and saves the configuration automatically. All future sessions connect to them automatically.

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

### Settings

Click the extension icon → ⚙️ to open Settings and fill in:

| Field | Where to get it |
|---|---|
| OpenAI API Key | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| OpenAI Model | Default: `gpt-4o-mini` |
| Notion Integration Token | Same `secret_xxx` from setup |
| Words DB ID | Paste your Words DB URL or ID |
| Articles DB ID | Paste your Articles DB URL or ID |

> Make sure your Notion integration has access to both the Words and Articles databases (add it via **Connections** on each DB page).

### Usage

1. Select any word or phrase on a webpage
2. Click the **Translate** button that appears
3. Review the translation popup — shows word, part of speech, definition, example, and Chinese translation
4. Click **Save to Notion** to save to your Words DB (automatically linked to the current article)

Click the extension icon to see all words saved from the current page.
