import { handler } from "./dist/server.js";
import { EventEmitter } from "events";

class MockReq extends EventEmitter {
  constructor() {
    super();
    this.method = 'GET';
    this.url = '/api/health';
    this.path = '/api/health';
    this.headers = { 'content-type': 'application/json' };
  }
}

class MockRes extends EventEmitter {
  constructor() {
    super();
    this.locals = {};
    this.statusCode = 200;
  }
  status(code) { this.statusCode = code; return this; }
  json(data) { console.log('json', data); return this; }
  send(data) { console.log('send', data); return this; }
  setHeader(k, v) { console.log('header', k, v); return this; }
  end() { console.log('end'); this.emit('finish'); return this; }
}

async function run() {
  try {
    const req = new MockReq();
    const res = new MockRes();
    await handler(req, res);
    console.log("Handler finished");
  } catch (err) {
    console.error("Handler error:", err);
  }
}

run();
