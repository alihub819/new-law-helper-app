import { spawn } from 'child_process';
import http from 'http';

const PORT = 5002;
const BASE_URL = `http://localhost:${PORT}`;

function startServer() {
  console.log('Starting server for testing...');
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    env: { ...process.env, PORT: PORT.toString(), NODE_ENV: 'development' },
    stdio: 'pipe',
    shell: true
  });

  serverProcess.stdout.on('data', (data) => {
    // console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  return serverProcess;
}

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (e) {
          parsed = data; // Keep raw if not JSON
        }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  const serverProcess = startServer();

  // Wait for server to start
  console.log('Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Test 1: Health Check
    console.log('Test 1: Health Check...');
    try {
        const health = await makeRequest('/api/health'); // Assuming there is one, if not, we check root
        console.log(`Health Check Status: ${health.statusCode}`);
    } catch (e) {
        console.log('Health check failed or endpoint does not exist, trying root...');
        // If /api/health doesn't exist, we can try to fetch index.html
    }

    // Test 2: Unauthenticated Access
    console.log('Test 2: Unauthenticated Access to /api/user...');
    const unauth = await makeRequest('/api/user');
    if (unauth.statusCode === 401) {
      console.log('PASS: Correctly returned 401');
    } else {
      console.error(`FAIL: Expected 401, got ${unauth.statusCode}`);
      process.exitCode = 1;
    }

    // Test 3: Demo Login
    console.log('Test 3: Demo Login...');
    const login = await makeRequest('/api/demo-login', 'POST', {});
    if (login.statusCode === 200 && login.body && login.body.email === 'demo@lawhelper.com') {
      console.log('PASS: Demo login successful');
    } else {
      console.error(`FAIL: Demo login failed with ${login.statusCode}`);
      console.error(login.body);
      process.exitCode = 1;
    }

  } catch (error) {
    console.error('Test Execution Error:', error);
    process.exitCode = 1;
  } finally {
    console.log('Stopping server...');
    serverProcess.kill();
    // Force kill if needed
    try { process.kill(serverProcess.pid, 'SIGKILL'); } catch (e) {}
    process.exit();
  }
}

runTests();
