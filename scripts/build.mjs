// Writes dist/chrome and dist/firefox: src/ plus a per-browser manifest.json.
// FATRAT_WEBEXT_DEV_HANDOFF=<match pattern> also injects the handoff script there, for testing the
// website page before it's deployed (e.g. http://10.10.10.3/webext/*; ports can't be in patterns).
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { makeManifest } from './manifest.mjs';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const devHandoff = process.env.FATRAT_WEBEXT_DEV_HANDOFF || undefined;

for (const target of ['chrome', 'firefox']) {
  const out = new URL(`dist/${target}/`, root);
  await rm(out, { recursive: true, force: true });
  await cp(new URL('src/', root), out, { recursive: true });
  await writeFile(new URL('manifest.json', out), `${JSON.stringify(makeManifest(target, version, { devHandoff }), null, 2)}\n`);
}
console.log(`Built ${version}${devHandoff ? ` (dev handoff ${devHandoff})` : ''}`);
