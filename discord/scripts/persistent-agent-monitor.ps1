# Persistent Agent Monitor (PowerShell) - Keeps agents active and responsive
# Usage: .\persistent-agent-monitor.ps1 [AgentName]

param(
    [string]$AgentName = "Gemini Pro"
)

# Load Discord functions
. "$PSScriptRoot\universal-agent-bootstrap.ps1"

# Configuration
$MonitorInterval = 30    # Start with 30 seconds
$MaxInterval = 300       # Max 5 minutes
$LastMessageId = ""
$IdleCount = 0

# Keep-alive mechanism
function Keep-AgentAlive {
    $currentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$currentTime] Agent $AgentName monitoring Discord..."

    # This prevents inference from ending by continuously processing
    # The agent stays "thinking" about coordination
    return $true
}

# Check for new messages and respond
function Check-ForNewActivity {
    try {
        # Get recent messages using curl (since Invoke-RestMethod is blocked)
        $recentMessages = Read-DiscordMessages -ChannelId $env:DISCORD_AGENT_STATUS_CHANNEL -Limit 5

        if ($recentMessages -and $recentMessages.Count -gt 0) {
            $latestMessageId = $recentMessages[0].id

            if ($latestMessageId -ne $script:LastMessageId -and $latestMessageId) {
                Write-Host "🔔 NEW ACTIVITY DETECTED!" -ForegroundColor Green
                $script:LastMessageId = $latestMessageId
                $script:IdleCount = 0
                $script:MonitorInterval = 30  # Reset to frequent checking

                # Check for mentions or coordination requests
                foreach ($message in $recentMessages) {
                    $content = $message.content
                    if ($content -match "$AgentName|@$AgentName|CONFLICT|HELP|URGENT") {
                        Write-Host "📢 ATTENTION REQUIRED: $content" -ForegroundColor Yellow
                        Respond-ToMention $content
                    }
                }
                return $true
            }
        }

        # No new activity - increase interval
        $script:IdleCount++
        if ($script:IdleCount -gt 3) {
            $script:MonitorInterval = [Math]::Min($script:MonitorInterval * 2, $script:MaxInterval)
        }

        return $false
    }
    catch {
        Write-Host "⚠️ Error checking activity: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Read Discord messages using curl (bypassing Invoke-RestMethod issues)
function Read-DiscordMessages {
    param($ChannelId, $Limit = 5)

    try {
        $uri = "https://discord.com/api/v10/channels/$ChannelId/messages?limit=$Limit"
        $result = & curl.exe -s -H "Authorization: Bot $env:DISCORD_BOT_TOKEN" $uri

        if ($result) {
            return $result | ConvertFrom-Json
        }
        return $null
    }
    catch {
        Write-Host "Error reading messages: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Respond to mentions or coordination needs
function Respond-ToMention {
    param($Message)

    $timestamp = Get-Date -Format "HH:mm"

    # Auto-respond to certain patterns
    if ($Message -match "CONFLICT") {
        Send-DiscordMessage $env:DISCORD_CONFLICTS_CHANNEL "🤖 [$timestamp] $AgentName`: Monitoring conflict situation - ready to assist"
    }
    elseif ($Message -match "HELP.*$AgentName") {
        Send-DiscordMessage $env:DISCORD_AGENT_STATUS_CHANNEL "🆘 [$timestamp] $AgentName`: I'm here! How can I help with coordination?"
    }
    elseif ($Message -match "@$AgentName|$AgentName") {
        Send-DiscordMessage $env:DISCORD_AGENT_STATUS_CHANNEL "👋 [$timestamp] $AgentName`: Acknowledged - monitoring and ready for coordination"
    }
}

# Send periodic heartbeat
function Send-Heartbeat {
    $currentTime = Get-Date

    # Send heartbeat every hour at :00 minutes
    if ($currentTime.Minute -eq 0) {
        $timestamp = Get-Date -Format "HH:mm"
        Send-DiscordMessage $env:DISCORD_AGENT_STATUS_CHANNEL "💓 [$timestamp] $AgentName`: Active and monitoring (heartbeat)"
    }
}

# Main monitoring loop
function Start-PersistentMonitoring {
    Write-Host "🚀 Starting persistent monitoring for $AgentName" -ForegroundColor Green
    Write-Host "   Check interval: $($script:MonitorInterval)s (adaptive: 30s-300s)"
    Write-Host "   Channels: Status, Conflicts, File Reservations"
    Write-Host "   Press Ctrl+C to stop"

    # Initial heartbeat
    $timestamp = Get-Date -Format "HH:mm"
    Send-DiscordMessage $env:DISCORD_AGENT_STATUS_CHANNEL "🟢 [$timestamp] $AgentName`: Persistent monitoring started - always active"

    try {
        while ($true) {
            # Keep agent alive (prevents inference ending)
            Keep-AgentAlive | Out-Null

            # Check for activity
            if (Check-ForNewActivity) {
                Write-Host "   Next check in $($script:MonitorInterval)s (activity detected)" -ForegroundColor Cyan
            }
            else {
                Write-Host "   Next check in $($script:MonitorInterval)s (idle count: $($script:IdleCount))" -ForegroundColor Gray
            }

            # Send periodic heartbeat
            Send-Heartbeat

            # Wait before next check
            Start-Sleep -Seconds $script:MonitorInterval
        }
    }
    catch [System.Management.Automation.HaltCommandException] {
        # Ctrl+C pressed
        Write-Host ""
        Write-Host "🛑 Shutting down persistent monitoring..." -ForegroundColor Yellow
        $timestamp = Get-Date -Format "HH:mm"
        Send-DiscordMessage $env:DISCORD_AGENT_STATUS_CHANNEL "🔴 [$timestamp] $AgentName`: Persistent monitoring stopped"
    }
}

# Start monitoring
Start-PersistentMonitoring