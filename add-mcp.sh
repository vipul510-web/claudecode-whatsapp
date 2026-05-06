#!/bin/bash
# Run this after setting GAVI_API_KEY in .env to add Gavi WhatsApp as a
# Claude Code MCP tool (lets Claude send WhatsApp messages from the terminal).

set -e

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$GAVI_API_KEY" ] || [[ "$GAVI_API_KEY" == gv_your* ]]; then
  echo "Error: Set GAVI_API_KEY in your .env file first."
  exit 1
fi

claude mcp add -s user gaviwhatsapp -- npx @gaviwhatsapp/mcp --api-key "$GAVI_API_KEY"
echo "Done. Restart Claude Code for the gaviwhatsapp MCP tools to appear."
