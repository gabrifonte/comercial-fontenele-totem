/**
 * Cloud sync layer (Firebase Firestore, free "Spark" plan).
 *
 * - Collection `prizes/{id}`  -> one doc per prize (PrizeItem)
 * - Collection `draws/{id}`   -> one doc per draw (DrawRecord)
 * - Doc `meta/counters`       -> { draws: number } used to number draws safely across computers
 *
 * When the VITE_FIREBASE_* variables are not set, `cloudEnabled` is false and the app
 * keeps working 100% locally (localStorage), exactly like before.
 */
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  User,
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  initializeFirestore,
  limit,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { DrawRecord, PrizeItem } from '../types';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const hasFirebaseConfig = Boolean(config.apiKey && config.projectId && config.appId);

/**
 * Detecta se o app está rodando em Modo Demonstração / Portfólio (GitHub / LinkedIn):
 * - Quando acessado com `?demo=1` ou `?portfolio=1` na URL
 * - Quando hospedado no GitHub Pages (`*.github.io`)
 * - Quando clonado do GitHub sem as variáveis `.env.local` do Firebase da loja
 */
export const isPortfolioDemoMode = (): boolean => {
  if (typeof window === 'undefined') return !hasFirebaseConfig;
  const params = new URLSearchParams(window.location.search);
  const hasDemoParam =
    params.get('demo') === '1' ||
    params.get('demo') === 'true' ||
    params.get('portfolio') === '1';
  const isGithubPages = window.location.hostname.endsWith('github.io');
  return hasDemoParam || isGithubPages || !hasFirebaseConfig;
};

export const demoMode = isPortfolioDemoMode();

// No Modo Demonstração, desativa 100% qualquer conexão com o Firebase real da loja
export const cloudEnabled = !demoMode && hasFirebaseConfig;

let appInstance: FirebaseApp | null = null;
const getFirebaseApp = (): FirebaseApp => {
  if (!appInstance) appInstance = initializeApp(config);
  return appInstance;
};

let dbInstance: Firestore | null = null;
const getDb = (): Firestore => {
  if (!dbInstance) {
    const app = getFirebaseApp();
    dbInstance = initializeFirestore(app, {
      // Keeps a local copy so the screen still loads if the internet drops for a moment
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
  }
  return dbInstance;
};

/**
 * Manager authentication (Firebase Auth, e-mail + password).
 * The wheel is public; everything that edits stock/history requires this login
 * (the real protection is in firestore.rules, not only on the screen).
 */
let authInstance: Auth | null = null;
const getAuthInstance = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
    // Session only: closing the tab/app logs the manager out (the totem is used by customers)
    setPersistence(authInstance, browserSessionPersistence).catch(() => {});
  }
  return authInstance;
};

export const onManagerChange = (cb: (user: User | null) => void) =>
  onAuthStateChanged(getAuthInstance(), cb);

export const isManagerSignedIn = (): boolean => Boolean(getAuthInstance().currentUser);

export const signInManager = async (email: string, password: string): Promise<void> => {
  const auth = getAuthInstance();
  await setPersistence(auth, browserSessionPersistence).catch(() => {});
  await signInWithEmailAndPassword(auth, email.trim(), password);
};

export const signOutManager = (): Promise<void> => signOut(getAuthInstance());

export const sendManagerPasswordReset = (email: string): Promise<void> =>
  sendPasswordResetEmail(getAuthInstance(), email.trim());

const prizesCol = () => collection(getDb(), 'prizes');
const drawsCol = () => collection(getDb(), 'draws');
const countersRef = () => doc(getDb(), 'meta', 'counters');

const BATCH_LIMIT = 400;

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

const sortPrizes = (list: PrizeItem[]) =>
  [...list].sort((a, b) => a.sliceNumber - b.sliceNumber || a.id.localeCompare(b.id));

// Firestore documents are limited to 1 MB: drop a photo that is too big instead of failing the whole sync
const MAX_IMAGE_CHARS = 800_000;
const safePrize = (p: PrizeItem): PrizeItem =>
  p.imageUrl && p.imageUrl.length > MAX_IMAGE_CHARS ? { ...p, imageUrl: undefined } : p;

export interface SnapshotInfo {
  fromCache: boolean;
}

export const subscribePrizes = (
  onData: (prizes: PrizeItem[], info: SnapshotInfo) => void,
  onError: (err: Error) => void
) =>
  onSnapshot(
    prizesCol(),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as PrizeItem);
      onData(sortPrizes(list), { fromCache: snap.metadata.fromCache });
    },
    onError
  );

export const subscribeDraws = (
  onData: (draws: DrawRecord[]) => void,
  onError: (err: Error) => void
) =>
  onSnapshot(
    query(drawsCol(), orderBy('drawNumber', 'desc'), limit(1000)),
    (snap) => onData(snap.docs.map((d) => d.data() as DrawRecord)),
    onError
  );

/**
 * Writes only the differences between `prev` and `next` (adds/changes/deletes).
 */
export const syncPrizes = async (prev: PrizeItem[], next: PrizeItem[]): Promise<void> => {
  const db = getDb();
  const prevById = new Map(prev.map((p) => [p.id, p]));
  const nextIds = new Set(next.map((p) => p.id));

  type Op = { type: 'set'; prize: PrizeItem } | { type: 'delete'; id: string };
  const ops: Op[] = [];
  next.forEach((p) => {
    const before = prevById.get(p.id);
    if (!before || JSON.stringify(before) !== JSON.stringify(p)) ops.push({ type: 'set', prize: p });
  });
  prev.forEach((p) => {
    if (!nextIds.has(p.id)) ops.push({ type: 'delete', id: p.id });
  });

  for (const group of chunk(ops, BATCH_LIMIT)) {
    const batch = writeBatch(db);
    group.forEach((op) => {
      if (op.type === 'set') batch.set(doc(db, 'prizes', op.prize.id), safePrize(op.prize));
      else batch.delete(doc(db, 'prizes', op.id));
    });
    await batch.commit();
  }
};

/**
 * Atomically changes one prize (safe even if two computers act at the same time).
 */
export const mutatePrize = async (
  prizeId: string,
  mutate: (current: PrizeItem) => PrizeItem
): Promise<void> => {
  const db = getDb();
  const ref = doc(db, 'prizes', prizeId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    tx.set(ref, mutate(snap.data() as PrizeItem));
  });
};

/**
 * Atomically records a delivered prize: creates the draw (with a shared sequential number)
 * and decrements stock, locking the prize automatically when it reaches zero.
 */
export const recordWin = async (winner: PrizeItem): Promise<void> => {
  const db = getDb();
  const prizeRef = doc(db, 'prizes', winner.id);
  const counterRef = countersRef();
  await runTransaction(db, async (tx) => {
    const prizeSnap = await tx.get(prizeRef);
    const counterSnap = await tx.get(counterRef);
    if (!prizeSnap.exists()) return;

    const current = prizeSnap.data() as PrizeItem;
    const drawNumber = ((counterSnap.data()?.draws as number | undefined) || 0) + 1;
    const nextStock = Math.max(0, current.currentStock - 1);
    const id = `draw-${Date.now()}`;

    const draw: DrawRecord = {
      id,
      drawNumber,
      prizeId: current.id,
      prizeName: current.name,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      delivered: true,
    };

    tx.set(counterRef, { draws: drawNumber }, { merge: true });
    tx.set(doc(db, 'draws', id), draw);
    tx.set(prizeRef, {
      ...current,
      currentStock: nextStock,
      deliveredCount: current.deliveredCount + 1,
      isActive: nextStock > 0 ? current.isActive : false,
    });
  });
};

/**
 * Deletes every prize and every draw, and resets the draw counter.
 */
export const clearAllCloudData = async (): Promise<void> => {
  const db = getDb();
  const [prizeSnap, drawSnap] = await Promise.all([getDocs(prizesCol()), getDocs(drawsCol())]);
  const refs = [...prizeSnap.docs, ...drawSnap.docs].map((d) => d.ref);
  for (const group of chunk(refs, BATCH_LIMIT)) {
    const batch = writeBatch(db);
    group.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
  const batch = writeBatch(db);
  batch.set(countersRef(), { draws: 0 });
  await batch.commit();
};

/**
 * One-time upload of the data that already existed on this computer.
 */
export const uploadInitialData = async (
  prizes: PrizeItem[],
  draws: DrawRecord[]
): Promise<void> => {
  const db = getDb();
  type Item = { ref: ReturnType<typeof doc>; data: object };
  const items: Item[] = [
    ...prizes.map((p) => ({ ref: doc(db, 'prizes', p.id), data: safePrize(p) })),
    ...draws.map((d) => ({ ref: doc(db, 'draws', d.id), data: d })),
  ];
  for (const group of chunk(items, BATCH_LIMIT)) {
    const batch = writeBatch(db);
    group.forEach((it) => batch.set(it.ref, it.data));
    await batch.commit();
  }
  const maxNumber = draws.reduce((m, d) => Math.max(m, d.drawNumber), 0);
  const batch = writeBatch(db);
  batch.set(countersRef(), { draws: maxNumber }, { merge: true });
  await batch.commit();
};
