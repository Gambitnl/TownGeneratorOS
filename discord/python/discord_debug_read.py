import os
import sys
import json
import pathlib
import urllib.request
from typing import Optional


def load_env(files=None):
    base = pathlib.Path(__file__).resolve().parent.parent / "config"
    defaults = [base / ".env"]
    to_load = [str(p) for p in (files or defaults)]
    env = {}
    for p in to_load:
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


def _discord_request(method: str, url: str, token: str, data: Optional[dict] = None):
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


def whoami(token: str):
    return _discord_request("GET", "https://discord.com/api/v10/users/@me", token)


def get_channel(token: str, channel_id: str):
    return _discord_request("GET", f"https://discord.com/api/v10/channels/{channel_id}", token)


def get_messages(token: str, channel_id: str, limit: int = 10):
    return _discord_request(
        "GET",
        f"https://discord.com/api/v10/channels/{channel_id}/messages?limit={limit}",
        token,
    )


def list_channels(token: str, guild_id: str):
    return _discord_request("GET", f"https://discord.com/api/v10/guilds/{guild_id}/channels", token)


def main():
    env_file = None
    args = sys.argv[1:]
    if len(args) >= 2 and args[0] in ("--env", "-e"):
        env_file = args[1]
        args = args[2:]
    base = pathlib.Path(__file__).resolve().parent.parent / "config"
    load_env((str(base / ".env"),) if not env_file else (env_file,))

    token = os.environ.get("DISCORD_BOT_TOKEN")
    channel_id = (
        os.environ.get("DISCORD_AGENT_STATUS_CHANNEL")
        or os.environ.get("DISCORD_ACTIVE_WORK_CHANNEL")
    )
    guild_id = os.environ.get("DISCORD_GUILD_ID")

    if not token:
        print("[error] DISCORD_BOT_TOKEN missing in env", file=sys.stderr)
        sys.exit(2)
    if not channel_id:
        print("[error] No channel id in env (DISCORD_AGENT_STATUS_CHANNEL/ACTIVE_WORK)", file=sys.stderr)
        sys.exit(2)

    print("== WhoAmI ==")
    try:
        me = whoami(token)
        print(json.dumps(me, indent=2))
    except Exception as e:
        print(f"[error] /users/@me failed: {e}")

    print("\n== Channel Info ==")
    try:
        info = get_channel(token, channel_id)
        print(json.dumps(info, indent=2))
    except Exception as e:
        print(f"[error] /channels/{channel_id} failed: {e}")

    print("\n== Last 10 Messages ==")
    try:
        msgs = get_messages(token, channel_id, 10)
        if isinstance(msgs, list):
            for m in reversed(msgs):
                ts = (m.get("timestamp") or "")[:16]
                author = (m.get("author") or {}).get("username", "?")
                content = (m.get("content") or "[no content]").replace("\n", " ")
                print(f"[{ts}] {author}: {content}")
        else:
            print(msgs)
    except Exception as e:
        print(f"[error] Failed to read messages: {e}")

    if guild_id:
        print("\n== Guild Channels (name:id) ==")
        try:
            chans = list_channels(token, guild_id)
            if isinstance(chans, list):
                for c in chans:
                    print(f"{c.get('name')}:{c.get('id')}")
            else:
                print(chans)
        except Exception as e:
            print(f"[error] /guilds/{guild_id}/channels failed: {e}")


if __name__ == "__main__":
    main()

