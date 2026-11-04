'use strict';

const storageFiles = new Map([
  ['sm64_save_file.bin', 4096],
  ['sm64config.txt', 65536],
]);

function storageRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function openGameStorage(FS) {
  const request = indexedDB.open('sm64coopdx-web', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('files');
  const db = await storageRequest(request);
  const saved = new Map();
  try {
    const reader = db.transaction('files').objectStore('files');
    await Promise.all([...storageFiles].map(async ([name, limit]) => {
      const bytes = await storageRequest(reader.get(name));
      if (bytes === undefined) return;
      if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > limit) {
        throw Error('Los datos locales tienen un tamaño o formato inesperado.');
      }
      saved.set(name, bytes);
    }));
    for (const [name, bytes] of saved) FS.writeFile('/user/' + name, bytes);
  } catch (error) {
    db.close();
    throw error;
  }

  let pending;
  function flush() {
    if (pending) return pending;
    pending = (async () => {
      const changes = new Map();
      for (const [name, limit] of storageFiles) {
        const path = '/user/' + name;
        if (!FS.analyzePath(path).exists) continue;
        const bytes = FS.readFile(path);
        if (!bytes.length || bytes.length > limit) throw Error('Tamaño de guardado inesperado.');
        const previous = saved.get(name);
        if (previous?.length === bytes.length && bytes.every((value, index) => value === previous[index])) continue;
        changes.set(name, bytes);
      }
      if (!changes.size) return false;
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('files', 'readwrite');
        transaction.oncomplete = resolve;
        transaction.onabort = () => reject(transaction.error || Error('No se completó el guardado.'));
        const writer = transaction.objectStore('files');
        for (const [name, bytes] of changes) writer.put(bytes, name);
      });
      for (const [name, bytes] of changes) saved.set(name, bytes);
      return true;
    })().finally(() => { pending = undefined; });
    return pending;
  }
  return {flush};
}
