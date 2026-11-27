#!/usr/bin/env bash
# Removes the xpyb installation of the current user.  Usage: scripts/uninstall.sh --linux | --mac
# Decks, notebooks and application settings are not touched.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

remove_cli() {
  if is_own_link; then
    rm -f "$LINK"
  elif [ -e "$LINK" ] || [ -L "$LINK" ]; then
    echo "xpyb: leaving $LINK, which this installer did not create." >&2
  fi
}

remove_app() {
  [ -e "$APP_DIR" ] || return 0
  [ -f "$MARKER_FILE" ] || fail "$APP_DIR was not created by this installer; leaving it."
  rm -rf "$APP_DIR"
}

# Drops the default application entry that xdg-mime added.
remove_mime_default() {
  local list="${XDG_CONFIG_HOME:-$HOME/.config}/mimeapps.list"
  [ -f "$list" ] || return 0
  local kept
  kept="$(sed "\\#^$MIME_TYPE=xpyb\\.desktop;\\{0,1\\}\$#d" "$list")"
  printf '%s\n' "$kept" >"$list"
}

unregister_linux() {
  rm -f "$DESKTOP_FILE" "$MIME_FILE"
  remove_mime_default
  refresh_linux_databases
}

unregister_mac() {
  [ -f "$MARKER_FILE" ] || return 0
  run_if_present "$LSREGISTER" -u "$APP_DIR"
}

main() {
  set_paths "$@"
  "unregister_$TARGET"
  remove_cli
  remove_app
  echo "Removed xpyb."
}

main "$@"
