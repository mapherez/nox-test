const messagesEl = document.getElementById('messages');
const form = document.getElementById('input-form');
const input = document.getElementById('input');
const stopButton = document.getElementById('stop-button');

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

  const controller = new AbortController();
  stopButton.disabled = false;
  stopButton.style.display = 'inline-block';
  stopButton.onclick = () => {
    controller.abort();
    stopButton.disabled = true;
  };

  let botText = '';
  let res;
  try {
    res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      botDiv.textContent = botText;
      stopButton.style.display = 'none';
      return;
    }
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let done = false;

  try {
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
  } catch (err) {
    if (!controller.signal.aborted) throw err;
  }
  botDiv.textContent = botText;
  messagesEl.scrollTop = messagesEl.scrollHeight;
  stopButton.disabled = true;
  stopButton.style.display = 'none';
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg) {
    input.value = '';
    sendMessage(msg);
  }
});
