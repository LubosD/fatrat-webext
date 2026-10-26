import { describe, expect, it, vi } from 'vitest';
import { getInstance, setInstance } from '../src/lib/settings.js';

function fakeStorage(store = {}) {
  return {
    get: vi.fn(async (key) => (key in store ? { [key]: store[key] } : {})),
    set: vi.fn(async (items) => Object.assign(store, items)),
  };
}

describe('settings', () => {
  it('round-trips the instance URL and reports none when unset', async () => {
    const storage = fakeStorage();
    expect(await getInstance(storage)).toBeNull();
    await setInstance(storage, 'http://h/');
    expect(await getInstance(storage)).toBe('http://h/');
  });
});
