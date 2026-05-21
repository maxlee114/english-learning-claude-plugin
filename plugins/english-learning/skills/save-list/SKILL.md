---
name: english-learning-save-list
description: >
  Manage words collected during the session for the user's Notion English Learning database.
  Trigger when the user says things like "save my list", "save learning list to Notion",
  "post my words to Notion", "show my list", "what's in my list", or any phrase indicating
  they want to save or review their collected words.
---

# English Learning Save List Skill

Manage words collected during the session via "add X to learning list".

## Default Behavior

If the skill is called without a clear command, default to **Show List**.

## Command: Show List

Trigger phrases: "show my list", "what's in my list", "show learning list"

Scan the current conversation for all words added via "add X to learning list" and display them:

```
📋 Your learning list (X words):
• doable
• nevertheless
• feasible
```

If empty:
```
Your learning list is empty. Try saying "add 'word' to learning list".
```

## Command: Save List

Trigger phrases: "save my list", "save learning list to Notion", "post my words to Notion"

### Step 1 — Review collected words

Scan the current conversation for all words added via "add X to learning list". Compile the full list.

If no words were collected, tell the user:
```
No words found in this session. Try saying "add 'word' to learning list" first.
```

### Step 2 — Duplicate check

For each word, search the Notion database (ID provided in session context) to check if it already exists.
- If exists → skip it, note as skipped
- If not exists → proceed to generate

### Step 3 — Generate fields for each new word

For each new word, generate:

| Field | Value |
|---|---|
| Word / Phrase | the word itself |
| Type | `vocab` or `grammar` (based on the word) |
| Definition | clear, simple English definition (1-2 sentences) |
| Example | natural example sentence using the word |
| Chinese | Traditional Chinese translation |
| Familiarity | always `low` |
| Date | today's date |

### Step 4 — POST to Notion

Use Notion MCP to create one page per word in the English Learning database.
Use the Notion DB ID provided in the session context (injected at session start).

### Step 5 — Show summary

```
✅ Saved X words to Notion:
• doable — able to be accomplished｜可以做到的
• nevertheless — in spite of that｜儘管如此

⏭ Skipped (already exists):
• feasible
```

## Notes

- Always set Familiarity to `low` for new entries
- Always set Date to today
- Skip duplicates and list them in the summary
- Strip surrounding quotes from words before processing
