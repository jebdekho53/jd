/**
 * k6 load test — storefront read paths.
 *
 * Simulates buyers browsing the catalog, searching, and checking deliverability
 * (the read traffic that spikes during a sale). Run against STAGING, never prod.
 *
 * Install k6:  https://k6.io/docs/get-started/installation/
 * Run:
 *   BASE_URL=https://staging-api.jebdekho.com k6 run scripts/load-test.k6.js
 *   BASE_URL=http://127.0.0.1:3001 k6 run scripts/load-test.k6.js   # local
 *
 * Tune the ramp with --stage or the STAGES below. Start small.
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const API = `${BASE_URL}/api/v1`;

// A serviceable Delhi lat/lng + pincode for deliverability/search calls.
const LAT = __ENV.LAT || '28.6139';
const LNG = __ENV.LNG || '77.2090';
const PINCODE = __ENV.PINCODE || '110001';
const SEARCH_TERMS = ['milk', 'rice', 'bread', 'eggs', 'oil', 'atta', 'sugar', 'tea'];

const errorRate = new Rate('failed_requests');
const searchLatency = new Trend('search_latency_ms', true);

export const options = {
  scenarios: {
    browse: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },   // warm up
        { duration: '1m', target: 100 },    // ramp to 100 concurrent buyers
        { duration: '2m', target: 100 },    // hold — this is your steady-state check
        { duration: '1m', target: 300 },    // spike (flash-sale surge)
        { duration: '1m', target: 0 },      // ramp down
      ],
      gracefulRampDown: '20s',
    },
  },
  thresholds: {
    // Fail the run if the platform can't keep these SLOs — tune to your target.
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    failed_requests: ['rate<0.01'], // <1% errors
    search_latency_ms: ['p(95)<600'],
  },
};

function ok(res) {
  const good = res.status >= 200 && res.status < 400;
  errorRate.add(!good);
  return good;
}

export default function () {
  group('health', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health 2xx': (r) => ok(r) });
  });

  group('catalog browse', () => {
    const home = http.get(`${API}/buyer/discover/home?lat=${LAT}&lng=${LNG}`);
    check(home, { 'home ok': (r) => ok(r) });

    const stores = http.get(`${API}/buyer/map/stores?lat=${LAT}&lng=${LNG}`);
    check(stores, { 'stores ok': (r) => ok(r) });
  });

  group('search', () => {
    const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
    const res = http.get(`${API}/buyer/search?q=${term}&lat=${LAT}&lng=${LNG}`);
    searchLatency.add(res.timings.duration);
    check(res, { 'search ok': (r) => ok(r) });

    const sugg = http.get(`${API}/buyer/search/suggestions?q=${term.slice(0, 3)}`);
    check(sugg, { 'suggestions ok': (r) => ok(r) });
  });

  group('deliverability', () => {
    const res = http.get(`${API}/locations/pincodes/${PINCODE}`);
    check(res, { 'pincode lookup ok': (r) => ok(r) });
  });

  sleep(Math.random() * 2 + 1); // 1–3s think time between buyer actions
}
