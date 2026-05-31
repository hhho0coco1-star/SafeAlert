import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50  },  // 50개 WebSocket 동시 연결
    { duration: '30s', target: 50  },  // 30초 유지
    { duration: '10s', target: 0   },
  ],
  thresholds: {
    ws_connecting_duration: ['p(95)<3000'],  // 연결 수립 3초 이내
  },
};

export default function () {
  const res = ws.connect(
    'ws://localhost:8080/api/notifications/ws',
    {},
    function (socket) {
      socket.on('open', () => {
        // STOMP CONNECT 프레임 전송
        socket.send('CONNECT\naccept-version:1.2\n\n\x00');
      });

      socket.on('message', (msg) => {
        check(msg, { 'STOMP 응답 수신': (m) => m.length > 0 });
      });

      socket.setTimeout(() => socket.close(), 30000);  // 30초 후 연결 종료
    }
  );

  check(res, { 'WebSocket 연결 성공': (r) => r && r.status === 101 });

  sleep(1);
}
