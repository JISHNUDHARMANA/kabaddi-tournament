"""
Kabaddi Pro Live Synchronization & Scoring Server
Provides:
1. Static web asset serving (HTML, CSS, JS) with proper caching & MIME types.
2. Real-time match state synchronization (GET/POST /api/state).
3. Role-based security (Scorer PIN verification: POST /api/verify-pin).
4. Persistent Match History Archives (GET/POST/DELETE /api/history).
5. Cross-device live spectator broadcasting.
"""

import http.server
import socketserver
import json
import os
import sys
import time
import threading

PORT = int(os.environ.get('PORT', 8081))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIRECTORY, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

STATE_FILE = os.path.join(DATA_DIR, 'live_state.json')
HISTORY_FILE = os.path.join(DATA_DIR, 'match_history.json')
CONFIG_FILE = os.path.join(DATA_DIR, 'server_config.json')
FIXTURES_FILE = os.path.join(DATA_DIR, 'tournament_fixtures.json')
TEAMS_FILE = os.path.join(DATA_DIR, 'tournament_teams.json')
STANDINGS_FILE = os.path.join(DATA_DIR, 'tournament_standings.json')

# Global thread-safe state lock
state_lock = threading.Lock()

# Server state
server_config = {
    "scorerPin": "1234"
}

if os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            server_config.update(json.load(f))
    except Exception as e:
        print(f"Error loading config: {e}")

live_match_state = None
state_version = 1
last_updated = time.time()

if os.path.exists(STATE_FILE):
    try:
        with open(STATE_FILE, 'r', encoding='utf-8') as f:
            live_match_state = json.load(f)
            state_version = live_match_state.get('_version', 1)
            last_updated = live_match_state.get('_lastUpdated', time.time())
    except Exception as e:
        print(f"Error loading saved state: {e}")

match_history = []
if os.path.exists(HISTORY_FILE):
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            match_history = json.load(f)
    except Exception as e:
        print(f"Error loading history: {e}")


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


class KabaddiHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable caching so client always gets latest code
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Scorer-PIN')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, status_code, data):
        payload = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        global live_match_state, state_version, last_updated, match_history
        path = self.path.split('?')[0]

        if path == '/api/state':
            with state_lock:
                self.send_json(200, {
                    "version": state_version,
                    "lastUpdated": last_updated,
                    "serverTime": int(time.time() * 1000),
                    "state": live_match_state
                })
            return

        elif path == '/api/history':
            with state_lock:
                self.send_json(200, {
                    "count": len(match_history),
                    "archives": match_history
                })
            return

        elif path in ('/api/pin-hint', '/api/auth-info'):
            with state_lock:
                self.send_json(200, {
                    "scorerId": server_config.get("scorerId", "admin"),
                    "hasCustomPin": server_config.get("scorerPass", "1234") != "1234",
                    "defaultId": "admin",
                    "defaultPin": "1234"
                })
            return

        elif path == '/api/fixtures':
            data = []
            if os.path.exists(FIXTURES_FILE):
                try:
                    with open(FIXTURES_FILE, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                except Exception:
                    data = []
            self.send_json(200, data)
            return

        elif path == '/api/teams':
            data = []
            if os.path.exists(TEAMS_FILE):
                try:
                    with open(TEAMS_FILE, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                except Exception:
                    data = []
            self.send_json(200, data)
            return

        elif path == '/api/standings':
            data = []
            if os.path.exists(STANDINGS_FILE):
                try:
                    with open(STANDINGS_FILE, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                except Exception:
                    data = []
            self.send_json(200, data)
            return

        # Fallback to static files
        super().do_GET()

    def do_POST(self):
        global live_match_state, state_version, last_updated, match_history, server_config
        path = self.path.split('?')[0]

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            req_data = json.loads(body.decode('utf-8'))
        except Exception:
            self.send_json(400, {"error": "Invalid JSON payload"})
            return

        # 1. SCORER LOGIN & CREDENTIAL VERIFICATION (ID + PASSWORD)
        if path in ('/api/verify-scorer', '/api/verify-pin', '/api/login'):
            entered_id = str(req_data.get('scorerId') or req_data.get('username') or req_data.get('id', '')).strip()
            entered_pass = str(req_data.get('scorerPass') or req_data.get('password') or req_data.get('pin', '')).strip()

            target_id = str(server_config.get('scorerId', 'admin')).strip().lower()
            target_pass = str(server_config.get('scorerPass', '1234')).strip()
            target_pin = str(server_config.get('scorerPin', '1234')).strip()

            valid = False
            if entered_id:
                if (entered_id.lower() == target_id or entered_id.lower() == 'admin') and (entered_pass == target_pass or entered_pass == target_pin):
                    valid = True
            else:
                if entered_pass == target_pass or entered_pass == target_pin:
                    valid = True

            if valid:
                self.send_json(200, {
                    "success": True,
                    "token": "scorer_auth_granted_" + str(int(time.time())),
                    "role": "scorer",
                    "scorerId": server_config.get('scorerId', 'admin')
                })
            else:
                self.send_json(401, {
                    "success": False,
                    "error": f"Invalid Scorer ID or Password. (Default ID: {server_config.get('scorerId', 'admin')}, PIN/Pass: 1234)"
                })
            return

        # 2. UPDATE SCORER ID & PASSWORD
        elif path in ('/api/update-credentials', '/api/set-pin'):
            current_pass = str(req_data.get('currentPass') or req_data.get('currentPin', '')).strip()
            new_id = str(req_data.get('newScorerId') or req_data.get('newId', '')).strip()
            new_pass = str(req_data.get('newScorerPass') or req_data.get('newPass') or req_data.get('newPin', '')).strip()

            target_pass = str(server_config.get('scorerPass', '1234')).strip()
            target_pin = str(server_config.get('scorerPin', '1234')).strip()

            if current_pass != target_pass and current_pass != target_pin:
                self.send_json(401, {"success": False, "error": "Current Password verification failed"})
                return

            if new_id:
                server_config['scorerId'] = new_id
            if new_pass:
                if len(new_pass) < 4:
                    self.send_json(400, {"success": False, "error": "New password must be at least 4 characters"})
                    return
                server_config['scorerPass'] = new_pass
                server_config['scorerPin'] = new_pass

            with state_lock:
                try:
                    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                        json.dump(server_config, f, indent=2)
                except Exception as e:
                    print(f"Error saving config: {e}")

            self.send_json(200, {
                "success": True,
                "message": f"Scorer ID & Password updated! Active ID: {server_config.get('scorerId', 'admin')}",
                "scorerId": server_config.get('scorerId', 'admin')
            })
            return

        elif path == '/api/state':
            # Check PIN or header auth
            pin = self.headers.get('X-Scorer-PIN') or req_data.get('pin') or req_data.get('password')
            target_pass = str(server_config.get('scorerPass', '1234')).strip()
            target_pin = str(server_config.get('scorerPin', '1234')).strip()

            if pin != target_pass and pin != target_pin and not str(req_data.get('token', '')).startswith('scorer_auth_granted'):
                self.send_json(403, {"error": "Unauthorized: Only the designated scorer can update the match state."})
                return

            new_state = req_data.get('state')
            if not new_state:
                self.send_json(400, {"error": "Missing state data"})
                return

            with state_lock:
                state_version += 1
                last_updated = time.time()
                new_state['_version'] = state_version
                new_state['_lastUpdated'] = last_updated
                live_match_state = new_state

                # Save asynchronously / thread-safe to disk
                try:
                    with open(STATE_FILE, 'w', encoding='utf-8') as f:
                        json.dump(live_match_state, f, indent=2)
                except Exception as e:
                    print(f"Error persisting state: {e}")

            self.send_json(200, {
                "success": True,
                "version": state_version,
                "lastUpdated": last_updated
            })
            return

        elif path == '/api/history':
            # Add new match summary to archive
            summary = req_data.get('summary')
            if not summary:
                self.send_json(400, {"error": "Missing match summary"})
                return

            sum_id = summary.get('id') or summary.get('matchId')
            with state_lock:
                # Add to history (prevent duplicates by id or matchId)
                match_history = [m for m in match_history if (m.get('id') or m.get('matchId')) != sum_id]
                match_history.insert(0, summary)
                try:
                    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
                        json.dump(match_history, f, indent=2)
                except Exception as e:
                    print(f"Error saving history: {e}")

            self.send_json(200, {
                "success": True,
                "totalStored": len(match_history)
            })
            return

        elif path == '/api/fixtures':
            fixtures_data = req_data.get('fixtures')
            if fixtures_data is not None:
                with state_lock:
                    try:
                        with open(FIXTURES_FILE, 'w', encoding='utf-8') as f:
                            json.dump(fixtures_data, f, indent=2)
                    except Exception as e:
                        print(f"Error saving fixtures: {e}")
                self.send_json(200, {"success": True, "count": len(fixtures_data)})
                return
            self.send_json(400, {"error": "Missing fixtures data"})
            return

        self.send_json(404, {"error": "API route not found"})

    def do_DELETE(self):
        global match_history
        path = self.path.split('?')[0]

        if path == '/api/history':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            try:
                req_data = json.loads(body.decode('utf-8'))
            except Exception:
                req_data = {}

            match_id = req_data.get('id') or req_data.get('matchId')
            with state_lock:
                if match_id:
                    match_history = [m for m in match_history if (m.get('id') or m.get('matchId')) != match_id]
                else:
                    match_history = []
                try:
                    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
                        json.dump(match_history, f, indent=2)
                except Exception as e:
                    print(f"Error updating history: {e}")

            self.send_json(200, {"success": True, "remaining": len(match_history)})
            return

        self.send_json(404, {"error": "API route not found"})


def run():
    print(f"Starting Kabaddi Pro Sync Server on port {PORT}...")
    with ThreadedTCPServer(("", PORT), KabaddiHandler) as httpd:
        print(f"Server live at: http://localhost:{PORT}")
        print(f"Mobile/Network live at: http://10.126.219.251:{PORT}")
        print(f"Default Scorer PIN: {server_config['scorerPin']}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.shutdown()


if __name__ == '__main__':
    run()
