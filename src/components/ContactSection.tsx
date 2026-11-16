import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
} from 'lucide-react';
import { SITE_CONFIG } from '../config/site.ts';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-3xl border border-[#E2EBE2] shadow-xl shadow-[#315B3D]/5 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Left: Info Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#315B3D] via-[#25462e] to-[#1a3321] text-white p-6 sm:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#8DBF91] text-xs font-bold border border-white/10">
                <Building2 className="w-3.5 h-3.5" />
                Localização & Suporte
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Fale com a Moderação do Guia
              </h3>

              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Tem dúvidas sobre como cadastrar seu negócio, quer sugerir uma nova categoria ou reportar alguma informação incorreta? Envie sua mensagem para nossa equipe.
              </p>

              <div className="space-y-4 pt-4 border-t border-white/10 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#8DBF91] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white font-semibold">Endereço Residencial</strong>
                    <span className="text-white/80 leading-relaxed block">
                      Rodovia Pres. Castello Branco (SP-280), km 196
                      <br />
                      Pardinho - SP, CEP 18640-000
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#8DBF91] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white font-semibold">Canal de Apoio & WhatsApp</strong>
                    <a
                      href={`https://wa.me/${SITE_CONFIG.supportPhone}?text=${encodeURIComponent('Olá! Gostaria de falar com a moderação do Guia Comercial Ninho Verde II.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8DBF91] hover:text-white font-bold text-sm inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>{SITE_CONFIG.supportPhoneDisplay}</span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-semibold text-white">Chamar no WhatsApp</span>
                    </a>
                    <span className="text-white/70 text-xs block mt-0.5">Atendimento e canal direto para moderação</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#8DBF91] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white font-semibold">Horário de Análise</strong>
                    <span className="text-white/80">Novos cadastros revisados diariamente</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 text-[11px] text-white/60">
              * Plataforma comunitária colaborativa para moradores do Ninho Verde II.
            </div>
          </div>

          {/* Right: Real Contact Form */}
          <div className="lg:col-span-3 p-6 sm:p-10 bg-white">
            <h4 className="text-xl font-bold text-[#1F3325] mb-1">Envie sua mensagem</h4>
            <p className="text-xs text-gray-500 mb-6">
              Preencha o formulário abaixo e entraremos em contato o mais breve possível.
            </p>

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-emerald-800 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Mensagem enviada com sucesso! Nossa moderação responderá em breve.
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-800 font-medium">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Seu nome completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Oliveira"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Seu e-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Telefone / WhatsApp (opcional)
                  </label>
                  <input
                    type="tel"
                    placeholder="(14) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Assunto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dúvida sobre cadastro ou alteração"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mensagem *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escreva sua mensagem com detalhes..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3.5 text-base sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8DBF91] focus:border-[#315B3D] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#315B3D] hover:bg-[#25462e] text-white px-7 py-3 rounded-xl font-bold text-sm shadow-md shadow-[#315B3D]/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#8DBF91]" />
                {loading ? 'Enviando...' : 'Enviar mensagem'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
