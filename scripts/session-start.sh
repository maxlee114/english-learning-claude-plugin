#!/usr/bin/env bash
CONFIG="${CLAUDE_PLUGIN_DATA}/config.json"

if [ -f "$CONFIG" ]; then
  DB_ID=$(python3 -c "import json; print(json.load(open('$CONFIG'))['notion_db_id'])" 2>/dev/null)
  if [ -n "$DB_ID" ]; then
    printf '{"additionalContext": "English Learning Plugin active. Notion DB ID: %s. Use this ID when calling Notion MCP tools. Track words whenever the user says \"add [word] to learning list\" or \"add [word] to list\" and maintain this list throughout the session."}' "$DB_ID"
    exit 0
  fi
fi

printf '{"additionalContext": "English Learning Plugin is installed but not set up yet. Please run /english-learning-setup to create your Notion database automatically."}'
