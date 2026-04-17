#!/usr/bin/env python3
"""
Ultra-minimal VinFast Assistant for Railway deployment
No external dependencies except standard library
"""

import os
import json
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

PORT = int(os.getenv("PORT", "8000"))


class VinFastHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            response = {
                "status": "ok",
                "version": "ultra-light",
                "uptime_seconds": time.time(),
                "message": "VinFast Assistant running",
            }
            self.wfile.write(json.dumps(response).encode())
        elif self.path == "/api/ready":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ready": True}).encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not found")

    def do_POST(self):
        if self.path == "/api/agent":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            # Mock response
            response = {
                "text": "Hello! I'm your VinFast Assistant. How can I help you with your vehicle today?",
                "agent": "ultra-light-assistant",
                "sources": [],
                "confidence": 0.9,
                "category": "greeting",
                "tool_action": None,
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not found")

    def log_message(self, format, *args):
        # Disable default logging to reduce output
        pass


if __name__ == "__main__":
    print(f"VinFast Ultra-Light Assistant starting on port {PORT}")
    server = HTTPServer(("0.0.0.0", PORT), VinFastHandler)
    print("Server ready!")
    server.serve_forever()
