import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * DPapp Enterprise Load Test
 * 
 * Simulates high-volume webhook ingestion and sync processing.
 * 
 * Run with: k6 run load-test.js
 */

export const options = {
    stages: [
        { duration: '1m', target: 50 },  // Ramp up to 50 users
        { duration: '3m', target: 50 },  // Stay at 50 users
        { duration: '1m', target: 100 }, // Peak at 100 concurrent webhooks
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests must complete under 2s (sync processing)
        http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
    },
};

const BASE_URL = __ENV.APP_URL || 'http://localhost:3000';
const STORE_ID = __ENV.STORE_ID || 'test-store-enterprise';

export default function () {
    // 1. Simulate a Shopify Product Update Webhook
    const shopifyPayload = JSON.stringify({
        id: Math.floor(Math.random() * 1000000),
        title: "Load Test Item",
        variants: [{ id: 123, inventory_quantity: Math.floor(Math.random() * 100) }]
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Topic': 'products/update',
            'X-Shopify-Hmac-Sha256': 'dummy-signature-for-load-test',
        },
    };

    const res = http.post(`${BASE_URL}/api/webhooks/shopify/${STORE_ID}`, shopifyPayload, params);

    check(res, {
        'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    });

    // 2. Simulate a Price Conflict Resolution check
    const conflictRes = http.get(`${BASE_URL}/api/products/conflicts?storeId=${STORE_ID}`, {
        headers: { 'Authorization': `Bearer dummy-token` }
    });

    check(conflictRes, {
        'conflicts list ok': (r) => r.status === 200 || r.status === 401, // 401 is expected if no real token
    });

    sleep(1);
}
