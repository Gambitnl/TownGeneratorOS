import os
import sys
from pathlib import Path
import json
import urllib.request


def load_env():
    base = Path(__file__).resolve().parents[1] / "config"
    env = {}
    for p in (base / ".env", base / ".env.codex", base / ".env.template"):
        if p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    os.environ.update(env)
    return env


def _discord_request(method: str, url: str, token: str, data: dict | None = None):
    headers = {"Authorization": f"Bot {token}"}
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, headers=headers, method=method, data=body)
    with urllib.request.urlopen(req) as resp:
        raw = resp.read()
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return raw.decode("utf-8", errors="replace")


def get_messages(channel_id: str, limit: int = 5):
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages?limit={limit}"
    return _discord_request("GET", url, os.environ["DISCORD_BOT_TOKEN"])


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

    latest_lines: list[str] = []
    try:
        msgs = get_messages(channel_id, limit=5)
        if isinstance(msgs, list):
            for m in reversed(msgs):
                ts = (m.get("timestamp") or "")[:16]
                author = (m.get("author") or {}).get("username", "?")
                content = m.get("content") or "[no content]"
                latest_lines.append(f"[{ts}] {author}: {content}")
            print("\n".join(latest_lines))
        else:
            print(str(msgs))
    except Exception as e:
        print(f"[error] Failed to fetch messages: {e}")


if __name__ == "__main__":
    main()

