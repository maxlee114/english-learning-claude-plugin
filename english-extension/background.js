chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translate') {
    handleTranslate(message.text).then(sendResponse);
    return true;
  }
  if (message.action === 'saveToNotion') {
    handleSaveToNotion(message.data).then(sendResponse);
    return true;
  }
});

async function handleTranslate(text) {
  const { openaiKey, openaiModel } = await chrome.storage.sync.get(['openaiKey', 'openaiModel']);
  if (!openaiKey) return { error: 'No OpenAI API key. Go to Settings.' };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: openaiModel || 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: `You are an English learning assistant. When given a word or phrase, respond ONLY with valid JSON in this exact format:
{
  "word": "the word/phrase",
  "type": "vocab" or "grammar",
  "definition": "clear, simple definition in English (1-2 sentences)",
  "example": "a natural example sentence using the word",
  "chinese": "Traditional Chinese translation"
}
No extra text, only JSON.`
          },
          {
            role: 'user',
            content: text
          }
        ]
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const parsed = JSON.parse(content);
    return parsed;
  } catch (err) {
    return { error: 'Translation failed. Check your API key.' };
  }
}

async function handleSaveToNotion(data) {
  const { notionKey, notionDbId } = await chrome.storage.sync.get(['notionKey', 'notionDbId']);
  if (!notionKey || !notionDbId) return { success: false, error: 'Missing Notion settings.' };

  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${notionKey}`,
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: notionDbId },
        properties: {
          'Word / Phrase': {
            title: [{ text: { content: data.word } }]
          },
          'Type': {
            select: { name: data.type }
          },
          'Definition': {
            rich_text: [{ text: { content: data.definition } }]
          },
          'Example': {
            rich_text: [{ text: { content: data.example } }]
          },
          'Chinese': {
            rich_text: [{ text: { content: data.chinese || '' } }]
          },
          'Familiarity': {
            select: { name: 'low' }
          },
          'Date': {
            date: { start: today }
          }
        }
      })
    });

    if (response.ok) return { success: true };
    const err = await response.json();
    return { success: false, error: err.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
