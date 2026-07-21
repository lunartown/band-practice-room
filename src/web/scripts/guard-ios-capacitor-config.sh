#!/bin/sh
set -eu

CONFIG_PATH="${PROJECT_DIR:-$(pwd)}/App/capacitor.config.json"
PUBLIC_INDEX_PATH="${PROJECT_DIR:-$(pwd)}/App/public/index.html"

if [ -z "${PRODUCT_BUNDLE_IDENTIFIER:-}" ]; then
  echo "error: PRODUCT_BUNDLE_IDENTIFIER is empty. Check the active Xcode scheme/configuration." >&2
  exit 1
fi

if [ ! -f "$CONFIG_PATH" ]; then
  echo "error: Missing $CONFIG_PATH" >&2
  echo "Run the matching Capacitor sync first, for example: cd src/web && npm run app:sync:prod" >&2
  exit 1
fi

if [ ! -f "$PUBLIC_INDEX_PATH" ]; then
  echo "error: Missing $PUBLIC_INDEX_PATH" >&2
  echo "Run the matching Capacitor sync first, for example: cd src/web && npm run app:sync:prod" >&2
  exit 1
fi

/usr/bin/python3 - "$CONFIG_PATH" "$PRODUCT_BUNDLE_IDENTIFIER" <<'PY'
import json
import sys

config_path, bundle_id = sys.argv[1], sys.argv[2]
with open(config_path, encoding="utf-8") as f:
    config = json.load(f)

updater = config.get("plugins", {}).get("CapacitorUpdater", {})
app_id = config.get("appId")
updater_app_id = updater.get("appId")
auto_update = updater.get("autoUpdate")
default_channel = updater.get("defaultChannel")

errors = []
if app_id != bundle_id:
    errors.append(f"Capacitor appId is {app_id!r}, but Xcode bundle id is {bundle_id!r}.")
if updater_app_id != bundle_id:
    errors.append(f"Capgo appId is {updater_app_id!r}, but Xcode bundle id is {bundle_id!r}.")

expected_by_bundle = {
    "com.hapjusil.app": (True, "production"),
    "com.hapjusil.app.dev": (True, "dev"),
    "com.hapjusil.app.local": (False, None),
}

if bundle_id in expected_by_bundle:
    expected_auto_update, expected_channel = expected_by_bundle[bundle_id]
    if auto_update is not expected_auto_update:
        errors.append(
            f"Capgo autoUpdate is {auto_update!r}, expected {expected_auto_update!r} for {bundle_id}."
        )
    if expected_channel is None:
        if default_channel is not None:
            errors.append(f"Capgo defaultChannel is {default_channel!r}, expected no channel for {bundle_id}.")
    elif default_channel != expected_channel:
        errors.append(
            f"Capgo defaultChannel is {default_channel!r}, expected {expected_channel!r} for {bundle_id}."
        )

if errors:
    print("error: Capacitor iOS generated config does not match the active Xcode scheme.", file=sys.stderr)
    for error in errors:
        print(f"error: {error}", file=sys.stderr)
    print("error: Run the matching sync command before building, e.g. `cd src/web && npm run app:sync:prod`.", file=sys.stderr)
    sys.exit(1)

print(f"Capacitor config matches {bundle_id}.")
PY
