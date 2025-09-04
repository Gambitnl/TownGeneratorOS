import os
import json
import urllib.request
import datetime
import pathlib
import sys
import http.cookiejar


def load_env(paths=(".env", ".env.codex", ".env.template")):
    env = {}
    # Merge in order; later files override earlier ones
    for p in paths:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        k, v = line.split("=", 1)
                        v = v.strip().strip('"').strip("'")
                        env[k.strip()] = v
    os.environ.update(env)
    return env


def _discord_request(method: str, url: str, token: str, data: dict | None = None):
    headers = {
        "Authorization": f"Bot {token}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "*/*"
    }
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")

    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    req = urllib.request.Request(url, headers=headers, method=method, data=body)

    with opener.open(req) as resp:
        raw = resp.read()
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return raw.decode("utf-8", errors="replace")


def _webhook_post(url: str, data: dict):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        headers={"Content-Type": "application/json"},
        method="POST",
        data=body,
    )
    with urllib.request.urlopen(req) as resp:
        raw = resp.read()
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return raw.decode("utf-8", errors="replace")


def get_messages(channel_id: str, limit: int = 5):
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages?limit={limit}"
    return _discord_request("GET", url, os.environ["DISCORD_BOT_TOKEN"])


def post_message(channel_id: str, content: str):
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    return _discord_request(
        "POST",
        url,
        os.environ["DISCORD_BOT_TOKEN"],
        {"content": content},
    )


def main():
    load_env()
    token = os.environ.get("DISCORD_BOT_TOKEN")
    if not token:
        print("Missing DISCORD_BOT_TOKEN in .env", file=sys.stderr)
        sys.exit(1)

    agent_status = (
        os.environ.get("DISCORD_AGENT_STATUS_CHANNEL")
        or os.environ.get("DISCORD_ACTIVE_WORK_CHANNEL")
    )
    active_work = (
        os.environ.get("DISCORD_ACTIVE_WORK_CHANNEL")
        or os.environ.get("DISCORD_AGENT_STATUS_CHANNEL")
    )

    hhmm = datetime.datetime.now().strftime("%H:%M")
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")

    def post_with_fallback(channel_id: str, content: str, label: str):
        try:
            post_message(channel_id, content)
            return True
        except Exception as e:
            if webhook_url:
                try:
                    _webhook_post(webhook_url, {"content": content})
                    return True
                except Exception as e2:
                    print(f"Failed to post {label} via webhook: {e2}", file=sys.stderr)
            print(f"Failed to post {label}: {e}", file=sys.stderr)
            return False

    # Announce start
    post_with_fallback(
        agent_status,
        f"🟢 [{hhmm}] AGENT_START: Codex CLI starting work on Discord IO (read+post)",
        "AGENT_START",
    )

    # Read recent messages from active work (fallback to agent status)
    latest_lines: list[str] = []
    try:
        msgs = get_messages(active_work, limit=10)
        # Ensure iterable
        if isinstance(msgs, list):
            for m in reversed(msgs):
                ts = (m.get("timestamp") or "")[:16]
                author = (m.get("author") or {}).get("username", "?")
                content = m.get("content") or "[no content]"
                latest_lines.append(f"[{ts}] {author}: {content}")
        else:
            latest_lines.append(str(msgs))
    except Exception as e:
        latest_lines.append(f"[error] Failed to fetch messages: {e}")

    # Persist last messages for local review
    outdir = pathlib.Path("agents/active")
    outdir.mkdir(parents=True, exist_ok=True)
    try:
        with open(outdir / "latest_messages.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(latest_lines))
    except Exception as e:
        print("Failed to write latest_messages.txt:", e, file=sys.stderr)

    # Post summary of first steps
    summary = "\n".join(
        [
            f"🏁 [{hhmm}] AGENT_COMPLETE: Codex CLI finished initial Discord IO (read+post)",
            "- Steps:",
            "  1) Loaded .env and verified Discord config",
            "  2) Announced start in #agent-status",
            "  3) Read last 10 messages from #active-work",
            "  4) Wrote messages to agents/active/latest_messages.txt",
            "  5) Posted this summary",
        ]
    )
    post_with_fallback(agent_status, summary, "summary")

    # End session (lifecycle close-out)
    post_with_fallback(agent_status, f"🔴 [{hhmm}] AGENT_END: Codex CLI session complete", "AGENT_END")


if __name__ == "__main__":
    main()
