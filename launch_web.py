from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import threading, webbrowser, socket, ipaddress

ROOT = Path(__file__).resolve().parent
ALLOWED_PATHS = {
    "/index.html",
    "/app.js",
    "/styles.css",
    "/data/chronicles_content.json",
    "/data/red_cross_story.json",
}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _serve_game_file(self, method):
        requested = unquote(urlsplit(self.path).path)
        if requested == "/":
            requested = "/index.html"
        if requested not in ALLOWED_PATHS:
            self.send_error(404)
            return
        self.path = requested
        getattr(super(), method)()

    def do_GET(self):
        self._serve_game_file("do_GET")

    def do_HEAD(self):
        self._serve_game_file("do_HEAD")

    def log_message(self, fmt, *args):
        # Keep the console useful instead of printing every asset request.
        if args and str(args[1]) not in ('200', '304'):
            super().log_message(fmt, *args)

def lan_addresses():
    addresses = set()
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
            probe.connect(("192.0.2.1", 80))
            addresses.add(probe.getsockname()[0])
    except OSError:
        pass
    try:
        addresses.update(info[4][0] for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET))
    except OSError:
        pass
    return sorted(
        address for address in addresses
        if not ipaddress.ip_address(address).is_loopback
        and not ipaddress.ip_address(address).is_link_local
        and ipaddress.ip_address(address).is_private
    )

def free_port():
    with socket.socket() as s:
        s.bind(('0.0.0.0', 0))
        return s.getsockname()[1]

def stable_port():
    # A predictable origin keeps browser localStorage save slots available on later launches.
    for port in range(8765, 8775):
        with socket.socket() as s:
            try:
                s.bind(('0.0.0.0', port))
                return port
            except OSError:
                continue
    return free_port()

if __name__ == '__main__':
    port = stable_port()
    server = ThreadingHTTPServer(('0.0.0.0', port), Handler)
    url = f'http://127.0.0.1:{port}/index.html'
    print('Chronicles of Destiny — Web Edition')
    print('Il server locale è attivo. Non chiudere questa finestra mentre giochi.')
    print('Sul PC:', url)
    addresses = lan_addresses()
    if addresses:
        print('Su telefono o tablet collegato alla stessa rete Wi-Fi:')
        for address in addresses:
            print(f'  http://{address}:{port}/index.html')
    else:
        print('Indirizzo di rete non trovato: controlla che il PC sia connesso alla rete Wi-Fi.')
    print('Usa solo una rete privata di fiducia e consenti Python nel firewall solo sulle reti private.')
    print('Il link HTTP locale non abilita la VR su Meta Quest: WebXR richiede HTTPS.')
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer chiuso.')
    finally:
        server.server_close()
