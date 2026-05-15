const openaiKeyInput = document.getElementById('openaiKey');
const openaiModelSelect = document.getElementById('openaiModel');
const notionKeyInput = document.getElementById('notionKey');
const notionDbIdInput = document.getElementById('notionDbId');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// Load saved settings
chrome.storage.sync.get(['openaiKey', 'openaiModel', 'notionKey', 'notionDbId'], (data) => {
  if (data.openaiKey) openaiKeyInput.value = data.openaiKey;
  if (data.openaiModel) openaiModelSelect.value = data.openaiModel;
  if (data.notionKey) notionKeyInput.value = data.notionKey;
  if (data.notionDbId) notionDbIdInput.value = data.notionDbId;
});

saveBtn.addEventListener('click', () => {
  const openaiKey = openaiKeyInput.value.trim();
  const openaiModel = openaiModelSelect.value;
  const notionKey = notionKeyInput.value.trim();
  const notionDbId = notionDbIdInput.value.trim();

  chrome.storage.sync.set({ openaiKey, openaiModel, notionKey, notionDbId }, () => {
    status.textContent = '✓ Settings saved!';
    setTimeout(() => status.textContent = '', 2000);
  });
});
