# WhatsApp → Claude Code Bridge

Send WhatsApp messages to trigger Claude Code on your machine. Claude reads and writes files, runs shell commands, and replies with the result — all via WhatsApp.

Built with [Gavi WhatsApp API](https://gaviventures.com) and the [Claude Code](https://claude.ai/code) CLI.

## How it works

```
You (WhatsApp) → Gavi webhook → Express server → claude --print → Gavi API → You (WhatsApp)
```

1. You send a WhatsApp message to your Gavi number
2. Gavi fires a webhook to this server
3. The server spawns `claude --print` with your message, pointed at a working directory
4. Claude reads/writes files and runs commands as needed
5. The response is sent back to you on WhatsApp

## Setup

### Prerequisites

- [Claude Code](https://claude.ai/code) installed and authenticated
- A [Gavi](https://gaviventures.com) account with a connected WhatsApp number
- [ngrok](https://ngrok.com) (or any public HTTPS tunnel) for local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
GAVI_API_KEY=gv_your_key_here          # from gaviventures.com/whatsapp/settings/api-keys
WEBHOOK_URL=https://your-ngrok-url.com  # public URL pointing to this server
WORK_DIR=/path/to/your/project          # directory Claude will work in
PORT=3001
```

### 3. Start a public tunnel

```bash
ngrok http 3001
# copy the https URL into WEBHOOK_URL in .env
```

### 4. Register the webhook with Gavi (run once)

```bash
npm run setup-webhook
# prints a WEBHOOK_SECRET — add it to .env
```

### 5. Start the server

```bash
npm run dev       # development (hot reload)
npm run build && npm start   # production
```

### 6. (Optional) Add Gavi as a Claude Code MCP tool

Lets Claude send WhatsApp messages directly from your terminal sessions:

```bash
./add-mcp.sh
```

## Usage

Text your Gavi WhatsApp number with any coding instruction:

> "add dark mode to the dashboard component"
> "fix the failing tests in src/api"
> "what does the auth middleware do"

Claude Code will run in the context of `WORK_DIR`, use its full tool suite (read files, write files, run bash), and reply with the result.

## Environment variables

| Variable | Description |
|---|---|
| `GAVI_API_KEY` | Gavi API key |
| `WEBHOOK_SECRET` | HMAC secret returned by `setup-webhook` |
| `WEBHOOK_URL` | Public URL where this server is reachable |
| `WORK_DIR` | Absolute path to the project Claude works in |
| `PORT` | Server port (default: `3001`) |
| `MAX_TURNS` | Max Claude Code turns per request (default: `10`) |
| `CLAUDE_TIMEOUT_MS` | Timeout in ms (default: `300000` = 5 min) |

## Project structure

```
src/
  server.ts   — Express webhook server with HMAC signature verification
  claude.ts   — Spawns claude --print as a subprocess
  whatsapp.ts — Gavi REST API client (sends chunked replies)
  setup.ts    — One-time webhook registration script
add-mcp.sh    — Adds Gavi as a Claude Code MCP tool (outbound messaging)
```

## Security

- All incoming webhooks are verified with HMAC-SHA256 (`X-Gaviventures-Signature`)
- `claude --dangerously-skip-permissions` is required for non-interactive automation — only run this server on a machine and in a directory you fully trust
- Never commit `.env` — it contains your API keys
