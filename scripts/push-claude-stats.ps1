# push-claude-stats.ps1
# Reads ~/.claude/stats-cache.json and POSTs it to the work-qol API.
#
# Usage:
#   .\scripts\push-claude-stats.ps1           (local dev)
#   .\scripts\push-claude-stats.ps1 -Prod     (production, reads creds from .dev.vars)

param([switch]$Prod)

$StatsFile = "$env:USERPROFILE\.claude\stats-cache.json"

if (-not (Test-Path $StatsFile)) {
    Write-Error "stats-cache.json not found at $StatsFile"
    exit 1
}

if ($Prod) {
    # Load creds from .dev.vars
    $DevVars = Join-Path $PSScriptRoot "..\\.dev.vars"
    if (-not (Test-Path $DevVars)) {
        Write-Error ".dev.vars not found"
        exit 1
    }
    Get-Content $DevVars | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
    $Url   = $env:CLAUDE_STATS_URL_PROD
    $Token = $env:CLAUDE_STATS_TOKEN_PROD
} else {
    $Url   = if ($env:CLAUDE_STATS_URL)   { $env:CLAUDE_STATS_URL }   else { "http://localhost:8788/api/claude-stats" }
    $Token = if ($env:CLAUDE_STATS_TOKEN) { $env:CLAUDE_STATS_TOKEN } else { "local-dev-token" }
}

if (-not $Url -or -not $Token) {
    Write-Error "Missing CLAUDE_STATS_URL_PROD or CLAUDE_STATS_TOKEN_PROD in .dev.vars"
    exit 1
}

$Stats = Get-Content $StatsFile -Raw | ConvertFrom-Json

$Payload = [ordered]@{
    name             = "Lance"
    lastComputedDate = $Stats.lastComputedDate
    firstSessionDate = $Stats.firstSessionDate
    totalSessions    = $Stats.totalSessions
    totalMessages    = $Stats.totalMessages
    modelUsage       = $Stats.modelUsage
    dailyActivity    = $Stats.dailyActivity
    dailyModelTokens = $Stats.dailyModelTokens
    pushedAt         = (Get-Date -Format "o")
}

$Body = $Payload | ConvertTo-Json -Depth 10

$Params = @{
    Uri         = $Url
    Method      = "POST"
    Body        = $Body
    ContentType = "application/json"
    Headers     = @{ Authorization = "Bearer $Token" }
    ErrorAction = "Stop"
}

try {
    $Response = Invoke-WebRequest @Params
    Write-Host "OK - stats pushed to $Url (HTTP $($Response.StatusCode))"
} catch {
    $Msg = $_.Exception.Message
    Write-Error "Failed to push stats: $Msg"
    exit 1
}
