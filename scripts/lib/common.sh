# Shared paths and helpers for install.sh and uninstall.sh. Source this file; do not run it.

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BIN_DIR="$HOME/.local/bin"
LINK="$BIN_DIR/xpyb"
MARKER=".xpyb-install"
MIME_TYPE="application/x-xpyb"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

fail() {
  echo "xpyb: $*" >&2
  exit 1
}

usage() {
  echo "Usage: $(basename "$0") --linux | --mac" >&2
  exit 2
}

# Sets TARGET and the install locations for that platform.
set_paths() {
  [ "$#" -eq 1 ] || usage
  case "$1" in
    --linux)
      TARGET=linux
      DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}"
      APP_DIR="$DATA_DIR/xpyb"
      RESOURCES="$APP_DIR/resources"
      BINARY="$APP_DIR/xpyb-app"
      SHIM="$APP_DIR/xpyb"
      MARKER_FILE="$APP_DIR/$MARKER"
      DESKTOP_FILE="$DATA_DIR/applications/xpyb.desktop"
      MIME_FILE="$DATA_DIR/mime/packages/xpyb.xml"
      ;;
    --mac)
      TARGET=mac
      APP_DIR="$HOME/Applications/xpyb.app"
      RESOURCES="$APP_DIR/Contents/Resources"
      BINARY="$APP_DIR/Contents/MacOS/Electron"
      SHIM="$RESOURCES/xpyb-cli"
      MARKER_FILE="$RESOURCES/$MARKER"
      ;;
    *) usage ;;
  esac
}

# True when ~/.local/bin/xpyb is the link this installer created.
is_own_link() {
  [ -L "$LINK" ] && [ "$(readlink "$LINK")" = "$SHIM" ]
}

# Runs a desktop database tool when the system provides it.
run_if_present() {
  command -v "$1" >/dev/null 2>&1 || return 0
  "$@" || echo "xpyb: warning: $1 failed." >&2
}

refresh_linux_databases() {
  run_if_present update-mime-database "$DATA_DIR/mime"
  run_if_present update-desktop-database "$DATA_DIR/applications"
}
