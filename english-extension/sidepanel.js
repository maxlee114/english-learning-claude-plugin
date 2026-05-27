const SIZES = ['small', 'medium', 'large'];

function applyFontSize(size) {
  document.body.className = `font-${size}`;
}

function setFontSize(size) {
  applyFontSize(size);
  chrome.storage.sync.set({ fontSize: size });
}

function currentSize() {
  return SIZES.find(s => document.body.classList.contains(`font-${s}`)) || 'medium';
}

// Apply saved font size on load
chrome.storage.sync.get(['fontSize'], ({ fontSize }) => {
  applyFontSize(fontSize || 'medium');
});

// Listen for font size changes from settings page
chrome.storage.onChanged.addListener((changes) => {
  if (changes.fontSize) {
    applyFontSize(changes.fontSize.newValue);
  }
});

document.getElementById('fontSmallBtn').addEventListener('click', () => {
  const idx = SIZES.indexOf(currentSize());
  if (idx > 0) setFontSize(SIZES[idx - 1]);
});

document.getElementById('fontLargeBtn').addEventListener('click', () => {
  const idx = SIZES.indexOf(currentSize());
  if (idx < SIZES.length - 1) setFontSize(SIZES[idx + 1]);
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.windows.create({ url: chrome.runtime.getURL('settings.html'), type: 'popup', width: 360, height: 620 });
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  loadWords();
});

async function loadWords() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageUrl = tab?.url || '';
  const pageTitle = tab?.title || pageUrl;

  document.getElementById('pageInfo').textContent = pageTitle || pageUrl;

  const content = document.getElementById('content');
  content.innerHTML = `<div class="loading">Loading words...</div>`;

  const { words, error } = await chrome.runtime.sendMessage({
    action: 'getPageWords',
    pageUrl
  });

  if (error || !words) {
    content.innerHTML = `
      <div class="empty-state">
        Could not load words.<br>Check your settings.
        <button class="refresh-btn" id="retryBtn">Try again</button>
      </div>`;
    document.getElementById('retryBtn')?.addEventListener('click', loadWords);
    return;
  }

  if (words.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        No words saved from this page yet.<br>
        Select any text to translate and save.
      </div>`;
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
          ${w.definition ? `<div class="word-definition">${w.definition}</div>` : ''}
          ${w.chinese ? `<div class="word-chinese">${w.chinese}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

loadWords();
