const INSTANCE_KEY = 'instanceUrl';

export async function getInstance(storage) {
  const value = (await storage.get(INSTANCE_KEY))[INSTANCE_KEY];
  return typeof value === 'string' ? value : null;
}

export async function setInstance(storage, instanceUrl) {
  await storage.set({ [INSTANCE_KEY]: instanceUrl });
}
