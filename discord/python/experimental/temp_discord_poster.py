import os
import sys
from pathlib import Path

# Use colocated discord_read_post utilities
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from discord_read_post import load_env, post_message  # type: ignore


def main():
    load_env()
    token = os.environ.get("DISCORD_BOT_TOKEN")
    if not token:
        print("Missing DISCORD_BOT_TOKEN in env", file=sys.stderr)
        sys.exit(1)

    channel_id = os.environ.get("DISCORD_ACTIVE_WORK_CHANNEL", "")
    if not channel_id:
        print("Missing channel id in env", file=sys.stderr)
        sys.exit(1)

    summary = (
        "Automated summary: Discord poster test via experimental script."
    )
    try:
        post_message(channel_id, summary)
        print("Message posted successfully.")
    except Exception as e:
        print(f"[error] Failed to post message: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()

