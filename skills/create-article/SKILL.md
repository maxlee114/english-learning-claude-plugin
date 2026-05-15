---
name: english-learning-create-article
description: >
  Fetch vocabulary and grammar words from the user's Notion English Learning database,
  then generate a natural English article using those words. Use this skill whenever
  the user says things like "create an article from my words", "write an article using
  my vocabulary", "fetch my words and write a story", "generate article from Notion",
  "use my saved words to write", or any request combining word fetching + article creation.
  Also trigger when the user wants to review or practice their saved English words through
  reading. Always use this skill when Notion + article/story/writing are mentioned together.
---

# English Article Skill

Generate a natural English article using words saved in the user's Notion English Learning database.

## Step 1 — Fetch words from Notion

Use the Notion MCP to query the English Learning database using the Notion DB ID provided in the session context (injected at session start).

Apply filters based on what the user requests:

| User says | Filter |
|---|---|
| "use today's words" | Date = today |
| "use this week's words" | Date range = this week |
| "use words from May" | Date range = that month |
| "use low familiarity words" | Familiarity = low |
| "use all words" | No filter |
| (no filter specified) | Default: fetch latest 20 words sorted by Date descending |

## Step 2 — Confirm words with user

Show only the word and definition, nothing else:

```
I found X words:
- doable: able to be accomplished
- nevertheless: in spite of that
- must: expressing obligation

Shall I write the article using these words?
```

If the list is empty, tell the user no words were found for that filter and suggest alternatives.

If fewer than 20 words are found, tell the user:
```
I found only X words in your DB. Use all X words to write the article, or wait until you have more?
```
Wait for confirmation before proceeding.

## Step 3 — Generate the article

Once confirmed, write a natural English article following these rules:

**Article requirements:**
- Length: 150–250 words
- Every fetched word must appear at least once, used naturally in context
- Bold each target word the first time it appears: **doable**
- Genre: default to a short story or opinion piece unless the user specifies otherwise
- Tone: engaging and readable, not textbook-like

**Supported genres (if user specifies):**
- `story` — short narrative fiction
- `news` — news article style
- `email` — professional or casual email
- `blog` — informal blog post
- `dialogue` — conversation between two people

## Step 4 — After the article

Show a word recap at the bottom with Chinese translation:

```
---
📚 Words used in this article:
• doable — able to be accomplished｜可以做到的
• nevertheless — in spite of that｜儘管如此
• must — expressing obligation｜必須
```

Then ask: "Would you like to update the Familiarity of any words in Notion?"
If yes, ask which words and update them via Notion MCP.

## Notes

- If the user wants to regenerate with different words or genre, go back to Step 1
- Always write the article in English regardless of the user's language
- Default filter is always latest 20 words unless the user specifies otherwise
