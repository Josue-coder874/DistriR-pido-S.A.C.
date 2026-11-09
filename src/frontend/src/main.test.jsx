import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

const { createRoot, renderRoot } = vi.hoisted(() => {
  const render = vi.fn();
  return {
    createRoot: vi.fn(() => ({ render })),
    renderRoot: render,
  };
});

vi.mock('react-dom/client', () => ({
  default: { createRoot },
  createRoot,
}));

vi.mock('./Root', () => ({ default: () => null }));

describe('punto de entrada', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('monta la aplicación dentro de StrictMode en el elemento raíz', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import('./main');

    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    const [application] = renderRoot.mock.calls[0];
    expect(application.type).toBe(React.StrictMode);
    expect(application.props.children).toBeTruthy();
  });
});
