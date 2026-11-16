import React, { useState, useEffect } from 'react';
import { Category } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { SITE_CONFIG } from '../config/site.ts';
import {
  X,
  ShieldAlert,
  AlertCircle,
  Clock,
  Phone,
  Tag,
  User,
  Store,
  MessageCircle,
  ExternalLink,
  Layers,
  ListChecks,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
}

const CUSTOM_NICHE_VALUE = '__custom__';

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
}) => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    ownerName: user?.displayName || '',
    name: '',
    categoryId: categories[0]?.id ? String(categories[0].id) : '',
    subcategory: categories[0]?.subcategories?.[0] || '',
    customNiche: '',
    description: '',
    whatsapp: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [notifyAdminUrl, setNotifyAdminUrl] = useState<string>('');

  useEffect(() => {
    if (!formData.categoryId && categories.length > 0) {
      const firstCat = categories[0];
      setFormData((prev) => ({
        ...prev,
        categoryId: String(firstCat.id),
        subcategory: firstCat.subcategories?.[0] || '',
      }));
    }
  }, [categories, formData.categoryId]);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
    }
    setFormData((prev) => ({ ...prev, whatsapp: formatted }));
  };

  const selectedCat = categories.find((c) => String(c.id) === String(formData.categoryId));
  const categorySubs = selectedCat?.subcategories || [];
  const isOtherCategory =
    selectedCat?.slug === 'outros-servicos' ||
    selectedCat?.name.toLowerCase().includes('outro') ||
    categorySubs.length === 0;
  const needsCustomNiche = isOtherCategory || formData.subcategory === CUSTOM_NICHE_VALUE;

  const handleCategoryChange = (newCategoryId: string) => {
    const nextCat = categories.find((c) => String(c.id) === String(newCategoryId));
    const nextSubs = nextCat?.subcategories || [];
    const nextIsOther =
      nextCat?.slug === 'outros-servicos' ||
      nextCat?.name.toLowerCase().includes('outro') ||
      nextSubs.length === 0;

    setFormData((prev) => ({
      ...prev,
      categoryId: newCategoryId,
      subcategory: nextIsOther ? CUSTOM_NICHE_VALUE : nextSubs[0] || '',
      customNiche: nextIsOther ? prev.customNiche : '',
    }));
  };

  const handleSubcategoryChange = (newSub: string) => {
    setFormData((prev) => ({
      ...prev,
      subcategory: newSub,
      customNiche: newSub === CUSTOM_NICHE_VALUE ? prev.customNiche : '',
    }));
  };

  const handleClose = () => {
    if (submitted) {
      setSubmitted(false);
      const firstCat = categories[0];
      setFormData({
        ownerName: user?.displayName || '',
        name: '',
        categoryId: firstCat?.id ? String(firstCat.id) : '',
        subcategory: firstCat?.subcategories?.[0] || '',
        customNiche: '',
        description: '',
        whatsapp: '',
      });
    }
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = formData.whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Por favor, informe um número de WhatsApp válido com DDD (ex: 14 99999-9999).');
      return;
    }

    if (!formData.ownerName.trim() || !formData.name.trim() || !formData.description.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (needsCustomNiche && !formData.customNiche.trim()) {
      setError('Por favor, informe seu nicho ou atividade específica no campo destacado.');
      return;
    }

    setLoading(true);

    try {
      const resolvedSub = needsCustomNiche
        ? formData.customNiche.trim()
        : formData.subcategory.trim();

      const autoKeywordsParts = [
        selectedCat?.name,
        resolvedSub,
        selectedCat?.description,
      ].filter(Boolean);
      const autoKeywords = autoKeywordsParts.join(', ');

      const res = await fetch('/api/businesses/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ownerName: formData.ownerName,
          name: formData.name,
          categoryId: Number(formData.categoryId || categories[0]?.id),
          categoryName: selectedCat ? selectedCat.name : 'Geral',
          subcategory: resolvedSub,
          customNiche: needsCustomNiche ? formData.customNiche.trim() : '',
          description: formData.description,
          whatsapp: cleanPhone,
          keywords: autoKeywords,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar solicitação');
      }

      const categoryLabel = resolvedSub
        ? `${selectedCat?.name || 'Serviços'} • ${resolvedSub}`
        : selectedCat?.name || 'Serviços';

      const fallbackMsg = `Olá! Acabei de enviar uma solicitação de cadastro no Guia Comercial Ninho Verde II:\n\n*Nome do Negócio:* ${formData.name}\n*Responsável:* ${formData.ownerName}\n*Categoria:* ${categoryLabel}\n*WhatsApp:* ${cleanPhone}\n\nFavor analisar para aprovação no catálogo. Obrigado!`;
      const waUrl =
        data.notifyAdminUrl ||
        `https://wa.me/${SITE_CONFIG.supportPhone}?text=${encodeURIComponent(fallbackMsg)}`;
      setNotifyAdminUrl(waUrl);

      setSubmitted(true);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao registrar negócio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 my-auto max-h-[92dvh] overflow-y-auto relative">
        <button
          onClick={handleClose}
          aria-label="Fechar"
          className="sticky sm:absolute top-0 sm:top-5 right-0 sm:right-5 float-right sm:float-none p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 bg-white/90 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#EAF4E9] text-[#315B3D] flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-[#315B3D] animate-pulse" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-[#1F3325]">
                Solicitação Registrada com Sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Seu cadastro está registrado e aguardando verificação da administração.
              </p>
            </div>

            {/* Direct WhatsApp button to notify admin on support phone */}
            <div className="bg-gradient-to-br from-[#EAF4E9] to-[#d8ebd6] border-2 border-[#8DBF91] rounded-2xl p-5 text-left space-y-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1F3325]">
                    Agilize sua aprovação pelo WhatsApp
                  </h4>
                  <p className="text-xs text-gray-600">
                    Envie a notificação diretamente ao administrador no canal de apoio:
                    <strong className="text-[#315B3D] ml-1">{SITE_CONFIG.supportPhoneDisplay}</strong>
                  </p>
                </div>
              </div>

              <a
                href={notifyAdminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md shadow-[#25D366]/30 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Enviar Solicitação ao Administrador no WhatsApp</span>
                <ExternalLink className="w-4 h-4 opacity-75" />
              </a>

              <p className="text-[11px] text-gray-500 text-center">
                Uma mensagem com todos os dados preenchidos será enviada ao administrador para agilizar sua análise.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Fechar janela
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF4E9] text-[#315B3D] text-xs font-bold mb-2">
                <Store className="w-3.5 h-3.5" />
                Etapa 1 — Solicitação de Cadastro
              </div>
              <h2 className="text-2xl font-extrabold text-[#1F3325]">
                Cadastrar meu negócio ou serviço
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Para moradores, autônomos e empreendedores de todos os segmentos no Ninho Verde II.
              </p>
            </div>

            {/* Mandatory Verification Notice with support phone */}
            <div className="mb-6 p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-start gap-3 text-xs text-gray-600">
              <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-800">Verificação obrigatória:</strong> Nenhum negócio é publicado automaticamente. O administrador analisa cada cadastro pelo canal de apoio{' '}
                <strong className="text-[#315B3D]">{SITE_CONFIG.supportPhoneDisplay}</strong> antes de liberar a exibição no catálogo.
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Owner Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nome completo do responsável *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Silva"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nome do negócio *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Piscinas & Tratamento"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Categorization Section: Main Category + Subcategory */}
              <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-[#E2EBE2] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Main Category */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Categoria de atuação *
                    </label>
                    <div className="relative">
                      <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <select
                        value={formData.categoryId}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Specific Subcategory / Activity */}
                  {!isOtherCategory && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Atividade específica *
                      </label>
                      <div className="relative">
                        <ListChecks className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <select
                          value={formData.subcategory}
                          onChange={(e) => handleSubcategoryChange(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none cursor-pointer"
                        >
                          {categorySubs.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                          <option value={CUSTOM_NICHE_VALUE}>
                            Não encontrei minha atividade (informar nicho)
                          </option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[11px] text-gray-500 block">
                  A categoria e a atividade selecionadas já funcionam automaticamente como palavras-chave na busca dos moradores.
                </span>

                {/* CUSTOM NICHE FIELD: Visible when "Outros serviços" or "Não encontrei minha atividade" is chosen */}
                {needsCustomNiche && (
                  <div className="p-3.5 rounded-xl border bg-amber-50/90 border-amber-300 ring-2 ring-amber-200/70 transition-all">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Layers className="w-4 h-4 text-[#315B3D]" />
                      <label className="text-xs font-bold text-[#1F3325]">
                        Especifique seu nicho ou tipo exato de serviço *
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Consultoria em energia solar, Afinador de piano, Locação de tendas..."
                      value={formData.customNiche}
                      onChange={(e) => setFormData({ ...formData, customNiche: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none"
                    />
                    <p className="text-[11px] text-gray-600 mt-1">
                      Seu nicho específico aparecerá no anúncio e será encontrado instantaneamente na pesquisa.
                    </p>
                  </div>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  WhatsApp com DDD *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="(14) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    maxLength={15}
                    className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Número que os vizinhos usarão para falar direto com você.
                </span>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Descrição do produto ou serviço oferecido *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Atendimento no residencial com horário agendado. Limpeza, manutenção, orçamento sem compromisso."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 text-base sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 bg-[#315B3D] hover:bg-[#25462e] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-[#315B3D]/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Enviando solicitação...' : 'Enviar para aprovação'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
