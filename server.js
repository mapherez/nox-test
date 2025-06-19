const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

const MODEL_PATH = path.join(__dirname, 'models', 'mistral-7b.gguf');

let llama;
let session;

async function loadModel() {
  const { getLlama, LlamaChatSession } = await import('node-llama-cpp');
  llama = await getLlama();
  const model = await llama.loadModel({
    modelPath: MODEL_PATH,
    gpuLayers: 0,
    useMmap: true,
  });
  const context = await model.createContext({
    contextSize: 2048,
    threads: 4,
  });
  session = new LlamaChatSession({ contextSequence: context.getSequence() });
}

async function ask(prompt) {
  return await session.prompt(prompt, {
    maxTokens: 256,
    topK: 40,
    topP: 0.9,
    temperature: 0.8,
    seed: 0,
  });
}

function loadMemory() {
  const memPath = path.join(__dirname, 'memory.json');
  if (!fs.existsSync(memPath)) {
    fs.writeJsonSync(memPath, { nodes: [] }, { spaces: 2 });
  }
  return fs.readJsonSync(memPath);
}

function saveMemory(mem) {
  const memPath = path.join(__dirname, 'memory.json');
  fs.writeJsonSync(memPath, mem, { spaces: 2 });
}

let memory = loadMemory();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/chat', async (req, res) => {
  const userMsg = req.body.message;
  memory.nodes.push({ id: Date.now(), text: userMsg, links: [] });
  saveMemory(memory);

  const response = await ask(userMsg);
  memory.nodes.push({ id: Date.now() + 1, text: response, links: [] });
  saveMemory(memory);

  res.json({ reply: response });
});

app.post('/index', async (req, res) => {
  const folder = req.body.folder;
  const files = fs.readdirSync(folder);
  const summaries = [];
  for (const file of files) {
    const ext = path.extname(file);
    if (!['.md', '.txt', '.json'].includes(ext)) continue;
    const content = fs.readFileSync(path.join(folder, file), 'utf-8');
    const summary = await ask(`Summarize the following file:\n\n${content}`);
    summaries.push({ file, summary });
    memory.nodes.push({ id: Date.now(), text: summary, links: [] });
  }
  saveMemory(memory);
  res.json({ summaries });
});

app.post('/tasks', async (req, res) => {
  const task = req.body.task;
  const folder = path.join(__dirname, 'world');
  fs.ensureDirSync(folder);
  const steps = await ask(`Break down the task into steps:\n${task}`);
  const result = await ask(`Complete the task:\n${task}`);
  const fileName = task.toLowerCase().replace(/\s+/g, '_') + '.json';
  fs.writeJsonSync(path.join(folder, fileName), { task, steps, result }, { spaces: 2 });
  memory.nodes.push({ id: Date.now(), text: result, links: [] });
  saveMemory(memory);
  res.json({ status: 'completed', file: fileName });
});

loadModel().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
