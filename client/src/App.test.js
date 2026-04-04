import { vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url === '/api/lessons') {
      return Promise.resolve({
        json: () => Promise.resolve([])
      });
    }

    return Promise.resolve({
      json: () => Promise.resolve([])
    });
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

test('renders app header', async () => {
  await act(async () => {
    render(<App />);
    await Promise.resolve();
  });

  const heading = screen.getByText(/AWS Essentials 60-Day Program/i);
  expect(heading).toBeInTheDocument();
});
