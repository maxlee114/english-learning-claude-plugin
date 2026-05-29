const SIZES = ['tiny', 'small', 'medium', 'large', 'huge'];
let currentTabId = null;

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
  currentTabId = tab?.id || null;
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
      ${words.map((w, i) => `
        <div class="word-item">
          <div class="word-row">
            <span class="word-text" data-word="${w.word}" title="Click to find on page">${w.word}</span>
            ${w.pos ? `<span class="word-pos">${w.pos}</span>` : ''}
            ${w.chinese ? `
              <span class="word-chinese-hint" data-idx="${i}" title="Show Chinese">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </span>
              <span class="word-chinese" id="chinese-${i}" style="display:none">${w.chinese}</span>
            ` : ''}
          </div>
          ${w.definition ? `<div class="word-definition">${w.definition}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  content.querySelectorAll('.word-text').forEach(el => {
    el.addEventListener('click', () => {
      if (!currentTabId) return;
      const word = el.dataset.word;
      chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: (word) => {
          const existing = document.getElementById('el-word-highlight');
          if (existing) existing.replaceWith(...existing.childNodes);

          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              const tag = parent.tagName;
              if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
              if (parent.closest('#el-popup, #el-trigger')) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
          });

          // Collect all occurrences
          const lowerWord = word.toLowerCase();
          const ranges = [];
          while (walker.nextNode()) {
            const node = walker.currentNode;
            let start = 0;
            const text = node.textContent.toLowerCase();
            let idx;
            while ((idx = text.indexOf(lowerWord, start)) !== -1) {
              const range = document.createRange();
              range.setStart(node, idx);
              range.setEnd(node, idx + word.length);
              ranges.push(range);
              start = idx + 1;
            }
          }
          if (ranges.length === 0) return;

          // Find the next occurrence after current scroll position
          const scrollMid = window.scrollY + window.innerHeight / 3;
          let target = ranges.find(r => window.scrollY + r.getBoundingClientRect().top > scrollMid);
          if (!target) target = ranges[0]; // wrap around

          const rect = target.getBoundingClientRect();
          window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 3, behavior: 'smooth' });

          try {
            const mark = document.createElement('mark');
            mark.id = 'el-word-highlight';
            mark.style.cssText = 'all: unset; background: #ffeb3b; border-radius: 3px; padding: 1px 2px; transition: background 1.5s ease;';
            target.surroundContents(mark);
            setTimeout(() => {
              mark.style.background = 'transparent';
              setTimeout(() => mark.replaceWith(...mark.childNodes), 1500);
            }, 1500);
          } catch (e) {}
        },
        args: [word]
      });
    });
  });

  content.querySelectorAll('.word-chinese-hint').forEach(hint => {
    const idx = hint.dataset.idx;
    const chinese = document.getElementById(`chinese-${idx}`);
    hint.addEventListener('click', () => {
      hint.style.display = 'none';
      chinese.style.display = 'inline';
    });
    chinese.addEventListener('click', () => {
      chinese.style.display = 'none';
      hint.style.display = 'inline';
    });
  });
}

loadWords();
