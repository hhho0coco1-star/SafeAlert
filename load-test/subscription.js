import http from 'k6/http';
import { check, sleep } from 'k6';

// 구독 조회 정상 부하 테스트
// Rate Limit(분당 60건) 이내로 유지: 5 VUs × sleep(2s) = 약 150건/분
export const options = {
  stages: [
    { duration: '10s', target: 5  },
    { duration: '30s', target: 5  },
    { duration: '10s', target: 0  },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // 에러율 1% 미만
    http_req_duration: ['p(95)<1000'],  // 95%가 1초 이내
  },
};

export function setup() {
  const res = http.post(
    'http://localhost:8080/api/auth/login',
    JSON.stringify({ email: 'dpcks2553@naver.com', password: 'dkstpdnd@123789' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: res.json('accessToken') };
}

export default function (data) {
  const res = http.get(
    'http://localhost:8080/api/subscriptions',
    { headers: { Authorization: `Bearer ${data.token}` } }
  );

  check(res, {
    '구독 조회 성공 (200)': (r) => r.status === 200,
    '응답 시간 1초 이내':   (r) => r.timings.duration < 1000,
  });

  sleep(2);
}
