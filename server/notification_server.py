from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from datetime import datetime, timezone
import asyncio
import websockets
import threading

# WebSocket 클라이언트들을 저장
websocket_clients = set()

class NotificationHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 요청 본문 읽기
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        print("\n=== 새로운 Notification 수신 ===")
        print("=== 전체 헤더 정보 ===")
        print(f"Request Path: {self.path}")
        for header, value in self.headers.items():
            print(f"[{header}]: {value}")
        print("\n=== 전체 Body 정보 ===")
        try:
            data = json.loads(post_data)
            print(json.dumps(data, indent=2))
        except Exception as e:
            data = None
            print(f"JSON 파싱 에러: {e}")
            print("Raw body:")
            print(post_data.decode('utf-8'))

        # 디자인 툴에서 직접 보낸 manual notification 처리
        if self.path == '/manual-notification':
            print("\n=== Manual Notification (디자인 툴 DELETE) ===")
            if data:
                asyncio.run(broadcast_manual_notification(data))

            response_body = json.dumps({"message": "Manual notification processed."}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_body)))
            self.end_headers()
            self.wfile.write(response_body)
            return

        # VRQ 요청 감지
        vrq_detected = False
        if data and isinstance(data.get("m2m:sgn"), dict):
            sgn = data["m2m:sgn"]
            if sgn.get("vrq") is True:
                vrq_detected = True

        if vrq_detected:
            print("\n=== VRQ 요청 감지 ===")
            # X-M2M-RI 헤더 추출 (대소문자 무시)
            request_id = None
            for key in self.headers:
                if key.lower() == "x-m2m-ri":
                    request_id = self.headers[key].strip()
                    break
            if not request_id:
                request_id = "notify"
            print(f"Request ID: {request_id}")

            # Notify 요청 내의 subscription resource 추출
            # "rep" 필드 내의 내용을 그대로 응답의 pc에 넣음
            rep_data = {}
            try:
                # 만약 "rep" 내부에 "m2m:sub"가 있다면 그대로 사용
                rep_data = data["m2m:sgn"]["nev"]["rep"]
            except Exception as e:
                print("subscription resource 추출 실패:", e)
                rep_data = {}

            # 응답 JSON 생성: pc에 rep_data를 그대로 포함
            response_body = {
                "m2m:rsp": {
                    "rsc": 2000,
                    "rqi": request_id,
                    "pc": rep_data #단, 비워도 처리 되는 거 확인! 표준 일치는 추후 체크해야 함
                }
            }
            response_json = json.dumps(response_body, separators=(',', ':'), ensure_ascii=False)
            response_body_bytes = response_json.encode('utf-8')

            print("응답 바디 raw bytes:", response_body_bytes)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_body_bytes)))
            self.send_header('X-M2M-RI', request_id)
            self.send_header('X-M2M-RSC', '2000')
            self.send_header('X-M2M-RVI', '2a')
            self.end_headers()
            self.wfile.write(response_body_bytes)
            print(f"[VRQ] Response sent successfully with RVI=2a, RSC=2000")
            return
        else:
            print("\n=== 일반 Notify 메시지 처리 ===")

            # WebSocket으로 브라우저에 전달
            if data:
                asyncio.run(broadcast_to_websockets(data))

            response_body = json.dumps({"message": "Notification processed successfully."}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_body)))
            self.end_headers()
            self.wfile.write(response_body)

# WebSocket 서버
async def websocket_handler(websocket):
    print(f"[WS] New client connected from {websocket.remote_address}")
    websocket_clients.add(websocket)
    try:
        async for message in websocket:
            print(f"[WS] Received from client: {message}")
    except websockets.exceptions.ConnectionClosed:
        print(f"[WS] Client disconnected")
    finally:
        websocket_clients.remove(websocket)

# 모든 WebSocket 클라이언트에게 브로드캐스트
async def broadcast_to_websockets(data):
    if not websocket_clients:
        print("[WS] No clients connected")
        return

    # oneM2M notification 파싱
    try:
        sgn = data.get('m2m:sgn', {})
        nev = sgn.get('nev', {})
        rep = nev.get('rep', {})
        sur = sgn.get('sur', '')
        net = nev.get('net', 0)

        # TinyIoT 버그 우회: rep에 리소스 데이터가 있으면 CREATE로 처리
        # (TinyIoT가 CREATE 이벤트를 DELETE로 잘못 보냄)
        if rep and any(key.startswith('m2m:') for key in rep.keys()):
            # rep에 실제 리소스 데이터가 있으면 CREATE
            actual_event_type = 1  # CREATE
            # sur에서 리소스 URI 추출 (subscription URI가 아닌 실제 리소스 URI)
            # rep에서 리소스 이름 가져오기
            resource_name = None
            for key, value in rep.items():
                if key.startswith('m2m:') and isinstance(value, dict):
                    resource_name = value.get('rn', '')
                    break

            if resource_name and '/' in sur:
                # sur의 마지막 부분이 subscription 이름이면, 부모 경로 + 리소스 이름
                parent_path = '/'.join(sur.split('/')[:-1])
                actual_resource_uri = f"{parent_path}/{resource_name}"
            else:
                actual_resource_uri = sur

            print(f"[FIX] TinyIoT bug detected: net={net}, but rep has data. Treating as CREATE")
            print(f"[FIX] Resource URI: {actual_resource_uri}")
        else:
            actual_event_type = net
            actual_resource_uri = sur

        # 브라우저로 전달할 데이터
        message = {
            'type': 'resource_change',
            'eventType': actual_event_type,  # 1=CREATE, 2=UPDATE, 3=DELETE
            'resourceUri': actual_resource_uri,
            'resource': rep
        }

        message_json = json.dumps(message)
        print(f"[WS] Broadcasting to {len(websocket_clients)} clients: {message_json}")

        # 모든 클라이언트에게 전송
        await asyncio.gather(
            *[client.send(message_json) for client in websocket_clients],
            return_exceptions=True
        )
    except Exception as e:
        print(f"[WS] Error broadcasting: {e}")

# 디자인 툴에서 직접 보낸 manual notification 브로드캐스트
async def broadcast_manual_notification(data):
    if not websocket_clients:
        print("[WS] No clients connected")
        return

    try:
        # 디자인 툴이 이미 올바른 형식으로 보냄
        # { type: 'resource_change', eventType: 3, resourceUri: '...', resource: {} }
        message_json = json.dumps(data)
        print(f"[WS] Broadcasting manual notification to {len(websocket_clients)} clients: {message_json}")

        # 모든 클라이언트에게 전송
        await asyncio.gather(
            *[client.send(message_json) for client in websocket_clients],
            return_exceptions=True
        )
    except Exception as e:
        print(f"[WS] Error broadcasting manual notification: {e}")

# WebSocket 서버 시작
async def start_websocket_server():
    print("[WS] Starting WebSocket server on ws://0.0.0.0:4001")
    async with websockets.serve(websocket_handler, "0.0.0.0", 4001):
        await asyncio.Future()  # 무한 대기

# HTTP 서버를 별도 스레드에서 실행
def run_http_server():
    server = HTTPServer(('0.0.0.0', 8081), NotificationHandler)
    print("[HTTP] Notification server running on http://0.0.0.0:8081")
    server.serve_forever()

# 메인 함수
if __name__ == "__main__":
    print("╔════════════════════════════════════════════════╗")
    print("║  oneM2M Notification Server (Python)          ║")
    print("╠════════════════════════════════════════════════╣")
    print("║  HTTP Server:    http://localhost:8081        ║")
    print("║  WebSocket:      ws://localhost:4001          ║")
    print("╚════════════════════════════════════════════════╝\n")

    # HTTP 서버를 별도 스레드에서 실행
    http_thread = threading.Thread(target=run_http_server, daemon=True)
    http_thread.start()

    # WebSocket 서버를 메인 스레드에서 실행
    asyncio.run(start_websocket_server())
