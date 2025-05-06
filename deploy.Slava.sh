#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

npm i

# Script to deploy a custom manifest file
# 1. Create a backup of the original manifest.json
# 2. Copy the content of manifest.Slava.json to manifest.json
# 3. Run 'npm run upload'
# 4. Restore the original manifest.json from the backup
# 5. Delete the temporary backup

echo "Starting custom deployment process..."

# 1. Create a backup of the original manifest.json
echo "Creating backup of original manifest.json..."
cp manifest.json manifest.json.backup

# 2. Copy the content of manifest.Slava.json to manifest.json
echo "Replacing manifest.json with manifest.Slava.json..."
cp manifest.Slava.json manifest.json

# 3. Run 'npm run upload'
echo "Running npm run upload..."
npm run build && npm run upload -- --host https://detox-app.youtrack.cloud/ --token ${CLOUD_TOKEN}


# 4. Restore the original manifest.json from the backup
echo "Restoring original manifest.json..."
cp manifest.json.backup manifest.json

# 5. Delete the temporary backup
echo "Cleaning up temporary backup..."
rm manifest.json.backup

echo "Custom deployment completed successfully!"