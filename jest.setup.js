// jest.setup.js
import fetch, { Headers, Request, Response } from 'node-fetch';

// まだglobalThis.fetchがなければ定義
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}
