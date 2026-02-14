import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect } from 'vitest';
import App from '../App';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('App bootstrap', () => {
  it('renderiza sem falhas iniciais', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const container = document.getElementById('root') as HTMLDivElement;
    const root = ReactDOM.createRoot(container);
    await act(async () => {
      root.render(<App />);
    });
    expect(container.innerHTML.length).toBeGreaterThan(0);
    root.unmount();
  });
});
