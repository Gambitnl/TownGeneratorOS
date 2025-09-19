# PowerShell Bootstrap for Discord Coordination - CANONICAL VERSION

# 1. INITIALIZE AGENT
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

# 2. CORE MESSAGING FUNCTIONS
function Send-DiscordMessage {
    param($ChannelId, $Message)

    # New requirement: Prepend all messages with a full ISO 8601 timestamp.
    $timestamp = Get-Date -Format "o" # ISO 8601 format
    $Message = "[$timestamp] $Message"

    # Replace \n with actual newlines
    $Message = $Message -replace '\n', "`n"

    if ($env:AGENT_DRY_RUN -eq "true") {
        Write-Host "[DRY RUN] Would send to channel ${ChannelId}: ${Message}" -ForegroundColor Yellow
        return
    }

    $body = @{ content = $Message } | ConvertTo-Json -Compress
    $response = $body | curl.exe -X POST -H "Authorization: Bot $($env:DISCORD_BOT_TOKEN)" -H "Content-Type: application/json" --data-binary '@-' "https://discord.com/api/v10/channels/$ChannelId/messages"

    if ($response -like '*"code":*') { Write-Host "[cURL Error] $response" -ForegroundColor Red }
}

function Read-DiscordMessages {
    param($ChannelId, $Limit = 50)
    $uri = "https://discord.com/api/v10/channels/$ChannelId/messages?limit=$Limit"
    $curlArgs = @(
        "-H", "Authorization: Bot $($env:DISCORD_BOT_TOKEN)",
        $uri
    )
    $response = curl.exe @curlArgs
    return $response | ConvertFrom-Json
}

# 3. COORDINATION FUNCTIONS
function Start-AgentSession {
    param($AgentName, $TaskDescription)
    $message = "(S) AGENT_START: $AgentName starting work on $TaskDescription"
    Send-DiscordMessage $env:DISCORD_AGENT_STATUS_CHANNEL $message
}

function Reserve-File {
    param($AgentName, $FilePath)
    Write-Host "Checking for conflicts on file: $FilePath"
    $messages = Read-DiscordMessages $env:DISCORD_FILE_RESERVATIONS_CHANNEL
    if ($messages) {
        foreach ($message in $messages) {
            if ($message.content -like "*FILE_RESERVE: $FilePath*") {
                Write-Host "[CONFLICT] File is already reserved by $($message.author.username)! Aborting." -ForegroundColor Red
                return
            }
        }
    }
    Write-Host "No conflicts found. Reserving file..."
    $messageText = "(L) FILE_RESERVE: $FilePath - $AgentName"
    Send-DiscordMessage $env:DISCORD_FILE_RESERVATIONS_CHANNEL $messageText
}

function Release-File {
    param($AgentName, $FilePath)
    $message = "(R) FILE_RELEASE: $FilePath - $AgentName"
    Send-DiscordMessage $env:DISCORD_FILE_RESERVATIONS_CHANNEL $message
}

function Update-Progress {
    param(
        $AgentName,
        $Progress,
        $Task,
        $TaskFile
    )
    if ($TaskFile) {
        $Task = Get-Content -Path $TaskFile -Raw
    }
    $message = "(P) PROGRESS: $Progress - $Task - $AgentName"
    Send-DiscordMessage $env:DISCORD_ACTIVE_WORK_CHANNEL $message
}

function End-AgentSession {
    param($AgentName)
    $message = "(E) AGENT_END: $AgentName session complete"
    Send-DiscordMessage $env:DISCORD_AGENT_STATUS_CHANNEL $message
}

# 4. UTILITY FUNCTIONS
function Test-DiscordConnection {
    try {
        $headers = @{ "Authorization" = "Bot $env:DISCORD_BOT_TOKEN" }
        # This still uses Invoke-RestMethod because it was proven to fail, which is a useful diagnostic.
        # If it suddenly starts working, we know something in the environment changed.
        $response = Invoke-RestMethod -Uri "https://discord.com/api/v10/users/@me" -Headers $headers
        Write-Host "✅ [Success] Connected to Discord as: $($response.username)" -ForegroundColor Green
    } catch {
        Write-Host "❌ [Failure] Could not connect to Discord." -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# --- Main Script Body ---
Initialize-Agent
Write-Host "[PowerShell] All coordination functions loaded (cURL implementation)."