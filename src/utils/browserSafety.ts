// Browser safety utilities for Tauri compatibility
// Provides safe access to browser APIs that might not be available in all contexts

export const browser = {
  // Safe window access
  get window() {
    if (typeof window !== 'undefined') {
      return window;
    }
    return null;
  },
  
  // Safe document access
  get document() {
    if (typeof document !== 'undefined') {
      return document;
    }
    return null;
  },
  
  // Safe localStorage access
  get localStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return null;
  },
  
  // Safe sessionStorage access
  get sessionStorage() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage;
      }
    } catch (e) {
      console.warn('sessionStorage not available:', e);
    }
    return null;
  },
  
  // Safe navigation
  navigate(url: string) {
    if (this.window) {
      this.window.location.href = url;
    }
  },
  
  // Safe URL manipulation
  get currentUrl(): string {
    return this.window?.location?.href || '';
  },
  
  get currentPath(): string {
    return this.window?.location?.pathname || '';
  },
  
  // Safe document operations
  setTitle(title: string) {
    if (this.document) {
      this.document.title = title;
    }
  },
  
  get title(): string {
    return this.document?.title || '';
  },
  
  // Safe element selection
  getElementById(id: string): HTMLElement | null {
    return this.document?.getElementById(id) || null;
  },
  
  querySelector(selector: string): HTMLElement | null {
    return this.document?.querySelector(selector) || null;
  },
  
  // Safe event listeners
  addEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) {
    if (this.window) {
      this.window.addEventListener(type, listener, options);
    }
  },
  
  removeEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ) {
    if (this.window) {
      this.window.removeEventListener(type, listener, options);
    }
  },
  
  // Safe console access (always available)
  get console() {
    return console;
  },
  
  // Safe crypto API
  get crypto() {
    if (this.window && this.window.crypto) {
      return this.window.crypto;
    }
    return null;
  },
  
  // Safe fetch API
  get fetch() {
    if (this.window && this.window.fetch) {
      return this.window.fetch.bind(this.window);
    }
    return fetch;
  }
};

// Export commonly used safe functions
export const safeNavigate = (url: string) => browser.navigate(url);
export const safeSetTitle = (title: string) => browser.setTitle(title);
export const safeGetElementById = (id: string) => browser.getElementById(id);
export const safeQuerySelector = (selector: string) => browser.querySelector(selector);
