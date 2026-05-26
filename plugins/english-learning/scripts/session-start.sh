#!/usr/bin/env bash
CONFIG="${CLAUDE_PLUGIN_DATA}/config"

if [ -f "$CONFIG" ]; then
  { read WORDS_DB_ID; read ARTICLES_DB_ID; } < "$CONFIG"
  if [ -n "$WORDS_DB_ID" ]; then
    printf '{"additionalContext": "English Learning Plugin active. Words DB ID: %s. Articles DB ID: %s. Use these IDs when calling Notion MCP tools. Track words whenever the user says \"add [word] to learning list\" or \"add [word] to list\" and maintain this list throughout the session."}' "$WORDS_DB_ID" "${ARTICLES_DB_ID:-not set}"
    exit 0
  fi
fi

printf '{"additionalContext": "English Learning Plugin is installed but not set up yet. Please run the setup script: scripts/setup.sh --token <notion-token> --parent <notion-page-url>"}'
