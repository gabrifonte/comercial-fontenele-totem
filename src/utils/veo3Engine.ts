import { GoogleGenAI } from '@google/genai';

export type VeoClipSlot = 'idle' | 'spin' | 'win' | 'work';

const DB_NAME = 'comercial_fontenele_veo3_db';
const STORE_NAME = 'veo3_clips';
const DB_VERSION = 1;

function openVeoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVeoClipBlob(slot: VeoClipSlot, blob: Blob): Promise<void> {
  const db = await openVeoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, slot);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getVeoClipBlob(slot: VeoClipSlot): Promise<Blob | null> {
  try {
    const db = await openVeoDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(slot);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as Blob) || null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

export async function loadAllVeoClipUrls(): Promise<Partial<Record<VeoClipSlot, string>>> {
  const slots: VeoClipSlot[] = ['idle', 'spin', 'win', 'work'];
  const urls: Partial<Record<VeoClipSlot, string>> = {};
  for (const slot of slots) {
    const blob = await getVeoClipBlob(slot);
    if (blob && blob.size > 0) {
      urls[slot] = URL.createObjectURL(blob);
    }
  }
  return urls;
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; mime_type: string }> {
  const res = await fetch(url);
  const blob = await res.blob();
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mime_type: blob.type || 'image/png',
  };
}

/**
 * Gera clipes de animação 3D do mascote utilizando a Interactions API oficial
 * com o modelo de vídeo `gemini-omni-1.2-flash` a partir da imagem de referência
 * e salva no IndexedDB para reprodução contínua em loop.
 */
export async function generateVeo3MascotClip(
  slot: VeoClipSlot,
  referenceImageUrl: string,
  apiKey: string
): Promise<string | null> {
  if (!apiKey) return null;

  const prompts: Record<VeoClipSlot, string> = {
    idle: 'Continuous, unbroken studio shot of this 3D Pixar-style craftsman mascot with black hair, thick mustache, white shirt and black overalls with red toolboxes on a clean solid #FAF8F5 cream-white studio background. Subtle natural breathing, blinking eyes, smiling warmly, and giving a friendly thumbs up. No scene cuts. No dialogue. Use this image as both the starting frame and the final frame.',
    spin: 'Continuous, unbroken studio shot of this 3D Pixar-style craftsman mascot pointing excitedly with both hands and cheering as a prize wheel spins, smooth articulated arms and joyful facial expression on a clean solid #FAF8F5 cream-white studio background. No scene cuts. No dialogue. Use this image as both the starting frame and the final frame.',
    win: 'Continuous, unbroken studio shot of this 3D Pixar-style craftsman mascot jumping in celebration holding a silver wrench up in the air with a huge joyful smile on a clean solid #FAF8F5 cream-white studio background. No scene cuts. No dialogue. Use this image as both the starting frame and the final frame.',
    work: 'Continuous, unbroken studio shot of this 3D Pixar-style craftsman mascot carefully inspecting his red metal toolbox and tightening a brass plumbing valve with his wrench, authentic craftsman movements on a clean solid #FAF8F5 cream-white studio background. No scene cuts. No dialogue. Use this image as both the starting frame and the final frame.',
  };

  try {
    const ai = new GoogleGenAI({ apiKey });
    const imgPart = await fetchImageAsBase64(referenceImageUrl);

    const interaction = await ai.interactions.create({
      model: 'gemini-omni-1.2-flash',
      input: [
        { type: 'image', data: imgPart.data, mime_type: imgPart.mime_type },
        { type: 'image', data: imgPart.data, mime_type: imgPart.mime_type },
        { type: 'text', text: prompts[slot] },
      ],
      response_format: {
        type: 'video',
        aspect_ratio: '9:16',
        duration: '5s',
        resolution: '720p',
      },
    });

    const videoData = interaction.output_video?.data;
    if (!videoData) return null;

    const binary = atob(videoData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const videoBlob = new Blob([bytes], { type: 'video/mp4' });
    if (videoBlob.size > 0) {
      await saveVeoClipBlob(slot, videoBlob);
      return URL.createObjectURL(videoBlob);
    }
    return null;
  } catch {
    return null;
  }
}
