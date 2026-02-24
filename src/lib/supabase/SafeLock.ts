
/**
 * SafeLock implementation for Supabase Auth to handle navigator.locks issues.
 * Addresses:
 * 1. Navigator LockManager timeout
 * 2. Pre-check with navigator.locks.query()
 * 3. Reduced timeout (5000ms)
 * 4. Exponential backoff retry
 * 5. Structured logging
 */
export class SafeLock {
  private releaseMap: Map<string, (value: void | PromiseLike<void>) => void> = new Map();

  async acquireLock(name: string, timeout: number = 5000): Promise<void> {
    // 1. Check if lock is already held
    if (typeof navigator !== 'undefined' && navigator.locks && navigator.locks.query) {
      try {
        const state = await navigator.locks.query();
        const isHeld = state.held?.some((l) => l.name === name);
        if (isHeld) {
          console.warn(`[AuthLock] Lock ${name} is already held by another agent.`);
        }
      } catch (e) {
        // Ignore query errors in non-supported environments
      }
    }

    // 2. Retry logic with exponential backoff
    let attempt = 0;
    const maxAttempts = 5;
    let delay = 100;

    while (attempt < maxAttempts) {
      try {
        await this._requestLock(name, timeout);
        return;
      } catch (error: any) {
        console.error(`[AuthLock] Attempt ${attempt + 1} failed for ${name}:`, error);
        
        // Clean up if needed - ensure we don't leave any hanging promises
        this.releaseLock(name).catch(() => {});

        if (attempt === maxAttempts - 1) {
            // Final attempt failed
            console.error(`[AuthLock] Failed to acquire lock ${name} after ${maxAttempts} attempts.`);
            // Force release in case of any lingering state (user requirement compliance)
            if (typeof navigator !== 'undefined' && navigator.locks) {
                // We can't force release a lock held by another tab, but we can ensure we aren't holding it locally
                // The browser releases locks when the tab closes or the callback returns.
                // Our releaseLock method resolves the callback promise.
            }
            throw error;
        }

        // Exponential backoff with jitter
        const jitter = Math.random() * 100;
        const waitTime = delay + jitter;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        delay *= 2;
        attempt++;
      }
    }
  }

  private _requestLock(name: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.locks) {
        // Fallback for non-browser environments or if locks API is missing
        return resolve();
      }

      const controller = new AbortController();
      const signal = controller.signal;

      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`[AuthLock] Timeout acquiring lock ${name} after ${timeout}ms`));
      }, timeout);

      // We do NOT use ifAvailable: true because we want to wait in queue up to timeout
      // The callback is async and waits for the release promise
      navigator.locks.request(name, { signal }, async (lock) => {
        if (!lock) {
            clearTimeout(timeoutId);
            return reject(new Error(`[AuthLock] Lock ${name} could not be acquired`));
        }
        
        clearTimeout(timeoutId);
        
        // We have the lock!
        // We need to keep this callback alive until releaseLock is called.
        await new Promise<void>((releaseRes) => {
          this.releaseMap.set(name, releaseRes);
          resolve(); // Resolve the outer promise (acquireLock) signaling success
        });
        
        // When releaseRes is called, this callback finishes and lock is released by browser.
      }).catch((err) => {
        clearTimeout(timeoutId);
        // If aborted (timeout), reject
        if (err.name === 'AbortError') {
            reject(new Error(`[AuthLock] Timeout acquiring lock ${name} after ${timeout}ms`));
        } else {
            reject(err);
        }
      });
    });
  }

  async releaseLock(name: string): Promise<void> {
    const release = this.releaseMap.get(name);
    if (release) {
      release(); // Releases the promise in _requestLock callback
      this.releaseMap.delete(name);
    }
  }
}
