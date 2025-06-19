# NOX – Local AI Agent

NOX is a simple local AI agent that runs entirely on your machine. It uses [llama.cpp](https://github.com/ggerganov/llama.cpp) via the `node-llama-cpp` package and provides a small web interface.

## Features

- Web interface served with Express; open [http://localhost:3000](http://localhost:3000) after starting.
- Chat style interaction that stores conversation in `memory.json`.
- Can index folders of Markdown, text, and JSON files and remember summaries.
- Basic task system for worldbuilding or similar creative tasks.
- Designed for easy extension.

## Setup

1. **Install Node.js** (v18 or later) and Git for Windows.
2. Clone this repository and install dependencies:

```bash
npm install
```

3. **Download a llama.cpp model** in the newer `gguf` format. Place your file at `models/mistral-7b.gguf` (create the `models` folder if needed).

   Example for Windows using PowerShell:
   ```powershell
   mkdir models
   # Copy your GGUF model into models\mistral-7b.gguf
   ```

4. **Run the agent**

```bash
npm run agent
```

Then open your browser at [http://localhost:3000](http://localhost:3000) and start chatting.

The conversation memory is stored in `memory.json` so it persists between sessions. You can reset it by deleting this file.

### Optional: Index an existing folder

Use a tool like cURL or a script to call the `/index` endpoint with a JSON body:

```bash
curl -X POST http://localhost:3000/index -H "Content-Type: application/json" -d '{"folder":"C:/Path/To/Vault"}'
```

This will summarize supported files in the folder and store the results in memory.

## Notes

- All processing happens locally. No cloud APIs are used.
- The quality of responses depends on the model you provide.
- You can extend the code by adding new endpoints or tools in `server.js`.
