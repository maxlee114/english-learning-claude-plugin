let popup = null;
let triggerBtn = null;
let selectedText = '';

document.addEventListener('mouseup', (e) => {
  if (e.target.closest('#el-popup') || e.target.closest('#el-trigger')) return;

  const selection = window.getSelection();
  const text = selection.toString().trim();

  removeTrigger();
  removePopup();

  if (text && text.length > 0 && text.length < 100) {
    selectedText = text;
    showTriggerButton(e.clientX, e.clientY);
  }
});

document.addEventListener('mousedown', (e) => {
  if (
    (!triggerBtn || !triggerBtn.contains(e.target)) &&
    (!popup || !popup.contains(e.target))
  ) {
    removeTrigger();
    removePopup();
  }
});

function showTriggerButton(x, y) {
  triggerBtn = document.createElement('div');
  triggerBtn.id = 'el-trigger';
  triggerBtn.textContent = 'Translate';
  triggerBtn.style.cssText = `
    position: fixed;
    left: ${Math.min(x, window.innerWidth - 100)}px;
    top: ${y + 10}px;
    z-index: 2147483647;
    background: #e0e0e0;
    color: #111111;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 12px;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 20px;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    user-select: none;
    letter-spacing: 0.2px;
    animation: el-fade-in 0.1s ease;
  `;

  triggerBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    removeTrigger();
    showLoadingPopup(x, y);

    try {
      const result = await chrome.runtime.sendMessage({
        action: 'translate',
        text: selectedText
      });
      updatePopup(result);
    } catch (err) {
      updatePopup({ error: 'Failed to translate. Check your API key in Settings.' });
    }
  });

  document.body.appendChild(triggerBtn);
}

function showLoadingPopup(x, y) {
  popup = document.createElement('div');
  popup.id = 'el-popup';
  popup.innerHTML = `
    <div class="el-loading">
      <span class="el-dot"></span>
      <span class="el-dot"></span>
      <span class="el-dot"></span>
    </div>
  `;
  positionPopup(popup, x, y);
  document.body.appendChild(popup);
}

function updatePopup(data) {
  if (!popup) return;

  if (data.error) {
    popup.innerHTML = `<div class="el-error">${data.error}</div>`;
    return;
  }

  popup.innerHTML = `
    <div class="el-word-row">
      <span class="el-word">${data.word}</span>
      ${data.pos ? `<span class="el-pos">${data.pos}</span>` : ''}
      ${data.chinese ? `
        <span class="el-chinese-hint" id="el-chinese-hint" title="Show Chinese">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </span>
        <span class="el-chinese" id="el-chinese" style="display:none">${data.chinese}</span>
      ` : ''}
    </div>
    <div class="el-definition">${data.definition}</div>
    <div class="el-example">"${data.example}"</div>
    <button class="el-save-btn" id="el-save">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Save to Notion
    </button>
  `;

  document.getElementById('el-chinese-hint')?.addEventListener('click', () => {
    document.getElementById('el-chinese-hint').style.display = 'none';
    document.getElementById('el-chinese').style.display = 'inline';
  });

  document.getElementById('el-save').addEventListener('click', async () => {
    const btn = document.getElementById('el-save');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'saveToNotion',
        data: { ...data, pageUrl: window.location.href, pageTitle: document.title }
      });
      if (res.success) {
        btn.innerHTML = '✓ Saved!';
        btn.classList.add('el-saved');
        setTimeout(removePopup, 1200);
      } else if (res.duplicate) {
        btn.textContent = '已存在';
        btn.disabled = false;
      } else {
        btn.textContent = 'Failed — check Settings';
        btn.disabled = false;
      }
    } catch (err) {
      btn.textContent = 'Error saving';
      btn.disabled = false;
    }
  });
}

function positionPopup(el, x, y) {
  el.style.position = 'fixed';
  el.style.left = `${Math.min(x, window.innerWidth - 300)}px`;
  el.style.top = `${y + 12}px`;
  el.style.zIndex = '2147483647';
}

function removeTrigger() {
  if (triggerBtn) { triggerBtn.remove(); triggerBtn = null; }
}

function removePopup() {
  if (popup) { popup.remove(); popup = null; }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'scrollToWord') {
    scrollToWordOnPage(message.word);
  }
});

function scrollToWordOnPage(word) {
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

  const lowerWord = word.toLowerCase();
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const idx = node.textContent.toLowerCase().indexOf(lowerWord);
    if (idx === -1) continue;

    const range = document.createRange();
    range.setStart(node, idx);
    range.setEnd(node, idx + word.length);

    const rect = range.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 3, behavior: 'smooth' });

    try {
      const mark = document.createElement('mark');
      mark.id = 'el-word-highlight';
      mark.style.cssText = 'all: unset; background: #ffeb3b; border-radius: 3px; padding: 1px 2px; transition: background 1.5s ease;';
      range.surroundContents(mark);
      setTimeout(() => {
        mark.style.background = 'transparent';
        setTimeout(() => mark.replaceWith(...mark.childNodes), 1500);
      }, 1500);
    } catch (e) { /* scroll without highlight if DOM boundary issue */ }
    break;
  }
}
