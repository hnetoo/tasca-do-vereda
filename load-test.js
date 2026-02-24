import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30s
    { duration: '1m', target: 50 },  // Stay at 50 users for 1m
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30s
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete below 5s
  },
};

function runLoadTest() {
  const res = http.get('http://localhost:3000/owner');
  check(res, {
    'status was 200': (r) => r.status === 200,
  });
  sleep(1);
}

export default runLoadTest;
