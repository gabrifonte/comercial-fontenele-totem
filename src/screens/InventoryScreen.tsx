import React, { useState, useRef } from 'react';
import { PrizeItem, DrawRecord } from '../types';
import {
  Package,
  Plus,
  Minus,
  Sparkles,
  Download,
  RotateCcw,
  RefreshCw,
  Gift,
  Lock,
  ArrowUpRight,
  LogOut,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  CheckCircle,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { compressImageFile } from '../utils/image';
import { OFFICIAL_LOGO_SRC } from '../utils/mascot';
import { ProductThumbnail } from '../components/ProductThumbnails';
import { MarketingTab } from '../components/MarketingTab';
import { Tv } from 'lucide-react';

interface InventoryScreenProps {
  prizes: PrizeItem[];
  drawHistory: DrawRecord[];
  onNavigateToWheel: () => void;
  onUpdateStock: (prizeId: string, delta: number) => void;
  onToggleStatus: (prizeId: string) => void;
  onAddPrize: (prize: Omit<PrizeItem, 'id'>) => void;
  onUpdatePrize: (updated: PrizeItem) => void;
  onDeletePrize: (prizeId: string) => void;
  onResetStockDefaults: () => void;
  onClearAllData?: () => void;
  onLoadSamplePrizes?: () => void;
  onImportBackup?: (prizes: PrizeItem[]) => void;
  onSimulateDraw: () => void;
  onTestScreensaver?: () => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  prizes,
  drawHistory,
  onNavigateToWheel,
  onUpdateStock,
  onToggleStatus,
  onAddPrize,
  onUpdatePrize,
  onDeletePrize,
  onResetStockDefaults,
  onClearAllData,
  onLoadSamplePrizes,
  onImportBackup,
  onSimulateDraw,
  onTestScreensaver,
}) => {
  // Navigation between manager sections: 'estoque' | 'marketing'
  const [managerTab, setManagerTab] = useState<'estoque' | 'marketing'>('estoque');
  // Modal state (for Create & Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);

  // In-App Confirmation Modals
  const [deleteConfirmPrize, setDeleteConfirmPrize] = useState<PrizeItem | null>(null);

  const jsonImportRef = useRef<HTMLInputElement | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Ferragens');
  const [formSku, setFormSku] = useState('CF-BR01');
  const [formInitialStock, setFormInitialStock] = useState('30');
  const [formCurrentStock, setFormCurrentStock] = useState('30');
  const [formColor, setFormColor] = useState('#C81E1E');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIconType, setFormIconType] = useState<PrizeItem['iconType']>('ferramentas');
  const [formIsActive, setFormIsActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // KPI Calculations
  const totalRemainingStock = prizes.reduce((acc, p) => acc + p.currentStock, 0);
  const totalDeliveredToday = prizes.reduce((acc, p) => acc + p.deliveredCount, 0);
  const totalLockedItems = prizes.filter((p) => p.currentStock === 0 || !p.isActive).length;
  const totalActiveItems = prizes.filter((p) => p.currentStock > 0 && p.isActive).length;

  // Open modal in Create mode
  const handleOpenCreateModal = () => {
    setEditingPrizeId(null);
    setFormName('');
    setFormCategory('Ferragens');
    setFormSku(`CF-BR0${prizes.length + 1}`);
    setFormInitialStock('30');
    setFormCurrentStock('30');
    setFormColor('#C81E1E');
    setFormImageUrl('');
    setFormIconType('ferramentas');
    setFormIsActive(true);
    setModalOpen(true);
    soundManager.playClick();
  };

  // Open modal in Edit mode
  const handleOpenEditModal = (prize: PrizeItem) => {
    setEditingPrizeId(prize.id);
    setFormName(prize.name);
    setFormCategory(prize.category || 'Ferragens');
    setFormSku(prize.sku || 'CF-BR01');
    setFormInitialStock(prize.initialStock.toString());
    setFormCurrentStock(prize.currentStock.toString());
    setFormColor(prize.color || '#C81E1E');
    setFormImageUrl(prize.imageUrl || '');
    setFormIconType(prize.iconType || 'ferramentas');
    setFormIsActive(prize.isActive);
    setModalOpen(true);
    soundManager.playClick();
  };

  // Handle Photo upload from user computer/phone
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress so the photo stays light (needed for cloud sync)
    compressImageFile(file)
      .then((dataUrl) => {
        if (dataUrl) setFormImageUrl(dataUrl);
      })
      .catch(() => {});
  };
  const handleSavePrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const initStock = parseInt(formInitialStock, 10) || 10;
    const currStock = parseInt(formCurrentStock, 10) || 0;

    if (editingPrizeId) {
      // Update existing
      const existing = prizes.find((p) => p.id === editingPrizeId);
      if (existing) {
        onUpdatePrize({
          ...existing,
          name: formName.trim(),
          category: formCategory.trim() || 'Geral',
          sku: formSku.trim() || 'CF-BR01',
          initialStock: initStock,
          currentStock: currStock,
          color: formColor,
          textColor: formColor === '#FFFFFF' ? '#C81E1E' : '#FFFFFF',
          imageUrl: formImageUrl.trim() || undefined,
          iconType: formIconType,
          isActive: currStock > 0 ? formIsActive : false,
        });
      }
    } else {
      // Create new
      onAddPrize({
        sliceNumber: prizes.length + 1,
        name: formName.trim(),
        category: formCategory.trim() || 'Geral',
        sku: formSku.trim() || `CF-BR0${prizes.length + 1}`,
        initialStock: initStock,
        currentStock: initStock,
        deliveredCount: 0,
        color: formColor,
        textColor: formColor === '#FFFFFF' ? '#C81E1E' : '#FFFFFF',
        imageUrl: formImageUrl.trim() || undefined,
        iconType: formIconType,
        isActive: initStock > 0,
      });
    }

    setModalOpen(false);
    soundManager.playClick();
  };

  // Delete prize confirmation (In-app modal instead of blocked window.confirm)
  const handleDelete = (prize: PrizeItem) => {
    soundManager.playClick();
    setDeleteConfirmPrize(prize);
  };

  const handleExportReport = () => {
    soundManager.playClick();
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Fatia,Nome,Categoria,SKU,Inicial,Entregues,Saldo,Status']
        .concat(
          prizes.map(
            (p, i) =>
              `#${i + 1},"${p.name}","${p.category}","${p.sku}",${p.initialStock},${p.deliveredCount},${p.currentStock},${
                p.currentStock > 0 && p.isActive ? 'Ativo' : 'Esgotado/Bloqueado'
              }`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_estoque_fontenele_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBackupJson = () => {
    soundManager.playClick();
    const backupData = {
      app: 'Comercial Fontenele Roleta',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prizes,
      drawHistory,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_fontenele_roleta_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (Array.isArray(parsed)) {
          onImportBackup?.(parsed);
        } else if (parsed && Array.isArray(parsed.prizes)) {
          onImportBackup?.(parsed.prizes);
        }
      } catch {
        // Fallback
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F1F4F9] p-4 sm:p-6 lg:p-8 flex flex-col gap-6 selection:bg-[#C81E1E] selection:text-white">
      {/* Top Header - Removed "Cadastro Rápido" as requested by user */}
      <header className="bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={onNavigateToWheel}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-red-200 bg-[#991B1B] shrink-0">
            <img
              src={OFFICIAL_LOGO_SRC}
              alt="Comercial Fontenele"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="font-bold text-lg tracking-tight text-[#111827] font-['Montserrat',sans-serif]">
              Comercial
            </span>
            <span className="font-black text-xl tracking-tight text-[#C81E1E] font-['Montserrat',sans-serif] uppercase">
              FONTENELE
            </span>
          </div>
        </div>

        {/* Center: Tabs do Modo Gerente */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setManagerTab('estoque');
            }}
            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold font-['Montserrat',sans-serif] transition-all cursor-pointer ${
              managerTab === 'estoque'
                ? 'bg-[#C81E1E] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Estoque de Brindes
          </button>
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setManagerTab('marketing');
            }}
            className={`flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold font-['Montserrat',sans-serif] transition-all cursor-pointer ${
              managerTab === 'marketing'
                ? 'bg-[#C81E1E] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Marketing & TV</span>
          </button>
        </div>

        {/* Right Chips & Sair button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/70 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">{totalRemainingStock} brindes disponíveis</span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onNavigateToWheel();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-['Montserrat',sans-serif] transition-all cursor-pointer shadow-2xs"
            title="Sair do modo gerente e voltar ao totem"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {managerTab === 'marketing' ? (
        <MarketingTab onTestScreensaver={onTestScreensaver || onNavigateToWheel} />
      ) : (
        <>
          {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: ESTOQUE GLOBAL ATIVO */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-[#C81E1E] p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B] font-['Montserrat',sans-serif]">
                ESTOQUE GLOBAL ATIVO
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-[#111827] font-mono">
                  {totalRemainingStock}
                </span>
                <span className="text-sm font-bold text-slate-500">un.</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C81E1E] flex items-center justify-center border border-red-100">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Estoque Seguro
            </span>
            <span className="text-slate-500 font-medium">
              {totalActiveItems} itens operando
            </span>
          </div>
        </div>

        {/* Card 2: BRINDES SORTEADOS HOJE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-[#C81E1E] p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B] font-['Montserrat',sans-serif]">
                BRINDES SORTEADOS HOJE
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-[#111827] font-mono">
                  {totalDeliveredToday}
                </span>
                <span className="text-sm font-bold text-slate-500">un.</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Gift className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>Média de 7 brindes/hora no balcão</span>
          </div>
        </div>

        {/* Card 3: ITENS ESGOTADOS / TRAVADOS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-[#C81E1E] p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B] font-['Montserrat',sans-serif]">
                ITENS ESGOTADOS / TRAVADOS
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-[#C81E1E] font-mono">
                  {totalLockedItems}
                </span>
                <span className="text-sm font-bold text-slate-500">item</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C81E1E] flex items-center justify-center border border-red-100">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-[#C81E1E] font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Bloqueado automaticamente da roleta</span>
          </div>
        </div>
      </div>

      {/* Main Table Card with CRUD Operations */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Header Section */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-[#111827] font-['Montserrat',sans-serif]">
                Catálogo de Brindes na Roleta
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                {prizes.length} Cadastrados
              </span>
            </div>
            <p className="mt-1 text-xs text-[#64748B] flex items-center gap-1.5 font-medium">
              <RefreshCw className="w-3.5 h-3.5 text-[#C81E1E]" />
              <span>Itens com saldo 0 saem imediatamente do sorteio para evitar insatisfação do cliente no balcão.</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C81E1E] hover:bg-[#991B1B] text-white text-xs sm:text-sm font-black font-['Montserrat',sans-serif] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Cadastrar Novo Brinde</span>
            </button>
          </div>
        </div>

        {/* Table with CRUD columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FAFBFD] text-[11px] font-black uppercase tracking-wider text-[#64748B] border-b border-slate-200 font-['Montserrat',sans-serif]">
              <tr>
                <th className="py-3 px-4 sm:px-6">FATIA</th>
                <th className="py-3 px-4">BRINDE COMERCIAL FONTENELE</th>
                <th className="py-3 px-4 text-center">INICIAL</th>
                <th className="py-3 px-4 text-center">ENTREGUES</th>
                <th className="py-3 px-4 text-center">SALDO ATUAL</th>
                <th className="py-3 px-4">NÍVEL</th>
                <th className="py-3 px-4 text-center">STATUS NA ROLETA</th>
                <th className="py-3 px-4 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prizes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 px-4 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#C81E1E] border border-red-100 flex items-center justify-center shadow-xs">
                        <Gift className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-[#111827] font-['Montserrat',sans-serif]">
                          Catálogo 100% Zerado
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Nenhum brinde cadastrado ainda. Comece do zero adicionando seus próprios produtos com fotos, SKU e estoque!
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                        <button
                          type="button"
                          onClick={handleOpenCreateModal}
                          className="px-4 py-2.5 bg-[#C81E1E] hover:bg-[#991B1B] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm font-['Montserrat',sans-serif]"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Primeiro Brinde</span>
                        </button>
                        {onLoadSamplePrizes && (
                          <button
                            type="button"
                            onClick={onLoadSamplePrizes}
                            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer font-['Montserrat',sans-serif] shadow-2xs"
                          >
                            <span>Carregar Brindes Exemplo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                prizes.map((prize, idx) => {
                  const isOutOfStock = prize.currentStock === 0;
                  const stockPercent = prize.initialStock > 0
                    ? Math.min(Math.round((prize.currentStock / prize.initialStock) * 100), 100)
                    : 0;

                  const isRedSlice = idx % 2 === 0;

                  return (
                  <tr
                    key={prize.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isOutOfStock ? 'bg-slate-50/40 text-slate-400' : ''
                    }`}
                  >
                    {/* Column 1: FATIA */}
                    <td className="py-4 px-4 sm:px-6">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs font-['Montserrat',sans-serif] shadow-2xs ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-500'
                            : isRedSlice
                            ? 'bg-[#C81E1E] text-white'
                            : 'bg-white border border-slate-300 text-slate-800'
                        }`}
                      >
                        #{idx + 1}
                      </div>
                    </td>

                    {/* Column 2: BRINDE COMERCIAL FONTENELE */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <ProductThumbnail
                          type={prize.iconType}
                          imageUrl={prize.imageUrl}
                          isOutOfStock={isOutOfStock}
                        />
                        <div>
                          <div
                            className={`font-black text-sm font-['Montserrat',sans-serif] ${
                              isOutOfStock
                                ? 'line-through text-slate-400'
                                : 'text-[#111827]'
                            }`}
                          >
                            {prize.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {prize.category} • SKU: {prize.sku}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: INICIAL */}
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-600">
                      {prize.initialStock} un.
                    </td>

                    {/* Column 4: ENTREGUES */}
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-600">
                      {prize.deliveredCount} un.
                    </td>

                    {/* Column 5: SALDO ATUAL (steppers) */}
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onUpdateStock(prize.id, -1);
                          }}
                          disabled={prize.currentStock <= 0}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer font-bold"
                          title="Diminuir saldo (-1)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span
                          className={`w-10 text-center font-black font-mono text-base sm:text-lg ${
                            isOutOfStock
                              ? 'text-red-600'
                              : stockPercent < 45
                              ? 'text-amber-600'
                              : 'text-[#111827]'
                          }`}
                        >
                          {prize.currentStock}
                        </span>

                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onUpdateStock(prize.id, 1);
                          }}
                          className="w-7 h-7 rounded-lg bg-[#C81E1E] hover:bg-[#991B1B] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs font-bold"
                          title="Aumentar saldo (+1)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Column 6: NÍVEL */}
                    <td className="py-4 px-4 w-44">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="font-mono">{stockPercent}%</span>
                          <span
                            className={
                              isOutOfStock
                                ? 'text-red-600 font-extrabold'
                                : stockPercent <= 40
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            }
                          >
                            {isOutOfStock
                              ? 'Esgotado'
                              : stockPercent <= 40
                              ? 'Alerta Âmbar'
                              : 'Disponível'}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOutOfStock
                                ? 'bg-slate-300'
                                : stockPercent <= 40
                                ? 'bg-amber-500'
                                : 'bg-[#C81E1E]'
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Column 7: STATUS NA ROLETA (Interativo) */}
                    <td className="py-4 px-4 text-center">
                      {isOutOfStock ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black bg-red-50 text-[#C81E1E] border border-red-200 cursor-not-allowed select-none"
                          title="Saldo esgotado. Aumente o saldo (+) para reativar na roleta."
                        >
                          <Lock className="w-3 h-3" />
                          <span>Esgotado - Fora da Roleta</span>
                        </span>
                      ) : prize.isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playClick();
                            onToggleStatus(prize.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs group"
                          title="Clique para desativar este brinde da roleta"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                          <span>Ativo na Roleta</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playClick();
                            onToggleStatus(prize.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200 transition-colors cursor-pointer shadow-2xs group"
                          title="Clique para ativar este brinde na roleta"
                        >
                          <span className="w-2 h-2 rounded-full bg-slate-400 group-hover:scale-125 transition-transform" />
                          <span>Inativo - Fora da Roleta</span>
                        </button>
                      )}
                    </td>

                    {/* Column 8: AÇÕES (CRUD: Editar & Excluir) */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(prize)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-[#C81E1E] transition-colors cursor-pointer shadow-2xs"
                          title="Editar brinde e foto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(prize)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
                          title="Excluir brinde do catálogo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* Bottom Card Footer */}
        <div className="p-4 sm:p-5 bg-[#FAFBFD] border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#64748B] font-medium">
            <RefreshCw className="w-3.5 h-3.5 text-[#C81E1E]" />
            <span>Sincronização em tempo real com o Terminal da Roleta ativada.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={jsonImportRef}
              type="file"
              accept=".json"
              onChange={handleImportBackupJson}
              className="hidden"
            />

            <button
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold font-['Montserrat',sans-serif] transition-colors cursor-pointer shadow-2xs"
              title="Exportar dados do turno em formato CSV para planilhas"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV do Turno</span>
            </button>

            <button
              onClick={handleExportBackupJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50/50 hover:bg-sky-100 text-sky-900 font-bold font-['Montserrat',sans-serif] transition-colors cursor-pointer shadow-2xs"
              title="Baixar backup completo de todos os produtos e cadastros em JSON"
            >
              <Download className="w-3.5 h-3.5 text-sky-700" />
              <span>Baixar Backup (JSON)</span>
            </button>

            <button
              onClick={() => jsonImportRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-900 font-bold font-['Montserrat',sans-serif] transition-colors cursor-pointer shadow-2xs"
              title="Restaurar cadastro de brindes a partir de um arquivo JSON"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Restaurar JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* CRUD Modal: Cadastrar ou Editar Brinde com Upload de Foto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-[#111827] font-['Montserrat',sans-serif]">
                  {editingPrizeId ? 'Editar Brinde' : 'Cadastrar Novo Brinde'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adicione fotos, altere saldos e personalize as informações do prêmio.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrize} className="mt-5 space-y-4">
              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 font-['Montserrat',sans-serif]">
                  Foto do Produto (Aparece no Sorteio)
                </label>

                <div className="flex items-center gap-4">
                  {/* Photo Preview Box */}
                  <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 group">
                    {formImageUrl ? (
                      <>
                        <img
                          src={formImageUrl}
                          alt="Prévia do produto"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                        >
                          Remover
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer shadow-2xs font-['Montserrat',sans-serif]"
                    >
                      <Upload className="w-4 h-4 text-[#C81E1E]" />
                      <span>Carregar Foto do Aparelho</span>
                    </button>

                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Ou cole a URL da imagem aqui"
                      className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#C81E1E]"
                    />
                  </div>
                </div>
              </div>

              {/* Nome do Brinde */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 font-['Montserrat',sans-serif]">
                  Nome do Brinde *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Trena Emborrachada 5m"
                  className="w-full h-11 px-3.5 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C81E1E] focus:border-[#C81E1E]"
                  required
                />
              </div>

              {/* Categoria & SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 font-['Montserrat',sans-serif]">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: Ferragens"
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 font-['Montserrat',sans-serif]">
                    SKU / Código
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="Ex: CF-TR5M"
                    className="w-full h-10 px-3 text-xs font-mono font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
                  />
                </div>
              </div>

              {/* Estoque Inicial & Saldo Atual */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 font-['Montserrat',sans-serif]">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formInitialStock}
                    onChange={(e) => setFormInitialStock(e.target.value)}
                    className="w-full h-10 px-3 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
                    required
                  />
                </div>
                {editingPrizeId && (
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 font-['Montserrat',sans-serif]">
                      Saldo Atual
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formCurrentStock}
                      onChange={(e) => setFormCurrentStock(e.target.value)}
                      className="w-full h-10 px-3 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
                    />
                  </div>
                )}
              </div>

              {/* Cor da Fatia na Roleta */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 font-['Montserrat',sans-serif]">
                  Cor da Fatia na Roleta
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { color: '#C81E1E', label: 'Vermelho' },
                    { color: '#FFFFFF', label: 'Branco' },
                    { color: '#991B1B', label: 'Bordô' },
                    { color: '#111827', label: 'Preto Master' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.color}
                      onClick={() => setFormColor(opt.color)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer font-['Montserrat',sans-serif] ${
                        formColor === opt.color
                          ? 'border-[#C81E1E] ring-2 ring-[#C81E1E]/30 bg-red-50/40 text-[#991B1B]'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Toggle (Ativo no sorteio) */}
              {editingPrizeId && (
                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 text-[#C81E1E] rounded focus:ring-[#C81E1E]"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Brinde ativo no giro da roleta
                    </span>
                  </label>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-['Montserrat',sans-serif]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-[#C81E1E] hover:bg-[#991B1B] text-white cursor-pointer font-['Montserrat',sans-serif] shadow-xs flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Salvar Brinde</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão (In-App Dialog - Funciona perfeitamente em iframes) */}
      {deleteConfirmPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-red-100 max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#111827] font-['Montserrat',sans-serif]">
                  Excluir Brinde do Catálogo?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta ação removerá o item da roleta e do estoque.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {deleteConfirmPrize.imageUrl ? (
                  <img
                    src={deleteConfirmPrize.imageUrl}
                    alt={deleteConfirmPrize.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-[#C81E1E]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#111827] truncate font-['Montserrat',sans-serif]">
                  {deleteConfirmPrize.name}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  SKU: {deleteConfirmPrize.sku} • Saldo: {deleteConfirmPrize.currentStock} un.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Você tem certeza? A fatia correspondente a este brinde será removida da roleta premiada de balcão imediatamente.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmPrize(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer font-['Montserrat',sans-serif]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onDeletePrize(deleteConfirmPrize.id);
                  setDeleteConfirmPrize(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-500/25 cursor-pointer font-['Montserrat',sans-serif] flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
