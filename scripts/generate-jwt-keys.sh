#!/bin/bash
# Generate RS256 key pair for JWT signing
# Run: bash scripts/generate-jwt-keys.sh
# Paste output into .env

set -euo pipefail

echo "Generating RS256 key pair..."

PRIVATE_KEY=$(openssl genrsa 2048 2>/dev/null)
PUBLIC_KEY=$(echo "$PRIVATE_KEY" | openssl rsa -pubout 2>/dev/null)

echo ""
echo "Add the following to your .env file:"
echo ""
echo "JWT_PRIVATE_KEY=\"$(echo "$PRIVATE_KEY" | awk '{printf "%s\\n", $0}')\""
echo ""
echo "JWT_PUBLIC_KEY=\"$(echo "$PUBLIC_KEY" | awk '{printf "%s\\n", $0}')\""
echo ""
echo "Done."
