# WhatsApp Claude Code Bridge

**Control Claude Code from WhatsApp. Send a message, get real code changes back — on your actual machine.**

> Code from anywhere. No laptop open. No IDE. Just your phone.

---

## What this is

This bridge connects WhatsApp to [Claude Code](https://claude.ai/code) running on your machine. You send a message from your phone, and Claude reads your files, writes code, runs commands, and replies with the result — all without you touching your computer.

It uses a WhatsApp API (powered by [Gavi](https://gaviventures.com)) to receive and send messages, and runs `claude --print` locally to process each request.

```
You (WhatsApp) → webhook → Express server → claude --print → webhook → You (WhatsApp)
```

---

## Why this is different from the Claude app

| | Claude App / Claude.ai | This bridge |
|---|---|---|
| Reads your actual files | No | **Yes** |
| Writes code to your disk | No | **Yes** |
| Runs shell commands | No | **Yes** |
| Works in your repo | No | **Yes** |
| Needs a laptop open | Yes | **No** |
| Works from your phone | Partially (chat only) | **Yes — fully** |

The Claude app gives you a conversation. This gives you a **remote coding agent** that operates on your actual project.

---

## Use cases

**For developers**
- Push a quick fix while commuting: *"fix the failing auth test in src/api"*
- Check in on a long-running script: *"what's in the last 50 lines of output.log"*
- Ship small features without opening a laptop: *"add a /health endpoint to the Express server"*

**For non-developers / vibe coders**
- Build and modify your project using plain English, from your phone
- No IDE knowledge needed — describe what you want, Claude does it
- Perfect if you work with a developer who set this up for you

**For automation / teams**
- Trigger code generation from anywhere
- Run Claude against a shared codebase on a server
- Chain with other automations (Zapier, Make, etc.) via the webhook

---

## How it works

1. You text your WhatsApp number with a task
2. The message hits an Express server running locally (or on a VPS)
3. The server spawns `claude --print` pointed at your project directory
4. Claude reads/writes files and runs shell commands
5. The response is chunked and sent back to you on WhatsApp

---

## Setup

### Prerequisites

- [Claude Code](https://claude.ai/code) installed and authenticated (`claude --version`)
- A WhatsApp API number — this project uses [Gavi](https://gaviventures.com) (free tier available)
- [ngrok](https://ngrok.com) or any public HTTPS tunnel (for local dev)
- Node.js 18+

### 1. Clone and install

```bash
git clone https://github.com/vipul510-web/claudecode-whatsapp.git
cd claudecode-whatsapp
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
GAVI_API_KEY=gv_your_key_here          # from your WhatsApp API dashboard
WEBHOOK_URL=https://your-ngrok-url.com  # public URL pointing to this server
WORK_DIR=/path/to/your/project          # the directory Claude will work in
PORT=3001
```

### 3. Start a public tunnel

```bash
ngrok http 3001
# copy the https:// URL into WEBHOOK_URL in .env
```

### 4. Register the webhook (run once)

```bash
npm run setup-webhook
# prints a WEBHOOK_SECRET — add it to .env
```

### 5. Start the server

```bash
npm run dev          # development (hot reload)
npm run build && npm start   # production
```

### 6. (Optional) Let Claude send WhatsApp messages from your terminal

```bash
./add-mcp.sh
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GAVI_API_KEY` | Yes | WhatsApp API key |
| `WEBHOOK_SECRET` | Yes | HMAC secret from `setup-webhook` |
| `WEBHOOK_URL` | Yes | Public URL this server is reachable at |
| `WORK_DIR` | Yes | Absolute path to the project Claude works in |
| `PORT` | No | Server port (default: `3001`) |
| `MAX_TURNS` | No | Max Claude turns per request (default: `10`) |
| `CLAUDE_TIMEOUT_MS` | No | Timeout in ms (default: `300000` = 5 min) |

---

## Project structure

```
src/
  server.ts     — Express webhook server with HMAC signature verification
  claude.ts     — Spawns claude --print as a subprocess
  whatsapp.ts   — WhatsApp REST API client (sends chunked replies)
  setup.ts      — One-time webhook registration script
add-mcp.sh      — Adds WhatsApp as a Claude Code MCP tool (outbound messaging)
```

---

## Security

- All incoming webhooks are verified with HMAC-SHA256
- `claude --dangerously-skip-permissions` is required for non-interactive use — only point `WORK_DIR` at a project you fully trust
- Never commit `.env` — it contains your API keys

---

## Swap the WhatsApp API

The WhatsApp layer is isolated in `src/whatsapp.ts`. If you want to use Twilio, Meta's Cloud API, or any other provider, replace that file — the rest of the server doesn't care.

---

## Tags

`claude-code` · `whatsapp` · `ai-agent` · `coding-assistant` · `remote-coding` · `vibe-coding` · `llm-automation` · `claude` · `anthropic` · `webhook` · `typescript` · `nodejs` · `developer-tools` · `mobile-dev` · `ai-tools`
