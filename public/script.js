const messagesEl = document.getElementById('messages');
const form = document.getElementById('input-form');
const input = document.getElementById('input');

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

async function sendMessage(msg) {
  const userDiv = addMessage('user', msg);
  const botDiv = addMessage('bot', '');

  const res = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let botText = '';
  let buffer = '';
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      let lines = buffer.split('\n\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            done = true;
            break;
          }
          botText += data;
          botDiv.innerHTML = botText + '<span class="cursor"></span>';
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      }
    }
    if (readerDone) break;
  }
  botDiv.textContent = botText;
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg) {
    input.value = '';
    sendMessage(msg);
  }
});
