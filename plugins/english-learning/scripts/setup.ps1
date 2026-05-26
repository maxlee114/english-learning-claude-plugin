# English Learning Plugin — Setup Script (Windows)
# Usage: .\setup.ps1 [-Token NOTION_TOKEN] [-Parent PAGE_URL_OR_ID]
# Requires: PowerShell 5.1+

param(
    [string]$Token = "",
    [string]$Parent = ""
)

$ErrorActionPreference = "Stop"
$NOTION_VERSION = "2022-06-28"
$API = "https://api.notion.com/v1"

# ── Get Notion token ──────────────────────────────────────────────────────────
if (-not $Token) {
    $Token = $env:NOTION_API_KEY
}
if (-not $Token) {
    $Token = Read-Host "Notion API Token (secret_...)"
}

# ── Get parent page ───────────────────────────────────────────────────────────
if (-not $Parent) {
    Write-Host "Notion internal integrations require a parent page."
    $Parent = Read-Host "Parent page URL or ID"
}

# Extract 32-char ID from URL
if ($Parent -match "([0-9a-f]{32})") {
    $ParentPageId = $Matches[1]
} else {
    $ParentPageId = $Parent
}

# ── Helpers ───────────────────────────────────────────────────────────────────
function Invoke-Notion {
    param([string]$Method, [string]$Endpoint, [string]$Body = "")

    Write-Host "   [curl] $Method $Endpoint" -ForegroundColor DarkGray

    $headers = @{
        "Authorization"  = "Bearer $Token"
        "Content-Type"   = "application/json"
        "Notion-Version" = $NOTION_VERSION
    }

    $params = @{
        Method  = $Method
        Uri     = "$API$Endpoint"
        Headers = $headers
    }
    if ($Body) { $params.Body = $Body }

    $response = Invoke-RestMethod @params
    Write-Host "   [response] $($response | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
    return $response
}

function Check-Id {
    param([string]$Id, [string]$Label)
    if (-not $Id -or $Id -eq "null") {
        Write-Host "✘ Failed to get $Label ID — check response above" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ Got $Label ID: $Id" -ForegroundColor Green
}

# ── Step 1: Create container page ─────────────────────────────────────────────
Write-Host ""
Write-Host "[1/4] Creating English Learning page..."

$containerBody = @{
    parent     = @{ type = "page_id"; page_id = $ParentPageId }
    properties = @{
        title = @(@{ text = @{ content = "English Learning" } })
    }
} | ConvertTo-Json -Depth 10

$container = Invoke-Notion -Method POST -Endpoint "/pages" -Body $containerBody
$containerId = $container.id
Check-Id $containerId "container page"

# ── Step 2: Create Articles DB ─────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/4] Creating Articles database..."

$articlesBody = @{
    parent     = @{ page_id = $containerId }
    title      = @(@{ text = @{ content = "Articles" } })
    properties = @{
        "Title" = @{ title = @{} }
        "URL"   = @{ url = @{} }
    }
} | ConvertTo-Json -Depth 10

$articles = Invoke-Notion -Method POST -Endpoint "/databases" -Body $articlesBody
$articlesDbId = $articles.id
Check-Id $articlesDbId "Articles DB"

# ── Step 3: Create Words DB ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Creating Words database..."

$wordsBody = @{
    parent     = @{ page_id = $containerId }
    title      = @(@{ text = @{ content = "Words" } })
    properties = @{
        "Word / Phrase"  = @{ title = @{} }
        "Part of Speech" = @{ select = @{ options = @(
            @{ name = "noun";      color = "blue" }
            @{ name = "verb";      color = "green" }
            @{ name = "adjective"; color = "yellow" }
            @{ name = "adverb";    color = "orange" }
            @{ name = "phrase";    color = "purple" }
            @{ name = "idiom";     color = "pink" }
        )}}
        "Definition"     = @{ rich_text = @{} }
        "Example"        = @{ rich_text = @{} }
        "Chinese"        = @{ rich_text = @{} }
        "Familiarity"    = @{ select = @{ options = @(
            @{ name = "low";    color = "red" }
            @{ name = "medium"; color = "yellow" }
            @{ name = "high";   color = "green" }
        )}}
        "Date"           = @{ date = @{} }
        "Article"        = @{ relation = @{
            database_id   = $articlesDbId
            type          = "dual_property"
            dual_property = @{}
        }}
    }
} | ConvertTo-Json -Depth 10

$words = Invoke-Notion -Method POST -Endpoint "/databases" -Body $wordsBody
$wordsDbId = $words.id
Check-Id $wordsDbId "Words DB"

# ── Step 4: Write config ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Writing config..."

$pluginData = $env:CLAUDE_PLUGIN_DATA
if (-not $pluginData) {
    $pluginData = "$env:USERPROFILE\.claude\plugins\data\english-learning-maxlee114-plugins"
}

New-Item -ItemType Directory -Force -Path $pluginData | Out-Null
$configPath = Join-Path $pluginData "config"
"$wordsDbId`n$articlesDbId" | Set-Content -Path $configPath -Encoding UTF8
Write-Host "   ✓ Config saved to: $configPath" -ForegroundColor Green

# ── Done ───────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Words DB ID    : $wordsDbId"
Write-Host "  Articles DB ID : $articlesDbId"
