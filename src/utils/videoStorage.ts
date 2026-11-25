/**
 * Armazenamento local de vídeos grandes (MP4 de 10-15 minutos) via IndexedDB do navegador.
 * Suporta arquivos de centenas de megabytes sem consumir limite de Firestore ou localStorage,
 * garantindo reprodução instantânea a 60fps sem carregar da internet.
 */

const DB_NAME = 'FonteneleMarketingDB';
const DB_VERSION = 1;
const STORE_NAME = 'videos';
const KEY_PROMO_VIDEO = 'promo_video_blob';
const KEY_PROMO_META = 'promo_video_meta';

export interface VideoMeta {
  name: string;
  size: number;
  type: string;
  updatedAt: number;
  duration?: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB não suportado neste navegador'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const savePromoVideo = async (file: File): Promise<VideoMeta> => {
  const db = await openDB();
  // Cria um Blob puro para garantir compatibilidade universal em todos os navegadores
  const blob = file.slice(0, file.size, file.type || 'video/mp4');
  const meta: VideoMeta = {
    name: file.name,
    size: file.size,
    type: file.type || 'video/mp4',
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, KEY_PROMO_VIDEO);
    store.put(meta, KEY_PROMO_META);
    tx.oncomplete = () => resolve(meta);
    tx.onerror = () => reject(tx.error);
  });
};

export const getPromoVideoBlob = async (): Promise<Blob | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_PROMO_VIDEO);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
};

export const getPromoVideoMeta = async (): Promise<VideoMeta | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_PROMO_META);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
};

export const deletePromoVideo = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(KEY_PROMO_VIDEO);
    store.delete(KEY_PROMO_META);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
