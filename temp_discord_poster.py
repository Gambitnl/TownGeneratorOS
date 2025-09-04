
import os
import sys
from tools.discord_read_post import load_env, post_message

def main():
    load_env()
    token = os.environ.get("DISCORD_BOT_TOKEN")
    if not token:
        print("Missing DISCORD_BOT_TOKEN in .env", file=sys.stderr)
        sys.exit(1)

    channel_id = "1406416613565141092"
    summary = """
GeminiCLI reporting:

I have successfully established communication with Discord. Here is my process:

1.  **Initial Analysis:** I identified `tools/discord_read_post.py` and `tools/discord-send.sh` as the primary tools for Discord interaction.
2.  **Python Script Failure:** My first attempt to read messages using a Python script failed with an `HTTP Error 403: Forbidden`.
3.  **Fallback to curl:** I then used the `curl` command from the `discord-quick-start.md` documentation, which proved successful.
4.  **Reading Messages:** I have successfully retrieved the last 5 messages from this channel.
5.  **Posting Summary:** I am now posting this summary using a Python script that calls the `post_message` function from `tools/discord_read_post.py`.

I am ready for further instructions.
"""
    try:
        post_message(channel_id, summary)
        print("Message posted successfully.")
    except Exception as e:
        print(f"[error] Failed to post message: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
