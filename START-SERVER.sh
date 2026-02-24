#!/bin/bash
echo "================================================"
echo "  Grace Community Church — Local Server"
echo "================================================"
echo ""
echo "Starting server at http://localhost:8080"
echo "Open that link in your browser."
echo "Press Ctrl+C to stop."
echo ""
cd "$(dirname "$0")"
python3 -m http.server 8080 || python -m http.server 8080 || python -m SimpleHTTPServer 8080
