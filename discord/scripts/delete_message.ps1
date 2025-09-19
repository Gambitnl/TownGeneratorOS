param(
    [string]$ChannelId,
    [string]$MessageId
)

function Initialize-Agent {
    $agentType = "gemini" # Default for me
    $configFile = "discord/config/.env.$agentType"
    if (Test-Path $configFile) {
        Get-Content $configFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim('"'), "Process") }
        }
        Write-Host "[Init] Loaded config for $agentType from $configFile"
    } else {
        Write-Host "[ERROR] Agent-specific config not found at $configFile." -ForegroundColor Red
    }
}

Initialize-Agent

$ErrorActionPreference = 'Stop'

$token = $env:DISCORD_BOT_TOKEN
if (-not $token) {
    Write-Host "DISCORD_BOT_TOKEN environment variable not set."
    exit 1
}

$url = "https://discord.com/api/v10/channels/$ChannelId/messages/$MessageId"

try {
    curl.exe -X DELETE -H "Authorization: Bot $token" $url
}
catch {
    Write-Host "Error deleting message: $_"
    exit 1
}