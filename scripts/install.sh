#!/usr/bin/env bash
# Installs xpyb for the current user.  Usage: scripts/install.sh --linux | --mac
#
# Environment overrides:
#   XPYB_SKIP_BUILD=1    Use the existing dist/ folder instead of building.
#   XPYB_ELECTRON_DIST   Electron runtime folder (default: node_modules/electron/dist).
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

ELECTRON_DIST="${XPYB_ELECTRON_DIST:-$REPO_DIR/node_modules/electron/dist}"

# Refuses to replace anything this installer did not create.
check_targets() {
  if [ -e "$APP_DIR" ] && [ ! -f "$MARKER_FILE" ]; then
    fail "$APP_DIR exists and was not created by this installer. Move it and try again."
  fi
  if { [ -e "$LINK" ] || [ -L "$LINK" ]; } && ! is_own_link; then
    fail "$LINK already exists. Remove it (or run 'npm unlink -g xpyb') and try again."
  fi
  case "$APP_DIR" in
    *[\"\`\$\\%]*) fail "The install path contains characters a launcher cannot hold: $APP_DIR" ;;
  esac
}

build_app() {
  [ "${XPYB_SKIP_BUILD:-0}" = "1" ] && return 0
  command -v npm >/dev/null 2>&1 || fail "npm is required to build xpyb."
  cd "$REPO_DIR"
  [ -d node_modules ] || npm ci
  npm run build
}

# Copies the Electron runtime, which becomes the unpacked app.
copy_runtime() {
  rm -rf "$APP_DIR"
  mkdir -p "$(dirname "$APP_DIR")"
  if [ "$TARGET" = mac ]; then
    cp -R "$ELECTRON_DIST/Electron.app" "$APP_DIR"
  else
    cp -R "$ELECTRON_DIST" "$APP_DIR"
    mv "$APP_DIR/electron" "$BINARY"
  fi
  touch "$MARKER_FILE"
}

# Places the application files where the runtime looks for them.
copy_app_files() {
  local app="$RESOURCES/app"
  rm -rf "$app" "$RESOURCES/default_app.asar"
  mkdir -p "$app"
  local item
  for item in package.json bin electron python dist; do
    cp -R "$REPO_DIR/$item" "$app/$item"
  done
  find "$app" -name __pycache__ -type d -prune -exec rm -rf {} +
}

# Writes the command line launcher and links it into ~/.local/bin.
install_cli() {
  {
    echo '#!/usr/bin/env bash'
    printf 'ELECTRON_RUN_AS_NODE=1 XPYB_PACKAGED=1 exec %q %q "$@"\n' \
      "$BINARY" "$RESOURCES/app/bin/xpyb.js"
  } >"$SHIM"
  chmod +x "$SHIM"
  mkdir -p "$BIN_DIR"
  ln -sfn "$SHIM" "$LINK"
}

write_desktop_entry() {
  mkdir -p "$(dirname "$DESKTOP_FILE")"
  cat >"$DESKTOP_FILE" <<DESKTOP
[Desktop Entry]
Type=Application
Name=xpyb
Comment=Slide decks with runnable Python notebooks
Exec="$BINARY" %f
Icon=x-office-presentation
Terminal=false
Categories=Office;Presentation;
MimeType=$MIME_TYPE;
StartupWMClass=xpyb
DESKTOP
}

write_mime_type() {
  mkdir -p "$(dirname "$MIME_FILE")"
  cat >"$MIME_FILE" <<MIME
<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
  <mime-type type="$MIME_TYPE">
    <comment>xpyb slide deck</comment>
    <glob pattern="*.xpyb"/>
  </mime-type>
</mime-info>
MIME
}

# Chromium needs a root-owned sandbox helper where unprivileged user namespaces are restricted.
setup_sandbox() {
  local helper="$APP_DIR/chrome-sandbox"
  local setting=/proc/sys/kernel/apparmor_restrict_unprivileged_userns
  [ -f "$helper" ] && [ "$(cat "$setting" 2>/dev/null)" = "1" ] || return 0
  echo "This system needs the app sandbox helper to be owned by root."
  if [ -t 0 ] && command -v sudo >/dev/null 2>&1; then
    sudo sh -c 'chown root:root "$1" && chmod 4755 "$1"' sh "$helper" && return 0
  fi
  echo "xpyb: warning: the app will not start until you run:" >&2
  printf '  sudo chown root:root %q\n  sudo chmod 4755 %q\n' "$helper" "$helper" >&2
}

register_linux() {
  write_desktop_entry
  write_mime_type
  refresh_linux_databases
  # xdg-mime expects the settings folder to exist.
  mkdir -p "${XDG_CONFIG_HOME:-$HOME/.config}"
  run_if_present xdg-mime default xpyb.desktop "$MIME_TYPE"
  setup_sandbox
}

# Names the bundle, declares the .xpyb document type, re-signs and registers it.
register_mac() {
  local plist="$APP_DIR/Contents/Info.plist"
  plutil -replace CFBundleName -string xpyb "$plist"
  plutil -replace CFBundleDisplayName -string xpyb "$plist"
  plutil -replace CFBundleIdentifier -string dev.xpyb.app "$plist"
  plutil -replace UTExportedTypeDeclarations -json \
    '[{"UTTypeIdentifier":"dev.xpyb.deck","UTTypeDescription":"xpyb slide deck","UTTypeConformsTo":["public.json"],"UTTypeTagSpecification":{"public.filename-extension":["xpyb"]}}]' \
    "$plist"
  plutil -replace CFBundleDocumentTypes -json \
    '[{"CFBundleTypeName":"xpyb slide deck","CFBundleTypeRole":"Editor","LSHandlerRank":"Owner","LSItemContentTypes":["dev.xpyb.deck"]}]' \
    "$plist"
  # Editing the bundle breaks its signature, so sign it again for this machine.
  codesign --force --deep --sign - "$APP_DIR"
  run_if_present "$LSREGISTER" -f "$APP_DIR"
}

# Explains how to reach the command when ~/.local/bin is not searched yet.
remind_path() {
  case ":$PATH:" in
    *":$BIN_DIR:"*) echo "Run 'xpyb --help' to get started." ;;
    *)
      echo
      echo "NOTE: $BIN_DIR is not on your PATH, so 'xpyb' will not be found yet."
      echo "Add this line to your shell profile (~/.bashrc, or ~/.zshrc for zsh),"
      echo "then open a new terminal:"
      echo '  export PATH="$HOME/.local/bin:$PATH"'
      ;;
  esac
}

main() {
  set_paths "$@"
  if [ "$(id -u)" = 0 ] && [ -n "${SUDO_USER:-}" ]; then
    fail "Run this script without sudo; it asks for sudo only when it needs it."
  fi
  check_targets
  build_app
  [ -f "$REPO_DIR/dist/index.html" ] || fail "dist/ is missing. Run 'npm run build' first."
  [ -d "$ELECTRON_DIST" ] || fail "Electron runtime not found at $ELECTRON_DIST. Run 'npm ci'."
  copy_runtime
  copy_app_files
  install_cli
  "register_$TARGET"
  echo "Installed xpyb to $APP_DIR"
  remind_path
}

main "$@"
