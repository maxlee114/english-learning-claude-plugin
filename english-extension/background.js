// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translate') {
    handleTranslate(message.text).then(sendResponse);
    return true;
  }
  if (message.action === 'saveToNotion') {
    handleSaveToNotion(message.data).then(sendResponse);
    return true;
  }
  if (message.action === 'getPageWords') {
    handleGetPageWords(message.pageUrl).then(sendResponse);
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
  "pos": "noun" or "verb" or "adjective" or "adverb" or "phrase" or "idiom",
  "definition": "clear, simple definition in English (keep it brief)",
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
  const { notionKey, notionDbId, notionArticlesDbId } = await chrome.storage.sync.get(['notionKey', 'notionDbId', 'notionArticlesDbId']);
  if (!notionKey || !notionDbId) return { success: false, error: 'Missing Notion settings.' };

  const today = new Date().toISOString().split('T')[0];
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${notionKey}`,
    'Notion-Version': '2022-06-28'
  };

  // Find or create article entry
  let articlePageId = null;
  if (notionArticlesDbId && data.pageUrl) {
    try {
      const queryRes = await fetch(`https://api.notion.com/v1/databases/${notionArticlesDbId}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ filter: { property: 'URL', url: { equals: data.pageUrl } } })
      });
      const queryData = await queryRes.json();

      if (queryData.results?.length > 0) {
        articlePageId = queryData.results[0].id;
      } else {
        const createRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            parent: { database_id: notionArticlesDbId },
            properties: {
              'Title': { title: [{ text: { content: data.pageTitle || data.pageUrl } }] },
              'URL': { url: data.pageUrl }
            }
          })
        });
        const createData = await createRes.json();
        articlePageId = createData.id;
      }
    } catch (e) {
      console.error('[EL] Article link failed:', e);
    }
  }

  try {
    const properties = {
      'Word / Phrase': { title: [{ text: { content: data.word } }] },
      'Part of Speech': data.pos ? { select: { name: data.pos } } : undefined,
      'Definition': { rich_text: [{ text: { content: data.definition } }] },
      'Example': { rich_text: [{ text: { content: data.example } }] },
      'Chinese': { rich_text: [{ text: { content: data.chinese || '' } }] },
      'Familiarity': { select: { name: 'low' } },
      'Date': { date: { start: today } }
    };
    Object.keys(properties).forEach(k => properties[k] === undefined && delete properties[k]);

    if (articlePageId) {
      properties['Article'] = { relation: [{ id: articlePageId }] };
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ parent: { database_id: notionDbId }, properties })
    });

    if (response.ok) return { success: true };
    const err = await response.json();
    return { success: false, error: err.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function handleGetPageWords(pageUrl) {
  const { notionKey, notionDbId, notionArticlesDbId } = await chrome.storage.sync.get(['notionKey', 'notionDbId', 'notionArticlesDbId']);
  if (!notionKey || !notionArticlesDbId) return { words: [] };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${notionKey}`,
    'Notion-Version': '2022-06-28'
  };

  try {
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${notionArticlesDbId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filter: { property: 'URL', url: { equals: pageUrl } } })
    });
    const queryData = await queryRes.json();
    if (!queryData.results?.length) return { words: [] };

    const articleId = queryData.results[0].id;

    const wordsRes = await fetch(`https://api.notion.com/v1/databases/${notionDbId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filter: { property: 'Article', relation: { contains: articleId } } })
    });
    const wordsData = await wordsRes.json();

    const words = wordsData.results.map(page => ({
      word: page.properties['Word / Phrase']?.title?.[0]?.plain_text || '',
      pos: page.properties['Part of Speech']?.select?.name || '',
      definition: page.properties['Definition']?.rich_text?.[0]?.plain_text || '',
      chinese: page.properties['Chinese']?.rich_text?.[0]?.plain_text || ''
    }));

    return { words };
  } catch (e) {
    return { words: [], error: e.message };
  }
}
