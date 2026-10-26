import { describe, expect, it } from 'vitest';
import { buildAddUrl, hostPermissionPattern, isInstanceTabUrl, normalizeInstanceUrl, pickInstanceTab } from '../src/lib/instance.js';

describe('normalizeInstanceUrl', () => {
  it('keeps a canonical address', () => {
    expect(normalizeInstanceUrl('http://nas:2233/')).toBe('http://nas:2233/');
  });
  it('adds http:// and a trailing slash to a bare host:port', () => {
    expect(normalizeInstanceUrl(' nas:2233 ')).toBe('http://nas:2233/');
  });
  it('strips credentials, query, fragment and index.html', () => {
    expect(normalizeInstanceUrl('https://a:b@h/fatrat/index.html?x#y')).toBe('https://h/fatrat/');
  });
  it('treats a path without a trailing slash as a directory', () => {
    expect(normalizeInstanceUrl('https://h/fatrat')).toBe('https://h/fatrat/');
  });
  it('rejects non-http schemes and garbage', () => {
    expect(normalizeInstanceUrl('ftp://h/')).toBeNull();
    expect(normalizeInstanceUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeInstanceUrl('')).toBeNull();
    expect(normalizeInstanceUrl('http://')).toBeNull();
  });
});

describe('hostPermissionPattern', () => {
  it('drops the port and path, which Firefox match patterns cannot express', () => {
    expect(hostPermissionPattern('https://nas:2233/fatrat/')).toBe('https://nas/*');
  });
});

describe('isInstanceTabUrl', () => {
  const instance = 'http://nas:2233/fatrat/';
  it('matches the same origin under the instance path', () => {
    expect(isInstanceTabUrl(instance, 'http://nas:2233/fatrat/')).toBe(true);
    expect(isInstanceTabUrl(instance, 'http://nas:2233/fatrat/index.html#add=x')).toBe(true);
  });
  it('rejects another port, scheme or path', () => {
    expect(isInstanceTabUrl(instance, 'http://nas:8080/fatrat/')).toBe(false);
    expect(isInstanceTabUrl(instance, 'https://nas:2233/fatrat/')).toBe(false);
    expect(isInstanceTabUrl(instance, 'http://nas:2233/other/')).toBe(false);
  });
  it('rejects a missing URL (no host permission)', () => {
    expect(isInstanceTabUrl(instance, undefined)).toBe(false);
  });
});

describe('buildAddUrl', () => {
  it('percent-encodes every link into the fragment', () => {
    expect(buildAddUrl('http://nas:2233/', ['magnet:?xt=urn:btih:a&dn=b c', 'http://x/+'])).toBe(
      'http://nas:2233/#add=magnet%3A%3Fxt%3Durn%3Abtih%3Aa%26dn%3Db%20c&add=http%3A%2F%2Fx%2F%2B',
    );
  });
});

describe('pickInstanceTab', () => {
  it('returns undefined for no tabs', () => {
    expect(pickInstanceTab([])).toBeUndefined();
  });
  it('prefers the most recently used tab', () => {
    const tabs = [{ id: 1, lastAccessed: 10 }, { id: 2, lastAccessed: 30 }, { id: 3 }];
    expect(pickInstanceTab(tabs).id).toBe(2);
  });
});
