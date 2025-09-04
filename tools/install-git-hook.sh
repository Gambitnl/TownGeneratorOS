#!/usr/bin/env bash
set -euo pipefail

# Install pre-commit hook that runs tools/pre-commit-checks.sh

ROOT_DIR=$(cd -- "$(dirname -- "$0")/.." && pwd)
HOOKS_DIR="$ROOT_DIR/.git/hooks"
SRC="$ROOT_DIR/tools/pre-commit-checks.sh"
DEST="$HOOKS_DIR/pre-commit"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "Error: .git/hooks not found. Run inside a Git repo." >&2
  exit 1
fi

cat >"$DEST" <<'EOF'
#!/usr/bin/env bash
"$(git rev-parse --show-toplevel)/tools/pre-commit-checks.sh"
exit $?
EOF

chmod +x "$DEST"
echo "Installed pre-commit hook -> $DEST"

