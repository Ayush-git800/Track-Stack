import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '15s',
  thresholds: {
    http_req_duration: ['p(95)<1000'], // p95 under 1s
    http_req_failed: ['rate<0.01'],    // error rate under 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const studentIndex = __VU % 500;
  const payload = JSON.stringify({
    userId: `std-load-${String(studentIndex + 1).padStart(4, '0')}`,
    sessionId: 'sess-load-test-01',
    token: 'ts_chk_test_load_token',
    lat: 28.5355,
    lon: 77.391,
    deviceFingerprint: `dev-vu-${__VU}`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/checkin`, payload, params);

  check(res, {
    'status is 200 or 409': (r) => r.status === 200 || r.status === 409,
    'latency p95 under 1s': (r) => r.timings.duration < 1000,
  });

  sleep(0.1);
}
