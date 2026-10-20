import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '15s',
  thresholds: {
    http_req_duration: ['p(95)<1500'], // target p95 under 1.5s
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const roles = ['admin', 'campus_manager', 'faculty_advisor', 'student_coordinator', 'student'];
  const role = roles[Math.floor(Math.random() * roles.length)];

  const res = http.get(`${BASE_URL}/dashboard?role=${role}`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'dashboard latency p95 under 1.5s': (r) => r.timings.duration < 1500,
  });

  sleep(0.2);
}
