#!/usr/bin/env bash
# Erzeugt die Bilder für das README mit Firefox im Headless-Modus.
# Aufruf aus dem Projektordner: scripts/screenshots.sh
set -euo pipefail
cd "$(dirname "$0")/.."
url="file://$PWD/index.html"

shot() { # shot <Datei> <Breite> <Höhe> <#modus>
  local profile
  profile="$(mktemp -d)"
  # Deutsch, keine Einblend-Animationen, 1,5-fache Auflösung
  cat > "$profile/user.js" <<'PREFS'
user_pref("intl.accept_languages", "de-DE, de");
user_pref("ui.prefersReducedMotion", 1);
user_pref("layout.css.devPixelsPerPx", "1.5");
PREFS
  firefox --headless --profile "$profile" --no-remote --window-size="$2,$3" --screenshot "$PWD/$1" "$url$4"
  rm -rf "$profile"
}

shot docs/screenshot.png 1280 900 '#showcase'
shot docs/looks.png 720 760 '#looks'
ls -la docs/*.png
