import os
import sys
import json
import urllib.request
from typing import List


def load_env(paths=(".env.codex", ".env", ".env.template")):
    env = {}
    for p in paths:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        k, v = line.split("=", 1)
                        env[k.strip()] = v.strip().strip('"').strip("'")
    os.environ.update(env)
    return env


def post_bot_message(channel_id: str, token: str, content: str):
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    data = json.dumps({"content": content}).encode("utf-8")
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bot {token}",
            "Content-Type": "application/json",
        },
        method="POST",
        data=data,
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def chunk(text: str, limit: int = 1900) -> List[str]:
    if len(text) <= limit:
        return [text]
    parts: List[str] = []
    while text:
        if len(text) <= limit:
            parts.append(text)
            break
        cut = text.rfind("\n", 0, limit)
        if cut == -1:
            cut = limit
        parts.append(text[:cut])
        text = text[cut:].lstrip("\n")
    return parts


def main(argv: List[str]):
    load_env()
    token = os.environ.get("DISCORD_BOT_TOKEN")
    channel = (
        os.environ.get("DISCORD_ACTIVE_WORK_CHANNEL")
        or os.environ.get("DISCORD_AGENT_STATUS_CHANNEL")
    )
    if not token or not channel:
        print("Missing DISCORD_BOT_TOKEN or channel env", file=sys.stderr)
        sys.exit(2)

    # Read content from file argument or stdin
    path = None
    if len(argv) >= 2 and argv[0] in ("--file", "-f"):
        path = argv[1]
    elif len(argv) >= 1 and os.path.isfile(argv[0]):
        path = argv[0]

    if path:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read().strip()
    else:
        content = sys.stdin.read().strip()

    if not content:
        print("No content to post", file=sys.stderr)
        sys.exit(3)

    parts = chunk(content)
    total = len(parts)
    for i, p in enumerate(parts, 1):
        suffix = f" (part {i}/{total})" if total > 1 else ""
        post_bot_message(channel, token, p + suffix)
    print("Posted", total, "message(s)")


if __name__ == "__main__":
    main(sys.argv[1:])

