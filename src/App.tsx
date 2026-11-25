import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { ScreenId, PrizeItem, DrawRecord } from './types';
import { INITIAL_PRIZES, INITIAL_DRAWS, SAMPLE_PRIZES } from './data/initialData';
import { WheelTotemScreen } from './screens/WheelTotemScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { QrGate } from './components/QrGate';
import { ManagerLogin } from './components/ManagerLogin';
import { AttractModeScreensaver } from './components/AttractModeScreensaver';
import { getMarketingConfig } from './config/marketing';
import { soundManager } from './utils/audio';
import * as cloud from './lib/cloud';

// Storage keys bumped to v8 to guarantee a completely clean, zeroed-out state
const STORAGE_KEY_PRIZES = 'comercial_fontenele_clean_prizes_v8';
const STORAGE_KEY_DRAWS = 'comercial_fontenele_clean_draws_v8';
// Marks that the data from this computer was already handled by the cloud sync
const STORAGE_KEY_MIGRATED = 'comercial_fontenele_cloud_migrated_v1';

const readLocalArray = <T,>(key: string): T[] => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch {
    // Fallback
  }
  return [];
};

export default function App() {
  // Purge any legacy data from localStorage so the app starts 100% clean and zeroed out
  useEffect(() => {
    try {
      const legacyKeys = [
        'comercial_fontenele_prizes_v1',
        'comercial_fontenele_prizes_v2',
        'comercial_fontenele_prizes_v3',
        'comercial_fontenele_clean_prizes_v4',
        'comercial_fontenele_clean_prizes_v5',
        'comercial_fontenele_clean_prizes_v6',
        'comercial_fontenele_clean_prizes_v7',
        'comercial_fontenele_draws_v1',
        'comercial_fontenele_draws_v2',
        'comercial_fontenele_draws_v3',
        'comercial_fontenele_clean_draws_v4',
        'comercial_fontenele_clean_draws_v5',
        'comercial_fontenele_clean_draws_v6',
        'comercial_fontenele_clean_draws_v7',
        'comercial_fontenele_customers_v1',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }, []);

  // Screen Routing: 'totem-roleta' (Initial Screen) | 'estoque-brindes'
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('totem-roleta');

  // The wheel only appears after the customer completes the QR code step
  const [gateUnlocked, setGateUnlocked] = useState(false);

  // Modo de Descanso / Attract Mode (Screensaver com Vídeo e Marketing)
  const [screensaverActive, setScreensaverActive] = useState(false);

  // Detector de Inatividade para o Modo de Descanso (quando no totem público)
  useEffect(() => {
    if (currentScreen !== 'totem-roleta' || screensaverActive) return;

    const config = getMarketingConfig();
    if (!config.enabled) return;

    const idleMs = Math.max(1, config.idleMinutes) * 60 * 1000;
    let timer = window.setTimeout(() => {
      setScreensaverActive(true);
    }, idleMs);

    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setScreensaverActive(true);
      }, idleMs);
    };

    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    return () => {
      window.clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [currentScreen, screensaverActive]);

  // App Data - In Portfolio Demo Mode, always starts with fictional SAMPLE_PRIZES; in cloud mode, syncs from Firebase.
  const [prizes, setPrizes] = useState<PrizeItem[]>(() => {
    if (cloud.demoMode) return SAMPLE_PRIZES;
    if (cloud.cloudEnabled) return [];
    const parsed = readLocalArray<PrizeItem>(STORAGE_KEY_PRIZES);
    return parsed.length > 0 ? parsed : INITIAL_PRIZES;
  });

  const [drawHistory, setDrawHistory] = useState<DrawRecord[]>(() => {
    if (cloud.cloudEnabled) return [];
    const parsed = readLocalArray<DrawRecord>(STORAGE_KEY_DRAWS);
    return parsed.length > 0 ? parsed : INITIAL_DRAWS; // []
  });

  // Cloud sync status
  const [cloudReady, setCloudReady] = useState(!cloud.cloudEnabled);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  const reportCloudError = (err: unknown) => {
    console.error('Erro de sincronização:', err);
    setCloudError(err instanceof Error ? err.message : String(err));
  };

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Manager login: in Portfolio Demo Mode (or without Firebase Auth), the manager panel is 100% locked
  const [isManager, setIsManager] = useState(false);
  useEffect(() => {
    if (!cloud.cloudEnabled || cloud.demoMode) return;
    return cloud.onManagerChange((user) => setIsManager(Boolean(user)));
  }, []);
  const managerAllowed = !cloud.demoMode && cloud.cloudEnabled && isManager;

  // Auto logout after 10 minutes without interaction (in case the manager forgets the screen open)
  useEffect(() => {
    if (!cloud.cloudEnabled || !isManager) return;
    const IDLE_MS = 10 * 60 * 1000;
    let timer = window.setTimeout(expire, IDLE_MS);
    function expire() {
      cloud.signOutManager().catch(() => {});
      setCurrentScreen('totem-roleta');
    }
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(expire, IDLE_MS);
    };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, reset));
    return () => {
      window.clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [isManager]);

  // Live subscription to the shared data
  useEffect(() => {
    if (!cloud.cloudEnabled) return;

    const unsubPrizes = cloud.subscribePrizes(
      (list, info) => {
        setPrizes(list);
        setCloudReady(true);
        setCloudError(null);

        if (info.fromCache) return;
        // Uploading old local data is a manager-only operation
        if (!cloud.isManagerSignedIn()) return;
        try {
          if (localStorage.getItem(STORAGE_KEY_MIGRATED)) return;
          if (list.length > 0) {
            // The cloud already has data: never overwrite it with old local data
            localStorage.setItem(STORAGE_KEY_MIGRATED, '1');
            return;
          }
          // First time with an empty cloud: upload what already existed on this computer
          const localPrizes = readLocalArray<PrizeItem>(STORAGE_KEY_PRIZES);
          const localDraws = readLocalArray<DrawRecord>(STORAGE_KEY_DRAWS);
          if (localPrizes.length > 0 || localDraws.length > 0) {
            localStorage.setItem(STORAGE_KEY_MIGRATED, '1');
            cloud.uploadInitialData(localPrizes, localDraws).catch(reportCloudError);
          }
        } catch {
          // Ignore
        }
      },
      (err) => {
        reportCloudError(err);
        setCloudReady(true);
      }
    );

    return () => {
      unsubPrizes();
    };
  }, []);

  // The draw history is private: only read it while the manager is logged in
  useEffect(() => {
    if (!cloud.cloudEnabled) return;
    if (!isManager) {
      setDrawHistory([]);
      return;
    }
    return cloud.subscribeDraws(setDrawHistory, reportCloudError);
  }, [isManager]);

  // Sync to localStorage (only when running without cloud)
  useEffect(() => {
    if (cloud.cloudEnabled) return;
    try {
      localStorage.setItem(STORAGE_KEY_PRIZES, JSON.stringify(prizes));
    } catch {
      // Ignore
    }
  }, [prizes]);

  useEffect(() => {
    if (cloud.cloudEnabled) return;
    try {
      localStorage.setItem(STORAGE_KEY_DRAWS, JSON.stringify(drawHistory));
    } catch {
      // Ignore
    }
  }, [drawHistory]);

  // Applies a full new prizes list: to the cloud (shared) or to local state
  const applyPrizes = (next: PrizeItem[]) => {
    if (cloud.cloudEnabled) {
      cloud.syncPrizes(prizes, next).catch(reportCloudError);
    } else {
      setPrizes(next);
    }
  };

  const navigateTo = (screen: ScreenId) => {
    if (screen === currentScreen) return;
    // Leaving the manager area ends the session, so the next person at the totem can't edit stock
    if (screen === 'totem-roleta' && cloud.cloudEnabled && isManager) {
      cloud.signOutManager().catch(() => {});
    }
    setCurrentScreen(screen);
  };

  // Stock deduction & delivery confirmation directly on totem
  const handleRecordWin = (winner: PrizeItem) => {
    if (cloud.cloudEnabled) {
      cloud.recordWin(winner).catch(reportCloudError);
      return;
    }

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nextDrawNumber = (drawHistory[0]?.drawNumber || 0) + 1;

    // 1. Record draw
    const newDraw: DrawRecord = {
      id: `draw-${Date.now()}`,
      drawNumber: nextDrawNumber,
      prizeId: winner.id,
      prizeName: winner.name,
      timestamp: nowTime,
      delivered: true,
    };
    setDrawHistory((prev) => [newDraw, ...prev]);

    // 2. Reduce stock by 1, automatically lock if currentStock reaches 0
    setPrizes((prev) =>
      prev.map((p) => {
        if (p.id === winner.id) {
          const nextStock = Math.max(0, p.currentStock - 1);
          return {
            ...p,
            currentStock: nextStock,
            deliveredCount: p.deliveredCount + 1,
            isActive: nextStock > 0 ? p.isActive : false, // Auto-lock if zero
          };
        }
        return p;
      })
    );
  };

  // Simulate a draw directly from manager mode
  const handleSimulateDraw = () => {
    const activeList = prizes.filter((p) => p.currentStock > 0 && p.isActive);
    if (activeList.length === 0) {
      soundManager.playClick();
      return;
    }
    const randomPrize = activeList[Math.floor(Math.random() * activeList.length)];
    soundManager.playClick();
    handleRecordWin(randomPrize);
  };

  // Stock stepper modification (+1 or -1)
  const handleUpdateStock = (prizeId: string, delta: number) => {
    if (cloud.cloudEnabled) {
      cloud
        .mutatePrize(prizeId, (p) => {
          const nextStock = Math.max(0, p.currentStock + delta);
          return { ...p, currentStock: nextStock, isActive: nextStock > 0 ? p.isActive : false };
        })
        .catch(reportCloudError);
      return;
    }
    setPrizes((prev) =>
      prev.map((p) => {
        if (p.id === prizeId) {
          const nextStock = Math.max(0, p.currentStock + delta);
          return {
            ...p,
            currentStock: nextStock,
            isActive: nextStock > 0 ? p.isActive : false,
          };
        }
        return p;
      })
    );
  };

  // Toggle active status in wheel
  const handleToggleStatus = (prizeId: string) => {
    if (cloud.cloudEnabled) {
      cloud
        .mutatePrize(prizeId, (p) => (p.currentStock <= 0 ? p : { ...p, isActive: !p.isActive }))
        .catch(reportCloudError);
      return;
    }
    setPrizes((prev) =>
      prev.map((p) => {
        if (p.id === prizeId) {
          if (p.currentStock <= 0) return p;
          return {
            ...p,
            isActive: !p.isActive,
          };
        }
        return p;
      })
    );
  };

  // Add new custom prize
  const handleAddPrize = (newPrize: Omit<PrizeItem, 'id'>) => {
    const item: PrizeItem = {
      ...newPrize,
      id: `prize-${Date.now()}`,
    };
    if (cloud.cloudEnabled) {
      applyPrizes([...prizes, item]);
      return;
    }
    setPrizes((prev) => [...prev, item]);
  };

  // Update existing prize (Edit CRUD)
  const handleUpdatePrize = (updated: PrizeItem) => {
    if (cloud.cloudEnabled) {
      applyPrizes(prizes.map((p) => (p.id === updated.id ? updated : p)));
      return;
    }
    setPrizes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Delete prize (Delete CRUD)
  const handleDeletePrize = (prizeId: string) => {
    if (cloud.cloudEnabled) {
      applyPrizes(prizes.filter((p) => p.id !== prizeId));
      return;
    }
    setPrizes((prev) => prev.filter((p) => p.id !== prizeId));
  };

  // Reset stock counters
  const handleResetStockDefaults = () => {
    const reset = (list: PrizeItem[]) =>
      list.map((p) => ({
        ...p,
        currentStock: p.initialStock,
        isActive: p.initialStock > 0,
      }));
    if (cloud.cloudEnabled) {
      applyPrizes(reset(prizes));
    } else {
      setPrizes((prev) => reset(prev));
    }
    soundManager.playClick();
  };

  // Completely wipe all data to zero
  const handleClearAllData = () => {
    if (cloud.cloudEnabled) {
      // Avoid re-uploading old local data after an intentional wipe
      try {
        localStorage.setItem(STORAGE_KEY_MIGRATED, '1');
      } catch {
        // Ignore
      }
      cloud.clearAllCloudData().catch(reportCloudError);
      soundManager.playClick();
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY_PRIZES);
      localStorage.removeItem(STORAGE_KEY_DRAWS);
    } catch {
      // Ignore
    }
    setPrizes([]);
    setDrawHistory([]);
    soundManager.playClick();
  };

  // Load sample model prizes if requested
  const handleLoadSamplePrizes = () => {
    applyPrizes(SAMPLE_PRIZES);
    soundManager.playClick();
  };

  // Import JSON backup
  const handleImportBackup = (importedPrizes: PrizeItem[]) => {
    applyPrizes(importedPrizes);
    soundManager.playClick();
  };

  if (!cloudReady) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-[#111827]">
        <Loader2 className="w-10 h-10 animate-spin text-[#C81E1E]" />
        <p className="font-semibold text-lg">Conectando à nuvem...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col text-[#111827]">
      {cloud.demoMode && !screensaverActive && (
        <div className="fixed bottom-3 left-3 z-[120] flex flex-wrap items-center gap-2 rounded-2xl bg-[#1E293B]/95 backdrop-blur-md text-white px-3.5 py-2 text-xs font-bold shadow-xl border border-slate-700">
          <span className="text-amber-300 font-black">🔒 Modo Demo (Portfólio)</span>
          <span className="text-slate-400 hidden sm:inline">• Dados Fictícios</span>
          <button
            type="button"
            onClick={() => {
              setCurrentScreen('totem-roleta');
              setGateUnlocked(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#C81E1E] hover:bg-[#991B1B] text-white font-extrabold transition-colors cursor-pointer"
          >
            🎡 Testar Roleta
          </button>
          <button
            type="button"
            onClick={() => setScreensaverActive(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold transition-colors cursor-pointer"
          >
            🤖 Ver Mascote 3D
          </button>
        </div>
      )}
      {cloud.cloudEnabled && (
        <div
          className={`fixed bottom-2 left-2 z-[100] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm pointer-events-none ${
            cloudError
              ? 'bg-red-100 text-red-700'
              : online
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
          }`}
          title={cloudError || undefined}
        >
          {cloudError ? (
            <>
              <CloudOff className="w-3.5 h-3.5" /> Erro de sincronização
            </>
          ) : online ? (
            <>
              <Cloud className="w-3.5 h-3.5" /> Sincronizado
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5" /> Sem conexão
            </>
          )}
        </div>
      )}
      <AnimatePresence mode="wait">
        {currentScreen === 'totem-roleta' && (
          <motion.div
            key="totem-roleta"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            {gateUnlocked ? (
              <WheelTotemScreen
                prizes={prizes}
                onNavigateToInventory={() => navigateTo('estoque-brindes')}
                onRecordWin={handleRecordWin}
                // Each customer earns a single spin: back to the QR code screen for the next one
                onSpinComplete={() => setGateUnlocked(false)}
              />
            ) : (
              <QrGate
                onUnlock={() => setGateUnlocked(true)}
                onNavigateToInventory={() => navigateTo('estoque-brindes')}
              />
            )}
          </motion.div>
        )}

        {currentScreen === 'estoque-brindes' && (
          <motion.div
            key="estoque-brindes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            {!managerAllowed ? (
              <ManagerLogin
                onBack={() => navigateTo('totem-roleta')}
                onOpenScreensaver={() => {
                  setCurrentScreen('totem-roleta');
                  setScreensaverActive(true);
                }}
                onUnlockDemoWheel={() => {
                  setCurrentScreen('totem-roleta');
                  setGateUnlocked(true);
                }}
              />
            ) : (
            <InventoryScreen
              prizes={prizes}
              drawHistory={drawHistory}
              onNavigateToWheel={() => navigateTo('totem-roleta')}
              onUpdateStock={handleUpdateStock}
              onToggleStatus={handleToggleStatus}
              onAddPrize={handleAddPrize}
              onUpdatePrize={handleUpdatePrize}
              onDeletePrize={handleDeletePrize}
              onResetStockDefaults={handleResetStockDefaults}
              onClearAllData={handleClearAllData}
              onLoadSamplePrizes={handleLoadSamplePrizes}
              onImportBackup={handleImportBackup}
              onSimulateDraw={handleSimulateDraw}
              onTestScreensaver={() => {
                setScreensaverActive(true);
                setCurrentScreen('totem-roleta');
              }}
            />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modo de Descanso / Attract Mode Screensaver com Transição Suave e Gradual */}
      <AnimatePresence>
        {screensaverActive && (
          <motion.div
            key="screensaver-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.015, filter: 'blur(3px)' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[200]"
          >
            <AttractModeScreensaver
              config={getMarketingConfig()}
              prizes={prizes}
              onExit={() => setScreensaverActive(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
