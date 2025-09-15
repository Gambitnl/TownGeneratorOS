#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/discord-bot-functions.sh"
export EXPECTED_BOT_USERNAME="${EXPECTED_BOT_USERNAME:-ClaudeCLI}"

