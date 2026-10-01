#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BASE_APK="${ROOT_DIR}/corta-debug.apk"
OUT_DEBUG_APK="${SCRIPT_DIR}/app/build/outputs/apk/debug/app-debug.apk"
KEYSTORE="${HOME}/.android/debug.keystore"
UBER_JAR="${HOME}/bin/uber-apk-signer.jar"

if [ ! -f "${UBER_JAR}" ]; then
  echo "Downloading uber-apk-signer.jar..."
  curl -sSL -o "${UBER_JAR}" https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar
fi

echo "Updating assets in APK..."
cd "${SCRIPT_DIR}/app/src/main"
zip -u "${BASE_APK}" assets/capacitor.config.json assets/public/index.html || [ $? -eq 12 ]

echo "Signing and aligning APK..."
java -jar "${UBER_JAR}" -a "${BASE_APK}" --allowResign --overwrite --ksDebug "${KEYSTORE}"

echo "Copying to ${OUT_DEBUG_APK}..."
mkdir -p "$(dirname "${OUT_DEBUG_APK}")"
cp "${BASE_APK}" "${OUT_DEBUG_APK}"

echo "Done! APK successfully updated and signed."
