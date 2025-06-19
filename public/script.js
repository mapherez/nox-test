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

  const decoder = new TextDecoder();

  try {
    for await (const chunk of res.body) {
      botText += decoder.decode(chunk, { stream: true });
      botDiv.innerHTML = botText + '<span class="cursor"></span>';
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  } catch (err) {
    if (!controller.signal.aborted) throw err;
  }
  botText += decoder.decode();
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
