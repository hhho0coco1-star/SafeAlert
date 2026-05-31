import http from 'k6/http';
import { check, sleep } from 'k6';

// 로그인 성능 측정 테스트
// 목표: 100명 동시 로그인 시 에러율 1% 미만, 95%가 2초 이내 응답
export const options = {
  stages: [
    { duration: '10s', target: 100 },  // 10초 동안 100명까지 증가
    { duration: '30s', target: 100 },  // 30초 동안 100명 유지
    { duration: '10s', target: 0   },  // 10초 동안 0명으로 감소
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // 에러율 1% 미만
    http_req_duration: ['p(95)<2000'],  // 95%가 2초 이내
  },
};

export default function () {
  const res = http.post(
    'http://localhost:8080/api/auth/login',
    JSON.stringify({ email: 'dpcks2553@naver.com', password: 'dkstpdnd@123789' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    '로그인 성공 (200)':  (r) => r.status === 200,
    '응답 2초 이내':      (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
