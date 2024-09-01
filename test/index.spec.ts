import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Worker', () => {
	it('responds with unauthenticated by default', async () => {
		const response = await SELF.fetch('https://example.com');
		expect(response.status).toBe(401);
		expect(await response.text()).toBe('Unauthenticated');
	});
});
