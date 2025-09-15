#!/bin/bash

# Discord General Posting Functions
# Extends the existing Discord bot API for general purpose posting and screenshots

# Resolve script dir and load env from discord/config
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../config/.env" ]; then
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/../config/.env"
fi

# Load existing Discord functions from same directory
if [ -f "$SCRIPT_DIR/discord-bot-functions.sh" ]; then
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/discord-bot-functions.sh"
fi

# Configuration
SCREENSHOT_DIR="${SCREENSHOT_DIR:-./screenshots}"
DISCORD_GENERAL_CHANNEL="${DISCORD_GENERAL_CHANNEL:-$DISCORD_ACTIVE_WORK_CHANNEL}"
DISCORD_SCREENSHOTS_CHANNEL="${DISCORD_SCREENSHOTS_CHANNEL:-$DISCORD_GENERAL_CHANNEL}"

# Create screenshots directory if it doesn't exist
mkdir -p "$SCREENSHOT_DIR"

# =============================================================================
# SCREENSHOT FUNCTIONS
# =============================================================================

take_screenshot() {
    local output_file="$1"
    local description="${2:-Screenshot}"
    
    if [ -z "$output_file" ]; then
        output_file="$SCREENSHOT_DIR/screenshot_$(date +%Y%m%d_%H%M%S).png"
    fi
    
    echo "📸 Taking screenshot: $description"
    
    # Detect platform and use appropriate screenshot tool
    case "$(uname -s)" in
        CYGWIN*|MINGW*|MSYS*|Windows_NT)
            # Windows - use PowerShell with Add-Type for screenshots
            powershell.exe -Command "
                Add-Type -AssemblyName System.Windows.Forms
                Add-Type -AssemblyName System.Drawing
                \$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
                \$bitmap = New-Object System.Drawing.Bitmap \$bounds.Width, \$bounds.Height
                \$graphics = [System.Drawing.Graphics]::FromImage(\$bitmap)
                \$graphics.CopyFromScreen(\$bounds.Location, [System.Drawing.Point]::Empty, \$bounds.Size)
                \$bitmap.Save('$output_file', [System.Drawing.Imaging.ImageFormat]::Png)
                \$graphics.Dispose()
                \$bitmap.Dispose()
            "
            ;;
        Darwin*)
            # macOS
            screencapture "$output_file"
            ;;
        Linux*)
            # Linux - try multiple tools
            if command -v gnome-screenshot &> /dev/null; then
                gnome-screenshot -f "$output_file"
            elif command -v scrot &> /dev/null; then
                scrot "$output_file"
            elif command -v import &> /dev/null; then
                import -window root "$output_file"
            else
                echo "❌ No screenshot tool available. Install gnome-screenshot, scrot, or imagemagick"
                return 1
            fi
            ;;
        *)
            echo "❌ Unsupported platform for screenshots"
            return 1
            ;;
    esac
    
    if [ -f "$output_file" ]; then
        echo "✅ Screenshot saved: $output_file"
        return 0
    else
        echo "❌ Screenshot failed"
        return 1
    fi
}

take_browser_screenshot() {
    local url="${1:-http://localhost:3000}"
    local output_file="$2"
    local wait_time="${3:-2}"
    
    if [ -z "$output_file" ]; then
        output_file="$SCREENSHOT_DIR/browser_$(date +%Y%m%d_%H%M%S).png"
    fi
    
    echo "🌐 Taking browser screenshot of: $url"
    
    # Try to use browser automation tools if available
    if command -v playwright &> /dev/null; then
        playwright screenshot --url "$url" --output "$output_file" --wait-for-timeout $((wait_time * 1000))
    elif command -v puppeteer &> /dev/null; then
        node -e "
            const puppeteer = require('puppeteer');
            (async () => {
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.goto('$url');
                await page.waitForTimeout($((wait_time * 1000)));
                await page.screenshot({path: '$output_file'});
                await browser.close();
            })();
        "
    else
        # Fallback to regular screenshot after brief delay
        echo "⏳ Waiting ${wait_time}s for page to load..."
        sleep "$wait_time"
        take_screenshot "$output_file" "Browser screenshot of $url"
    fi
}

# =============================================================================
# FILE UPLOAD FUNCTIONS
# =============================================================================

upload_file_to_discord() {
    local file_path="$1"
    local channel_id="$2"
    local message="$3"
    local filename="${4:-$(basename "$file_path")}"
    
    if [ ! -f "$file_path" ]; then
        echo "❌ File not found: $file_path"
        return 1
    fi
    
    if [ -z "$channel_id" ]; then
        echo "❌ Channel ID required"
        return 1
    fi
    
    echo "📤 Uploading file to Discord: $filename"
    
    # Create form data for file upload
    local response
    
    # Simple approach: upload file with content in separate call if needed
    response=$(curl -s -X POST \
        -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        -F "file=@$file_path;filename=$filename" \
        "https://discord.com/api/v10/channels/$channel_id/messages")
    
    # If we have a message and upload succeeded, send message in follow-up
    if echo "$response" | grep -q '"id"' && [ -n "$message" ]; then
        local message_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        post_to_discord "$message" "$channel_id"
    fi
    
    if echo "$response" | grep -q '"id"'; then
        local message_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        # Attempt to extract CDN URL if jq is available
        if command -v jq >/dev/null 2>&1; then
            local cdn_url=$(echo "$response" | jq -r '.attachments[0].url // empty')
            if [ -n "$cdn_url" ]; then
                echo "✅ File uploaded successfully (Message ID: $message_id)"
                echo "🔗 CDN URL: $cdn_url"
                mkdir -p agents/active >/dev/null 2>&1 || true
                echo "$cdn_url" > agents/active/last-upload.txt
            else
                echo "✅ File uploaded successfully (Message ID: $message_id)"
            fi
        else
            echo "✅ File uploaded successfully (Message ID: $message_id)"
        fi
        return 0
    else
        echo "❌ Upload failed: $response"
        return 1
    fi
}

upload_screenshot_to_discord() {
    local screenshot_path="$1"
    local channel_id="${2:-$DISCORD_SCREENSHOTS_CHANNEL}"
    local description="${3:-Screenshot}"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    local message="📸 **$description**
🕒 Taken: $timestamp
🤖 Agent: $(whoami)"
    
    upload_file_to_discord "$screenshot_path" "$channel_id" "$message"
}

# =============================================================================
# GENERAL POSTING FUNCTIONS
# =============================================================================

post_to_discord() {
    local message="$1"
    local channel_id="${2:-$DISCORD_GENERAL_CHANNEL}"
    local username="${3:-Claude Agent}"
    # Identity guard
    if command -v ensure_bot_identity >/dev/null 2>&1; then
        ensure_bot_identity || { echo "❌ Refusing to post: wrong bot identity"; return 1; }
    fi
    
    if [ -z "$message" ]; then
        echo "❌ Message content required"
        return 1
    fi
    
    # Use existing send_discord_message function if available
    if command -v send_discord_message &> /dev/null; then
        send_discord_message "$channel_id" "$message"
    else
        # Fallback implementation
        local response payload
        if command -v jq >/dev/null 2>&1; then
            payload=$(jq -n --arg content "$message" '{content:$content}')
        else
            # Fallback: escape double quotes; newlines usually pass through
            local esc=${message//"/\\"}
            payload="{\"content\":\"$esc\"}"
        fi
        # Robust send: pipe JSON to avoid shell quoting pitfalls
    response=$(printf '%s' "$payload" | curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        --data-binary @- \
        "https://discord.com/api/v10/channels/$channel_id/messages")
        
        if echo "$response" | grep -q '"id"'; then
            echo "✅ Message posted to Discord"
            return 0
        else
            echo "❌ Failed to post message: $response"
            return 1
        fi
    fi
}

# Post a multi-line message from a file (safe for newlines/quotes)
post_block_to_discord() {
    local file_path="$1"
    local channel_id="${2:-$DISCORD_GENERAL_CHANNEL}"
    if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
        echo "❌ Message file not found: $file_path"
        return 1
    fi
    # Identity guard
    if command -v ensure_bot_identity >/dev/null 2>&1; then
        ensure_bot_identity || { echo "❌ Refusing to post: wrong bot identity"; return 1; }
    fi
    if ! command -v jq >/dev/null 2>&1; then
        echo "❌ jq is required for post_block_to_discord"
        return 1
    fi
    local payload
    # Build JSON and pipe to curl to preserve newlines
    local response
    response=$(jq -Rs '{content: .}' "$file_path" | curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        --data-binary @- \
        "https://discord.com/api/v10/channels/$channel_id/messages")
    if echo "$response" | grep -q '"id"'; then
        echo "✅ Message posted to Discord"
        return 0
    else
        echo "❌ Failed to post message: $response"
        return 1
    fi
}

# Say a message (reads stdin), robust for multi-line content
say_discord() {
    local channel_id="${1:-$DISCORD_GENERAL_CHANNEL}"
    if [ -z "$channel_id" ]; then
        echo "❌ Channel ID required"; return 1; fi
    if command -v ensure_bot_identity >/dev/null 2>&1; then
        ensure_bot_identity || { echo "❌ Refusing to post: wrong bot identity"; return 1; }
    fi
    local response
    response=$(jq -Rs '{content: .}' | curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        --data-binary @- \
        "https://discord.com/api/v10/channels/$channel_id/messages")
    echo "$response" | grep -q '"id"' && echo "✅ Message posted" || echo "❌ Failed: $response"
}

# Say from a file (shortcut)
sayf_discord() {
    local channel_id="$1"; local file_path="$2"
    if [ -z "$channel_id" ] || [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
        echo "Usage: sayf_discord <channel_id> <file_path>"; return 1; fi
    if command -v ensure_bot_identity >/dev/null 2>&1; then
        ensure_bot_identity || { echo "❌ Refusing to post: wrong bot identity"; return 1; }
    fi
    jq -Rs '{content: .}' "$file_path" | curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        --data-binary @- \
        "https://discord.com/api/v10/channels/$channel_id/messages" >/dev/null \
        && echo "✅ Message posted" || echo "❌ Failed to post"
}

post_status_update() {
    local status="$1"
    local details="${2:-}"
    local channel_id="${3:-$DISCORD_GENERAL_CHANNEL}"
    local timestamp=$(date "+%H:%M")
    
    local message="🤖 [$timestamp] **Status Update**
📊 $status"
    
    if [ -n "$details" ]; then
        message="$message
📝 $details"
    fi
    
    post_to_discord "$message" "$channel_id"
}

post_error_report() {
    local error_message="$1"
    local context="${2:-}"
    local channel_id="${3:-$DISCORD_GENERAL_CHANNEL}"
    local timestamp=$(date "+%H:%M")
    
    local message="⚠️ [$timestamp] **Error Report**
❌ $error_message"
    
    if [ -n "$context" ]; then
        message="$message
🔍 Context: $context"
    fi
    
    post_to_discord "$message" "$channel_id"
}

# =============================================================================
# COMBINED SCREENSHOT + POSTING FUNCTIONS
# =============================================================================

screenshot_and_post() {
    local description="${1:-Screenshot}"
    local channel_id="${2:-$DISCORD_SCREENSHOTS_CHANNEL}"
    local message="${3:-}"
    
    echo "📸 Taking screenshot and posting to Discord..."
    
    local screenshot_file="$SCREENSHOT_DIR/auto_$(date +%Y%m%d_%H%M%S).png"
    
    if take_screenshot "$screenshot_file" "$description"; then
        local post_message="$description"
        if [ -n "$message" ]; then
            post_message="$post_message

$message"
        fi
        
        upload_screenshot_to_discord "$screenshot_file" "$channel_id" "$post_message"
    else
        post_error_report "Failed to take screenshot" "$description" "$channel_id"
        return 1
    fi
}

browser_screenshot_and_post() {
    local url="${1:-http://localhost:3000}"
    local description="${2:-Browser Screenshot}"
    local channel_id="${3:-$DISCORD_SCREENSHOTS_CHANNEL}"
    local wait_time="${4:-2}"
    local message="${5:-}"
    
    echo "🌐 Taking browser screenshot and posting to Discord..."
    
    local screenshot_file="$SCREENSHOT_DIR/browser_$(date +%Y%m%d_%H%M%S).png"
    
    if take_browser_screenshot "$url" "$screenshot_file" "$wait_time"; then
        local post_message="🌐 **$description**
🔗 URL: $url"
        
        if [ -n "$message" ]; then
            post_message="$post_message

$message"
        fi
        
        upload_screenshot_to_discord "$screenshot_file" "$channel_id" "$post_message"
    else
        post_error_report "Failed to take browser screenshot" "$url" "$channel_id"
        return 1
    fi
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

show_posting_help() {
    echo "🤖 Discord General Posting Functions"
    echo ""
    echo "📸 Screenshot Functions:"
    echo "  take_screenshot [file] [description]     - Take system screenshot"
    echo "  take_browser_screenshot [url] [file]     - Take browser screenshot"
    echo ""
    echo "📤 Upload Functions:"
    echo "  upload_file_to_discord <file> <channel> [message] [filename]"
    echo "  upload_screenshot_to_discord <file> [channel] [description]"
    echo ""
    echo "💬 Posting Functions:"
    echo "  post_to_discord <message> [channel] [username]"
    echo "  post_status_update <status> [details] [channel]"
    echo "  post_error_report <error> [context] [channel]"
    echo ""
    echo "🔗 Combined Functions:"
    echo "  screenshot_and_post [description] [channel] [message]"
    echo "  browser_screenshot_and_post [url] [description] [channel] [wait] [message]"
    echo ""
    echo "📁 Screenshot directory: $SCREENSHOT_DIR"
    echo "📢 Default channel: $DISCORD_GENERAL_CHANNEL"
}

# Initialize
echo "🤖 Discord General Posting Functions loaded!"
echo "💡 Use 'show_posting_help' for available commands"
