#!/usr/bin/env bash
# English Learning Plugin — Setup Script
# Usage: ./setup.sh [--token NOTION_TOKEN] [--parent PAGE_URL_OR_ID]
# Requires: curl, jq

set -euo pipefail

# ── Parse arguments ──────────────────────────────────────────────────────────
NOTION_TOKEN=""
PARENT_PAGE_ID=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --token)  NOTION_TOKEN="$2"; shift 2 ;;
    --parent) PARENT_RAW="$2";   shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Extract 32-char ID from URL or use as-is
if [ -n "${PARENT_RAW:-}" ]; then
  PARENT_PAGE_ID=$(echo "$PARENT_RAW" | grep -oE '[0-9a-f]{32}' | head -1 || echo "")
  [ -z "$PARENT_PAGE_ID" ] && PARENT_PAGE_ID="$PARENT_RAW"
fi

# ── Get Notion token ──────────────────────────────────────────────────────────
if [ -z "$NOTION_TOKEN" ]; then
  NOTION_TOKEN="${NOTION_API_KEY:-}"
fi
if [ -z "$NOTION_TOKEN" ]; then
  read -rp "Notion API Token (secret_...): " NOTION_TOKEN
fi

# ── Get parent page ───────────────────────────────────────────────────────────
if [ -z "$PARENT_PAGE_ID" ]; then
  echo "Notion internal integrations require a parent page."
  read -rp "Parent page URL or ID: " PARENT_RAW
  PARENT_PAGE_ID=$(echo "$PARENT_RAW" | grep -oE '[0-9a-f]{32}' | head -1 || echo "")
  [ -z "$PARENT_PAGE_ID" ] && PARENT_PAGE_ID="$PARENT_RAW"
fi

# ── Helpers ───────────────────────────────────────────────────────────────────
NOTION_VERSION="2022-06-28"
API="https://api.notion.com/v1"

notion() {
  local method="$1" endpoint="$2" data="${3:-}"
  local response
  echo "   [curl] ${method} ${endpoint}" >&2
  response=$(curl -s --max-time 30 -X "$method" "${API}${endpoint}" \
    -H "Authorization: Bearer ${NOTION_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "Notion-Version: ${NOTION_VERSION}" \
    ${data:+-d "$data"})
  echo "   [response] ${response}" >&2
  echo "$response"
}

check_id() {
  local id="$1" label="$2"
  if [ -z "$id" ] || [ "$id" = "null" ]; then
    echo "✘ Failed to get $label ID — check response above" >&2
    exit 1
  fi
  echo "   ✓ Got $label ID: $id" >&2
}

# ── Step 1: Create container page ─────────────────────────────────────────────
echo ""
echo "[1/4] Creating English Learning page..."

PARENT_JSON="{\"type\": \"page_id\", \"page_id\": \"${PARENT_PAGE_ID}\"}"

CONTAINER=$(notion POST /pages "{
  \"parent\": ${PARENT_JSON},
  \"properties\": {
    \"title\": [{\"text\": {\"content\": \"English Learning\"}}]
  }
}")
CONTAINER_ID=$(echo "$CONTAINER" | jq -r '.id')
check_id "$CONTAINER_ID" "container page"

# ── Step 2: Create Articles DB ─────────────────────────────────────────────────
echo ""
echo "[2/4] Creating Articles database..."

ARTICLES=$(notion POST /databases "{
  \"parent\": {\"page_id\": \"${CONTAINER_ID}\"},
  \"title\": [{\"text\": {\"content\": \"Articles\"}}],
  \"properties\": {
    \"Title\": {\"title\": {}},
    \"URL\":   {\"url\": {}}
  }
}")
ARTICLES_DB_ID=$(echo "$ARTICLES" | jq -r '.id')
check_id "$ARTICLES_DB_ID" "Articles DB"

# ── Step 3: Create Words DB ────────────────────────────────────────────────────
echo ""
echo "[3/4] Creating Words database..."

WORDS=$(notion POST /databases "{
  \"parent\": {\"page_id\": \"${CONTAINER_ID}\"},
  \"title\": [{\"text\": {\"content\": \"Words\"}}],
  \"properties\": {
    \"Word / Phrase\": {\"title\": {}},
    \"Part of Speech\": {\"select\": {\"options\": [
      {\"name\": \"noun\",      \"color\": \"blue\"},
      {\"name\": \"verb\",      \"color\": \"green\"},
      {\"name\": \"adjective\", \"color\": \"yellow\"},
      {\"name\": \"adverb\",    \"color\": \"orange\"},
      {\"name\": \"phrase\",    \"color\": \"purple\"},
      {\"name\": \"idiom\",     \"color\": \"pink\"}
    ]}},
    \"Definition\": {\"rich_text\": {}},
    \"Example\":    {\"rich_text\": {}},
    \"Chinese\":    {\"rich_text\": {}},
    \"Familiarity\": {\"select\": {\"options\": [
      {\"name\": \"low\",    \"color\": \"red\"},
      {\"name\": \"medium\", \"color\": \"yellow\"},
      {\"name\": \"high\",   \"color\": \"green\"}
    ]}},
    \"Date\": {\"date\": {}},
    \"Article\": {\"relation\": {
      \"database_id\": \"${ARTICLES_DB_ID}\",
      \"type\": \"dual_property\",
      \"dual_property\": {}
    }}
  }
}")
WORDS_DB_ID=$(echo "$WORDS" | jq -r '.id')
check_id "$WORDS_DB_ID" "Words DB"

# ── Step 4: Write config ───────────────────────────────────────────────────────
echo ""
echo "[4/4] Writing config..."

CONFIG_DIR="${CLAUDE_PLUGIN_DATA:-${HOME}/.claude/plugins/data/english-learning-maxlee114-plugins}"
mkdir -p "$CONFIG_DIR"
printf '%s\n%s\n' "$WORDS_DB_ID" "$ARTICLES_DB_ID" > "${CONFIG_DIR}/config"
echo "   ✓ Config saved to: ${CONFIG_DIR}/config"

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo "✅ Setup complete!"
echo ""
echo "  Words DB ID    : ${WORDS_DB_ID}"
echo "  Articles DB ID : ${ARTICLES_DB_ID}"
