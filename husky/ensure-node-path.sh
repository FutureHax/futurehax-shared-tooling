#!/bin/bash
# Ensure node/npm/npx are on PATH for GUI-launched Git (Cursor, VS Code, Xcode),
# which inherit a stripped environment without nvm/fnm/homebrew.

command -v node >/dev/null 2>&1 && return 0

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

command -v node >/dev/null 2>&1 && return 0

if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --shell bash 2>/dev/null || fnm env)"
fi

command -v node >/dev/null 2>&1 && return 0

for dir in /opt/homebrew/bin /usr/local/bin; do
  if [ -x "$dir/node" ]; then
    export PATH="$dir:$PATH"
    return 0
  fi
done
