import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '10s', target: 0  },
  ],
  thresholds: {
    ws_connecting:      ['p(95)<3000'],  // 연결 수립 3초 이내
    ws_session_duration: ['p(95)<35000'], // 세션 30초 이상 유지
  },
};

// 테스트 시작 전 로그인해서 토큰 획득
export function setup() {
  const res = http.post(
    'http://localhost:8080/api/auth/login',
    JSON.stringify({ email: 'dpcks2553@naver.com', password: 'dkstpdnd@123789' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: res.json('data.accessToken') };
}

export default function (data) {
  let connected = false;

  const res = ws.connect(
    'ws://localhost:8080/api/notifications/ws',
    { headers: { Authorization: `Bearer ${data.token}` } },
    function (socket) {
      socket.on('open', () => {
        connected = true;
        // STOMP CONNECT 프레임 전송 (JWT 인증 포함)
        socket.send(
          `CONNECT\naccept-version:1.2\nAuthorization:Bearer ${data.token}\n\n\x00`
        );
      });

      socket.on('message', () => {});
      socket.on('error', () => { connected = false; });

      // 30초 유지 후 종료
      socket.setTimeout(() => socket.close(), 30000);
    }
  );

  check(null, { 'WebSocket 연결 성공': () => connected });

  sleep(1);
}
