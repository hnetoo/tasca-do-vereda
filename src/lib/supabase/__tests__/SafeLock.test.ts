
import { SafeLock } from '../SafeLock';

// Mock Navigator Lock API for testing
class MockLockManager {
  private heldLocks: Map<string, { name: string; release: () => void }> = new Map();
  private pendingRequests: Map<string, Array<{ resolve: (lock: any) => void; reject: (err: any) => void; signal: AbortSignal; callback: (lock: any) => Promise<void> }>> = new Map();

  async query() {
    return { held: Array.from(this.heldLocks.values()).map(l => ({ name: l.name })) };
  }

  request(name: string, options: { signal?: AbortSignal }, callback: (lock: any) => Promise<void>): Promise<any> {
    return new Promise((resolve, reject) => {
      const signal = options.signal;

      const processRequest = async () => {
        if (signal?.aborted) {
          return reject(new DOMException('Aborted', 'AbortError'));
        }

        if (this.heldLocks.has(name)) {
          // If lock is held, queue this request
          if (!this.pendingRequests.has(name)) {
            this.pendingRequests.set(name, []);
          }
          this.pendingRequests.get(name)?.push({ resolve, reject, signal: signal!, callback });
          return;
        }

        // Acquire lock
        this.heldLocks.set(name, {
          name,
          release: () => {
            this.heldLocks.delete(name);
            // Process next pending request for this lock
            this.processNextPending(name);
          }
        });

        const lock = { name };
        signal?.addEventListener('abort', () => {
          // If aborted while holding the lock, release it
          if (this.heldLocks.get(name) === lock) { // Check if it's still this lock instance
            this.heldLocks.delete(name);
            this.processNextPending(name);
          }
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });

        try {
          // The callback is expected to keep the lock alive until it resolves
          // This is the key part: the lock is held until the callback finishes
          // which happens when SafeLock.releaseLock is called.
          await callback(lock);
          // After callback resolves, release the lock
          this.heldLocks.delete(name);
          this.processNextPending(name);
          resolve(lock);
        } catch (e) {
          this.heldLocks.delete(name);
          this.processNextPending(name);
          reject(e);
        }
      };

      processRequest();
    });
  }

  private processNextPending(name: string) {
    const queue = this.pendingRequests.get(name);
    if (queue && queue.length > 0) {
      const next = queue.shift();
      if (next) {
        // Re-attempt to acquire the lock for the next pending request
        // This will put it back in the queue if still held, or acquire it
        this.request(name, { signal: next.signal }, next.callback)
          .then(next.resolve)
          .catch(next.reject);
      }
    }
  }
}

describe('SafeLock', () => {
  let safeLock: SafeLock;
  const LOCK_NAME = 'lock:sb-test-auth-token';

  beforeEach(() => {
    // Setup Mock Environment
    // @ts-ignore
    global.navigator = {
      // @ts-ignore
      locks: new MockLockManager()
    };
    safeLock = new SafeLock();
  });

  it('should acquire and release a single lock within 5000ms', async () => {
    const start = Date.now();
    await safeLock.acquireLock(LOCK_NAME);
    await safeLock.releaseLock(LOCK_NAME);
    const duration = Date.now() - start;
    expect(duration).toBeLessThanOrEqual(5000);
  });

  it('should handle 10 simultaneous requests within 7000ms', async () => {
    const requests = [];
    const start = Date.now();

    for (let i = 0; i < 10; i++) {
      requests.push(async () => {
        await safeLock.acquireLock(LOCK_NAME, 5000);
        // Hold for a tiny bit
        await new Promise(r => setTimeout(r, 50));
        await safeLock.releaseLock(LOCK_NAME);
      });
    }

    await Promise.all(requests.map(fn => fn()));
    const duration = Date.now() - start;
    expect(duration).toBeLessThanOrEqual(7000);
  });
});
