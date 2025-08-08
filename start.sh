#!/bin/bash

# Q MCP Manager - Quick Start Script
# This is a convenience script that calls the main server script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Q MCP Manager..."
echo "📁 Project Directory: $SCRIPT_DIR"
echo ""

# Call the main server script with all arguments
exec "$SCRIPT_DIR/scripts/server.sh" "$@"
