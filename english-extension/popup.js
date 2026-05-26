document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageUrl = tab?.url || '';
  const pageTitle = tab?.title || pageUrl;

  document.getElementById('pageInfo').textContent = pageTitle || pageUrl;

  const { words, error } = await chrome.runtime.sendMessage({
    action: 'getPageWords',
    pageUrl
  });

  const content = document.getElementById('content');

  if (error || !words) {
    content.innerHTML = `<div class="empty-state">Could not load words.<br>Check your settings.</div>`;
    return;
  }

  if (words.length === 0) {
    content.innerHTML = `<div class="empty-state">No words saved from this page yet.<br>Select any text to translate and save.</div>`;
    return;
  }

  content.innerHTML = `
    <div class="word-count">${words.length} word${words.length > 1 ? 's' : ''} saved</div>
    <div class="word-list">
      ${words.map(w => `
        <div class="word-item">
          <div class="word-row">
            <span class="word-text">${w.word}</span>
            ${w.pos ? `<span class="word-pos">${w.pos}</span>` : ''}
          </div>
          <div class="word-definition">${w.definition}</div>
        </div>
      `).join('')}
    </div>
  `;
}

init();
