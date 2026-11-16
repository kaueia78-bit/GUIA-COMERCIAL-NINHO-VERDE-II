import React, { useState, useEffect } from 'react';
import { Business, Category, ContactMessage, AdminStats } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { formatWhatsAppDisplay } from '../utils/whatsapp.ts';
import { getCategoryIcon } from '../utils/categoryIcons.tsx';
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  MessageSquare,
  Layers,
  Store,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onDataChanged }) => {
  const { token, role, logout, loginWithPassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'businesses' | 'categories' | 'messages'>('pending');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editBizCustomNiche, setEditBizCustomNiche] = useState('');
  const [editBizUseCustomNiche, setEditBizUseCustomNiche] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatSubText, setEditCatSubText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [newCatData, setNewCatData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Store',
    subcategoriesText: '',
  });

  // Password Login state
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // In-app delete confirmation state (avoids window.confirm in iframes/mobile)
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'business' | 'category';
    id: number;
    name: string;
  } | null>(null);

  const fetchAdminData = async (silent = false) => {
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (!currentToken) return;
    if (!silent) setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${currentToken}` };

      const [statsRes, bizRes, catRes, msgRes] = await Promise.all([
        fetch('/api/admin/stats', { headers, cache: 'no-store' }),
        fetch('/api/admin/businesses?status=all', { headers, cache: 'no-store' }),
        fetch('/api/admin/categories', { headers, cache: 'no-store' }),
        fetch('/api/admin/messages', { headers, cache: 'no-store' }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (bizRes.ok) setBusinesses(await bizRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (msgRes.ok) setMessages(await msgRes.json());
    } catch (err) {
      console.error('Erro ao carregar dados administrativos:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (role === 'admin' || token)) {
      fetchAdminData();

      let eventSource: EventSource | null = null;
      try {
        eventSource = new EventSource('/api/events');
        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type && payload.type !== 'connected') {
              fetchAdminData(true);
            }
          } catch {
            // Ignore malformed SSE event
          }
        };
      } catch {
        // Silent fallback
      }

      return () => {
        eventSource?.close();
      };
    }
  }, [isOpen, role, token]);

  if (!isOpen) return null;

  // Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      await loginWithPassword(passwordInput);
      setPasswordInput('');
      await fetchAdminData();
      onDataChanged();
    } catch (err: any) {
      setLoginError(err.message || 'Senha incorreta.');
    } finally {
      setLoginLoading(false);
    }
  };

  // If not logged in as admin, display the password unlock screen
  if (role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF4E9] text-[#315B3D] flex items-center justify-center mx-auto shadow-sm">
              <KeyRound className="w-7 h-7 text-[#315B3D]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1F3325]">
              Acesso Administrativo
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Digite a senha do painel para gerenciar cadastros, aprovar solicitações e controlar o catálogo do Ninho Verde II.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {loginError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Senha de Administrador
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Digite a senha..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-3 pr-10 text-base sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-[#315B3D] hover:bg-[#25462e] text-white font-bold rounded-xl text-sm shadow-md shadow-[#315B3D]/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? 'Verificando senha...' : 'Entrar no Painel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Actions on business
  const handleApprove = async (id: number) => {
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (!currentToken) return;
    try {
      const res = await fetch(`/api/admin/businesses/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (res.ok) {
        await fetchAdminData();
        onDataChanged();
      }
    } catch (err) {
      console.error('Erro ao aprovar:', err);
    }
  };

  const handleRejectConfirm = async () => {
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (!currentToken || !rejectingId) return;
    try {
      const res = await fetch(`/api/admin/businesses/${rejectingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: rejectionReason || 'Não atende aos critérios do residencial.',
        }),
      });
      if (res.ok) {
        setRejectingId(null);
        setRejectionReason('');
        await fetchAdminData();
        onDataChanged();
      }
    } catch (err) {
      console.error('Erro ao recusar:', err);
    }
  };

  const handleToggleStatus = async (biz: Business) => {
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (!currentToken) return;
    const nextStatus = biz.status === 'approved' ? 'suspended' : 'approved';
    try {
      const res = await fetch(`/api/admin/businesses/${biz.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await fetchAdminData();
        onDataChanged();
      }
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    }
  };

  const openEditBusiness = (biz: Business) => {
    setActionError(null);
    const cat = categories.find((c) => Number(c.id) === Number(biz.categoryId));
    const subs = cat?.subcategories || [];
    const currentSub = (biz.subcategory || '').trim();
    const isOther =
      !cat ||
      cat.slug === 'outros-servicos' ||
      cat.name.toLowerCase().includes('outro') ||
      subs.length === 0;
    const isListedSub = currentSub && subs.includes(currentSub);

    setEditingBusiness({
      ...biz,
      categoryId: cat ? cat.id : categories[0]?.id || biz.categoryId,
      categoryName: cat ? cat.name : biz.categoryName,
      subcategory: isListedSub ? currentSub : isOther ? '' : subs[0] || '',
    });

    if (isOther || (currentSub && !isListedSub)) {
      setEditBizUseCustomNiche(true);
      setEditBizCustomNiche(currentSub);
    } else {
      setEditBizUseCustomNiche(false);
      setEditBizCustomNiche('');
    }
  };

  const handleDeleteBusinessConfirm = async (id: number) => {
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (!currentToken) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir cadastro');
      setConfirmDelete(null);
      await fetchAdminData();
      onDataChanged();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao excluir cadastro');
      setConfirmDelete(null);
    }
  };

  const handleSaveBusinessEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (!currentToken || !editingBusiness) return;
    setActionError(null);

    const selectedCat = categories.find((c) => Number(c.id) === Number(editingBusiness.categoryId));
    const resolvedSub = editBizUseCustomNiche
      ? editBizCustomNiche.trim()
      : (editingBusiness.subcategory || '').trim();

    if (editBizUseCustomNiche && !resolvedSub) {
      setActionError('Informe o nicho ou atividade específica do negócio.');
      return;
    }

    const updatedKeywords = Array.from(
      new Set(
        [
          selectedCat?.name || editingBusiness.categoryName,
          resolvedSub,
          ...(editingBusiness.keywords || '').split(',').map((k) => k.trim()),
        ].filter(Boolean)
      )
    ).join(', ');

    try {
      const res = await fetch(`/api/admin/businesses/${editingBusiness.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          name: editingBusiness.name,
          ownerName: editingBusiness.ownerName,
          categoryId: Number(editingBusiness.categoryId),
          categoryName: selectedCat?.name || editingBusiness.categoryName,
          subcategory: resolvedSub || null,
          description: editingBusiness.description,
          whatsapp: editingBusiness.whatsapp.replace(/\D/g, ''),
          keywords: updatedKeywords,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar alterações do negócio');
      setEditingBusiness(null);
      await fetchAdminData();
      onDataChanged();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao salvar negócio');
    }
  };

  const sanitizeSlugClient = (val: string) =>
    val
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  // Categories CRUD
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (!currentToken) return;
    setActionError(null);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          name: newCatData.name,
          slug: sanitizeSlugClient(newCatData.slug || newCatData.name),
          description: newCatData.description,
          icon: newCatData.icon,
          subcategories: newCatData.subcategoriesText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar categoria');
      setNewCategoryModalOpen(false);
      setNewCatData({ name: '', slug: '', description: '', icon: 'Store', subcategoriesText: '' });
      await fetchAdminData();
      onDataChanged();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao criar categoria');
    }
  };

  const handleSaveCategoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (!currentToken || !editingCategory) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          name: editingCategory.name,
          description: editingCategory.description,
          icon: editingCategory.icon,
          active: editingCategory.active,
          subcategories: editCatSubText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar categoria');
      setEditingCategory(null);
      await fetchAdminData();
      onDataChanged();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao atualizar categoria');
    }
  };

  const handleDeleteCategoryConfirm = async (id: number) => {
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (!currentToken) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir categoria');
      setConfirmDelete(null);
      await fetchAdminData();
      onDataChanged();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao excluir categoria');
      setConfirmDelete(null);
    }
  };

  const pendingList = businesses.filter((b) => b.status === 'pending');
  const filteredBusinesses = businesses.filter((b) => {
    const q = adminSearch.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.ownerName.toLowerCase().includes(q) ||
      b.categoryName.toLowerCase().includes(q) ||
      b.keywords.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="bg-[#F8FAF8] rounded-2xl sm:rounded-3xl max-w-6xl w-full h-[94dvh] sm:h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden relative">
        {/* Top Bar */}
        <div className="bg-white px-4 py-3 sm:px-6 sm:py-4 border-b border-[#E2EBE2] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#315B3D] text-white flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#8DBF91]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-extrabold text-[#1F3325] truncate">
                  Painel Administrativo
                </h2>
                <span className="hidden sm:inline-flex text-[10px] font-bold bg-[#EAF4E9] text-[#315B3D] px-2 py-0.5 rounded-full border border-[#8DBF91]/50 shrink-0">
                  Senha Ativa
                </span>
              </div>
              <p className="hidden sm:block text-xs text-gray-500 truncate">
                Controle de qualidade, verificação de moradores e gestão do catálogo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => fetchAdminData()}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl border border-red-200 font-semibold transition-colors cursor-pointer"
              title="Encerrar sessão de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Fechar painel"
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="bg-white px-4 sm:px-6 py-2.5 sm:py-3 border-b border-[#E2EBE2] grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 shrink-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 block">Total</span>
              <span className="text-base sm:text-xl font-black text-[#1F3325]">{stats.total}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 border border-amber-200/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-amber-700 block">Pendentes</span>
              <span className="text-base sm:text-xl font-black text-amber-800">{stats.pending}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 block">Aprovados</span>
              <span className="text-base sm:text-xl font-black text-emerald-800">{stats.approved}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-red-50 border border-red-200/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-red-700 block">Recusados</span>
              <span className="text-base sm:text-xl font-black text-red-800">{stats.rejected}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#EAF4E9] border border-[#8DBF91]/50">
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#315B3D] block">Categorias</span>
              <span className="text-base sm:text-xl font-black text-[#315B3D]">{stats.categoriesCount}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 border border-blue-200/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 block">Mensagens</span>
              <span className="text-base sm:text-xl font-black text-blue-800">{stats.unreadMessages}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation (Horizontally scrollable on mobile/tablet) */}
        <div className="bg-white px-4 sm:px-6 border-b border-[#E2EBE2] flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
              activeTab === 'pending'
                ? 'border-[#315B3D] text-[#315B3D]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Solicitações Pendentes
            {pendingList.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full font-bold">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('businesses')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
              activeTab === 'businesses'
                ? 'border-[#315B3D] text-[#315B3D]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Store className="w-4 h-4" />
            Negócios ({businesses.length})
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
              activeTab === 'categories'
                ? 'border-[#315B3D] text-[#315B3D]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Categorias
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
              activeTab === 'messages'
                ? 'border-[#315B3D] text-[#315B3D]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Mensagens ({messages.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {actionError && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-2 text-xs text-red-700 font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button
                onClick={() => setActionError(null)}
                className="p-1 hover:bg-red-100 rounded-lg cursor-pointer"
                aria-label="Fechar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: PENDING REQUESTS */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1F3325]">
                  Novas Solicitações de Cadastro Aguardando Análise
                </h3>
                <span className="text-xs text-gray-500">
                  Cadastros pendentes NÃO aparecem no catálogo público.
                </span>
              </div>

              {pendingList.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-200">
                  <Check className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-gray-700">Tudo em dia!</p>
                  <p className="text-xs text-gray-500">Não há nenhuma solicitação pendente no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingList.map((biz) => (
                    <div
                      key={biz.id}
                      className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            Pendente de Verificação
                          </span>
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                            {biz.categoryName}{biz.subcategory ? ` › ${biz.subcategory}` : ''}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Enviado em {biz.createdAt ? new Date(biz.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-[#1F3325]">{biz.name}</h4>
                        <p className="text-xs text-gray-600">
                          <strong>Responsável:</strong> {biz.ownerName} • <strong>WhatsApp:</strong>{' '}
                          {formatWhatsAppDisplay(biz.whatsapp)}
                        </p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          {biz.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          <strong>Palavras-chave:</strong> {biz.keywords}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => {
                            setRejectingId(biz.id);
                            setRejectionReason('');
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" /> Recusar
                        </button>
                        <button
                          onClick={() => handleApprove(biz.id)}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Aprovar e Publicar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL BUSINESSES */}
          {activeTab === 'businesses' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Filtrar empreendedores ou serviços..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-base sm:text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8DBF91]"
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  Mostrando {filteredBusinesses.length} de {businesses.length} registros
                </span>
              </div>

              {/* Mobile card layout for businesses */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredBusinesses.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{b.name}</h4>
                        <p className="text-xs text-gray-500">{b.ownerName} • {formatWhatsAppDisplay(b.whatsapp)}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          b.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : b.status === 'suspended'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {b.status === 'approved'
                          ? 'Aprovado'
                          : b.status === 'pending'
                          ? 'Pendente'
                          : b.status === 'suspended'
                          ? 'Suspenso'
                          : 'Recusado'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {b.categoryName}
                      {b.subcategory ? ` › ${b.subcategory}` : ''}
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleStatus(b)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          b.status === 'approved'
                            ? 'text-amber-700 border-amber-200 bg-amber-50'
                            : 'text-emerald-700 border-emerald-200 bg-emerald-50'
                        }`}
                      >
                        {b.status === 'approved' ? (
                          <><PauseCircle className="w-3.5 h-3.5" /> Suspender</>
                        ) : (
                          <><PlayCircle className="w-3.5 h-3.5" /> Ativar</>
                        )}
                      </button>
                      <button
                        onClick={() => openEditBusiness(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ type: 'business', id: b.id, name: b.name })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 border border-red-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EAF4E9] text-[#315B3D] font-bold border-b border-[#D5E4D6]">
                      <tr>
                        <th className="p-3.5">Nome Comercial</th>
                        <th className="p-3.5">Responsável</th>
                        <th className="p-3.5">Categoria</th>
                        <th className="p-3.5">WhatsApp</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredBusinesses.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3.5 font-bold text-gray-900 max-w-[200px] truncate">
                            {b.name}
                          </td>
                          <td className="p-3.5 text-gray-600">{b.ownerName}</td>
                          <td className="p-3.5 text-gray-600">
                            {b.categoryName}
                            {b.subcategory && (
                              <span className="block text-[10px] text-[#315B3D] font-semibold">
                                {b.subcategory}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-gray-600">{formatWhatsAppDisplay(b.whatsapp)}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : b.status === 'suspended'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {b.status === 'approved'
                                ? 'Aprovado'
                                : b.status === 'pending'
                                ? 'Pendente'
                                : b.status === 'suspended'
                                ? 'Suspenso'
                                : 'Recusado'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            {/* Toggle Suspend/Approve */}
                            <button
                              onClick={() => handleToggleStatus(b)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                b.status === 'approved'
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={b.status === 'approved' ? 'Suspender anúncio' : 'Ativar anúncio'}
                            >
                              {b.status === 'approved' ? (
                                <PauseCircle className="w-4 h-4" />
                              ) : (
                                <PlayCircle className="w-4 h-4" />
                              )}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditBusiness(b)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar dados"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setConfirmDelete({ type: 'business', id: b.id, name: b.name })}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1F3325]">Categorias Comerciais</h3>
                  <p className="text-xs text-gray-500">
                    Crie, edite ou remova categorias do catálogo comercial.
                  </p>
                </div>
                <button
                  onClick={() => setNewCategoryModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-[#315B3D] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#25462e] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nova Categoria
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#EAF4E9] text-[#315B3D] flex items-center justify-center shrink-0">
                          {getCategoryIcon(c.icon, { className: 'w-4 h-4' })}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-gray-800">{c.name}</h4>
                          <span className="text-[10px] text-gray-400">
                            {c.subcategories?.length ? `${c.subcategories.length} atividades` : `/${c.slug}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setEditCatSubText((c.subcategories || []).join(', '));
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar categoria e atividades"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: 'category', id: c.id, name: c.name })}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {c.subcategories && c.subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
                        {c.subcategories.slice(0, 5).map((sub) => (
                          <span key={sub} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {sub}
                          </span>
                        ))}
                        {c.subcategories.length > 5 && (
                          <span className="text-[10px] text-[#315B3D] font-semibold px-1">
                            +{c.subcategories.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#1F3325]">
                Mensagens Enviadas pelo Formulário de Contato
              </h3>

              {messages.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-200">
                  <p className="text-xs text-gray-500">Nenhuma mensagem recebida ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl p-5 border border-gray-200 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#1F3325]">{m.name}</span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(m.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex gap-4">
                        <span><strong>E-mail:</strong> {m.email}</span>
                        {m.phone && <span><strong>Telefone:</strong> {m.phone}</span>}
                      </div>
                      <h5 className="text-xs font-bold text-[#315B3D]">Assunto: {m.subject}</h5>
                      <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {m.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {rejectingId && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
              <h4 className="font-bold text-gray-900 text-sm">Recusar Solicitação de Cadastro</h4>
              <p className="text-xs text-gray-500">
                Informe o motivo da recusa para fins de controle e registro:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Não foi possível confirmar vínculo de residência ou número de WhatsApp inválido."
                rows={3}
                className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRejectingId(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="px-4 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                >
                  Confirmar Recusa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Business Modal */}
        {editingBusiness && (() => {
          const editCatObj = categories.find((c) => Number(c.id) === Number(editingBusiness.categoryId));
          const editCatSubs = editCatObj?.subcategories || [];
          const editCatIsOther =
            !editCatObj ||
            editCatObj.slug === 'outros-servicos' ||
            editCatObj.name.toLowerCase().includes('outro') ||
            editCatSubs.length === 0;

          return (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-start sm:items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-xl my-auto max-h-[88dvh] overflow-y-auto">
                <h4 className="font-bold text-gray-900 text-sm">Editar Cadastro de Negócio</h4>
                <form onSubmit={handleSaveBusinessEdit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Nome do Negócio *</label>
                    <input
                      type="text"
                      required
                      value={editingBusiness.name}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, name: e.target.value })}
                      className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Responsável *</label>
                    <input
                      type="text"
                      required
                      value={editingBusiness.ownerName}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, ownerName: e.target.value })}
                      className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAF8] border border-[#E2EBE2]">
                    <div>
                      <label className="block font-bold mb-1">Categoria de atuação *</label>
                      <select
                        value={editingBusiness.categoryId}
                        onChange={(e) => {
                          const nextCat = categories.find((c) => String(c.id) === e.target.value);
                          const nextSubs = nextCat?.subcategories || [];
                          const nextIsOther =
                            !nextCat ||
                            nextCat.slug === 'outros-servicos' ||
                            nextCat.name.toLowerCase().includes('outro') ||
                            nextSubs.length === 0;
                          setEditingBusiness({
                            ...editingBusiness,
                            categoryId: Number(e.target.value),
                            categoryName: nextCat?.name || editingBusiness.categoryName,
                            subcategory: nextIsOther ? '' : nextSubs[0] || '',
                          });
                          setEditBizUseCustomNiche(nextIsOther);
                          if (!nextIsOther) setEditBizCustomNiche('');
                        }}
                        className="w-full p-2.5 text-base sm:text-xs bg-white border border-gray-300 rounded-xl"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!editCatIsOther && (
                      <div>
                        <label className="block font-bold mb-1">Atividade específica *</label>
                        <select
                          value={editBizUseCustomNiche ? '__custom__' : editingBusiness.subcategory || ''}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setEditBizUseCustomNiche(true);
                            } else {
                              setEditBizUseCustomNiche(false);
                              setEditBizCustomNiche('');
                              setEditingBusiness({ ...editingBusiness, subcategory: e.target.value });
                            }
                          }}
                          className="w-full p-2.5 text-base sm:text-xs bg-white border border-gray-300 rounded-xl"
                        >
                          {editCatSubs.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                          <option value="__custom__">Não encontrei minha atividade (informar nicho)</option>
                        </select>
                      </div>
                    )}

                    {(editCatIsOther || editBizUseCustomNiche) && (
                      <div className="sm:col-span-2">
                        <label className="block font-bold mb-1">Nicho / Atividade específica *</label>
                        <input
                          type="text"
                          required
                          value={editBizCustomNiche}
                          onChange={(e) => setEditBizCustomNiche(e.target.value)}
                          placeholder="Ex: Barbeiro, Piscineiro, Locação de caçambas"
                          className="w-full p-2.5 text-base sm:text-xs bg-white border border-gray-300 rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-bold mb-1">WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={editingBusiness.whatsapp}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, whatsapp: e.target.value })}
                      className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Descrição *</label>
                    <textarea
                      rows={3}
                      required
                      value={editingBusiness.description}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, description: e.target.value })}
                      className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Palavras-chave</label>
                    <input
                      type="text"
                      value={editingBusiness.keywords}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, keywords: e.target.value })}
                      className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingBusiness(null)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold bg-[#315B3D] text-white rounded-xl hover:bg-[#25462e] cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* Create Category Modal */}
        {newCategoryModalOpen && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-start sm:items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-xl my-auto max-h-[88dvh] overflow-y-auto">
              <h4 className="font-bold text-gray-900 text-sm">Criar Nova Categoria</h4>
              <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Nome da Categoria *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Farmácias e Saúde"
                    value={newCatData.name}
                    onChange={(e) => setNewCatData({ ...newCatData, name: e.target.value })}
                    className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Slug (opcional)</label>
                  <input
                    type="text"
                    placeholder="farmacias-e-saude"
                    value={newCatData.slug}
                    onChange={(e) => setNewCatData({ ...newCatData, slug: e.target.value })}
                    className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Ícone</label>
                  <select
                    value={newCatData.icon}
                    onChange={(e) => setNewCatData({ ...newCatData, icon: e.target.value })}
                    className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                  >
                    <option value="Store">Loja / Comércio (Store)</option>
                    <option value="Utensils">Alimentação (Utensils)</option>
                    <option value="Cake">Doces e Bolos (Cake)</option>
                    <option value="Pizza">Pizzaria (Pizza)</option>
                    <option value="Waves">Piscinas (Waves)</option>
                    <option value="Trees">Jardinagem (Trees)</option>
                    <option value="Car">Automotivo (Car)</option>
                    <option value="Scissors">Beleza / Barbeiro (Scissors)</option>
                    <option value="Hammer">Construção (Hammer)</option>
                    <option value="Wrench">Elétrica / Hidráulica (Wrench)</option>
                    <option value="Sparkles">Estética / Limpeza (Sparkles)</option>
                    <option value="Dog">Pets (Dog)</option>
                    <option value="Dumbbell">Esportes e Aulas (Dumbbell)</option>
                    <option value="Navigation">Transporte (Navigation)</option>
                    <option value="Package">Locação de Equipamentos (Package)</option>
                    <option value="Briefcase">Outros Serviços (Briefcase)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Subcategorias / Atividades (separadas por vírgula)</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Barbeiro, Manicure e pedicure, Cabeleireiro(a)"
                    value={newCatData.subcategoriesText}
                    onChange={(e) => setNewCatData({ ...newCatData, subcategoriesText: e.target.value })}
                    className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewCategoryModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold bg-[#315B3D] text-white rounded-xl hover:bg-[#25462e] cursor-pointer"
                  >
                    Salvar Categoria
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {editingCategory && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-start sm:items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-xl my-auto max-h-[88dvh] overflow-y-auto">
              <h4 className="font-bold text-gray-900 text-sm">Editar Categoria e Atividades</h4>
              <form onSubmit={handleSaveCategoryEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Nome da Categoria *</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Descrição curta</label>
                  <input
                    type="text"
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Ícone</label>
                  <select
                    value={editingCategory.icon || 'Store'}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                  >
                    <option value="Store">Loja / Comércio (Store)</option>
                    <option value="Utensils">Alimentação (Utensils)</option>
                    <option value="Cake">Doces e Bolos (Cake)</option>
                    <option value="Pizza">Pizzaria (Pizza)</option>
                    <option value="Waves">Piscinas (Waves)</option>
                    <option value="Trees">Jardinagem (Trees)</option>
                    <option value="Car">Automotivo (Car)</option>
                    <option value="Scissors">Beleza / Barbeiro (Scissors)</option>
                    <option value="Hammer">Construção (Hammer)</option>
                    <option value="Wrench">Elétrica / Hidráulica (Wrench)</option>
                    <option value="Sparkles">Estética / Limpeza (Sparkles)</option>
                    <option value="Dog">Pets (Dog)</option>
                    <option value="Dumbbell">Esportes e Aulas (Dumbbell)</option>
                    <option value="Navigation">Transporte (Navigation)</option>
                    <option value="Package">Locação de Equipamentos (Package)</option>
                    <option value="Briefcase">Outros Serviços (Briefcase)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Atividades / Subcategorias (separadas por vírgula)</label>
                  <textarea
                    rows={3}
                    value={editCatSubText}
                    onChange={(e) => setEditCatSubText(e.target.value)}
                    placeholder="Ex: Barbeiro, Manicure e pedicure, Estética"
                    className="w-full p-2.5 text-base sm:text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.active}
                    onChange={(e) => setEditingCategory({ ...editingCategory, active: e.target.checked })}
                    className="rounded border-gray-300 text-[#315B3D]"
                  />
                  <span className="font-semibold text-gray-700">Exibir categoria no catálogo público</span>
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold bg-[#315B3D] text-white rounded-xl hover:bg-[#25462e] cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-App Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    {confirmDelete.type === 'business' ? 'Excluir Cadastro' : 'Excluir Categoria'}
                  </h4>
                  <p className="text-xs text-gray-500">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                Tem certeza que deseja excluir permanentemente{' '}
                <strong className="text-gray-900">"{confirmDelete.name}"</strong>?
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    confirmDelete.type === 'business'
                      ? handleDeleteBusinessConfirm(confirmDelete.id)
                      : handleDeleteCategoryConfirm(confirmDelete.id)
                  }
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm cursor-pointer"
                >
                  Sim, excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
