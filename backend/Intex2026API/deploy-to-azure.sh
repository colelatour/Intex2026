#!/usr/bin/env bash
# Deploy this API to Azure App Service with a clean Release publish (no VS Code extension).
#
# Prerequisites: Azure CLI 2.48.1+ (`az login`), .NET 10 SDK, zip.
# Uses `az webapp deploy` (Microsoft Entra) so this works when SCM Basic Auth is OFF.
# Older `az webapp deployment source config-zip` often requires basic auth to be enabled.
#
# Usage:
#   export AZURE_RESOURCE_GROUP="your-resource-group-name"
#   ./deploy-to-azure.sh
#
# Optional:
#   export AZURE_WEBAPP_NAME="intex2026api-amcjb0aabhethbc4"   # default matches repo config

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="${AZURE_WEBAPP_NAME:-intex2026api-amcjb0aabhethbc4}"
RG="${AZURE_RESOURCE_GROUP:-}"

if [[ -z "$RG" ]]; then
  echo "Error: Set AZURE_RESOURCE_GROUP to the resource group that contains App Service \"$APP_NAME\"."
  exit 1
fi

PUBLISH_DIR="${SCRIPT_DIR}/publish-azure-staging"
ZIP_PATH="${SCRIPT_DIR}/deploy-azure.zip"

rm -rf "$PUBLISH_DIR" "$ZIP_PATH"

echo "Publishing Release build..."
dotnet publish "${SCRIPT_DIR}/Intex2026API.csproj" -c Release -o "$PUBLISH_DIR" --verbosity minimal

echo "Creating zip..."
( cd "$PUBLISH_DIR" && zip -qr "$ZIP_PATH" . )

echo "Uploading to Azure (Entra auth via az login; not SCM basic auth)..."
az webapp deploy \
  --resource-group "$RG" \
  --name "$APP_NAME" \
  --src-path "$ZIP_PATH" \
  --type zip

rm -rf "$PUBLISH_DIR" "$ZIP_PATH"
echo "Deploy finished."
