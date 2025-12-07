const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');

const LB_HOST = 'localhost';
const LB_PORT = 8080;

// how many requests per batch to evaluate
const BATCH_SIZE = 200;
// threshold: if canary error rate > 20%, rollback
const ERROR_THRESHOLD = 0.2;

// Simple function to call LB once and return {statusCode, body}
function callLb() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: LB_HOST,
      port: LB_PORT,
      path: '/',
      method: 'GET',
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Naive way to detect if response came from canary (backend2)
// We rely on the body containing a known marker string.
function isCanaryResponse(body) {
  return body.includes('Backend 2');
}

// Naive rollback = edit nginx.conf to set canary weight=0 and reload nginx
function rollbackCanary() {
  console.log("🚨 Rolling back canary: setting backend2 weight=0");

  // 1. Read nginx.conf
  let conf = fs.readFileSync('./nginx.conf', 'utf-8');

  // 2. Replace weight for backend2
  conf = conf.replace(
    /server backend2:3002 weight=\d+/,
    'server backend2:3002 weight=0'
  );

  fs.writeFileSync('./nginx.conf', conf, 'utf-8');
  console.log("✅ Updated nginx.conf - backend2 weight=0");

  // 3. Reload Nginx in running container
  try {
    execSync('docker-compose restart nginx', { stdio: 'inherit' });
    console.log("✅ Nginx restarted with rollback config");
  } catch (err) {
    console.error("❌ Failed to restart nginx:", err.message);
  }
}

async function runMonitor() {
  let totalCanary = 0;
  let failedCanary = 0;

  console.log(`📊 Starting canary monitor. Batch size: ${BATCH_SIZE}`);

  for (let i = 0; i < BATCH_SIZE; i++) {
    try {
      const { statusCode, body } = await callLb();

      if (isCanaryResponse(body)) {
        totalCanary++;
        if (statusCode >= 500) {
          failedCanary++;
        }
      }

      // tiny delay between calls
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error("Request error:", err.message);
    }
  }

  console.log(`Total canary requests: ${totalCanary}`);
  console.log(`Failed canary requests: ${failedCanary}`);

  if (totalCanary === 0) {
    console.log("⚠ No canary traffic observed; nothing to do.");
    return;
  }

  const errorRate = failedCanary / totalCanary;
  console.log(`📈 Canary error rate: ${(errorRate * 100).toFixed(2)}%`);

  if (errorRate > ERROR_THRESHOLD) {
    console.log("❌ Error rate too high; triggering rollback.");
    rollbackCanary();
  } else {
    console.log("✅ Canary is healthy enough; no rollback.");
  }
}

runMonitor();
