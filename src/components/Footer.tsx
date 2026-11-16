import React from 'react';
import { MapPin, Heart, Shield, ArrowUp } from 'lucide-react';
import { SITE_CONFIG } from '../config/site.ts';

interface FooterProps {
  onScrollToTop: () => void;
  onOpenRegister: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onScrollToTop,
  onOpenRegister,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-[#1F3325] text-white pt-16 pb-10 border-t border-[#315B3D]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8DBF91] flex items-center justify-center text-[#1F3325] font-extrabold shadow-md">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3 7v9c0 5 9 6 9 6s9-1 9-6V7l-9-5z" />
                  <path d="M12 7v10" />
                  <path d="M9 10l3-3 3 3" />
                  <path d="M9 14l3-3 3 3" />
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                GUIA COMERCIAL <span className="text-[#8DBF91]">NINHO VERDE II</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-md">
              A lista telefônica e comercial digital dos moradores e prestadores do Ninho Verde II. Encontre rapidamente profissionais recomendados, serviços domésticos, delícias caseiras e manutenções direto pelo WhatsApp.
            </p>

            <div className="space-y-1.5 text-xs text-[#8DBF91]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Rod. Pres. Castello Branco (SP-280), km 196, Pardinho - SP • CEP 18640-000</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                <span>Canal de Apoio & Moderação: </span>
                <a
                  href={`https://wa.me/${SITE_CONFIG.supportPhone}?text=${encodeURIComponent('Olá! Gostaria de falar com o canal de apoio do Guia Comercial Ninho Verde II.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white hover:underline hover:text-[#8DBF91]"
                >
                  {SITE_CONFIG.supportPhoneDisplay} (WhatsApp)
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#8DBF91]">
              Navegação Rápida
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li>
                <a href="#hero" className="hover:text-white transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="#catalog" className="hover:text-white transition-colors">
                  Catálogo de Negócios
                </a>
              </li>
              <li>
                <a href="#categories" className="hover:text-white transition-colors">
                  Todas as Categorias
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Dúvidas Frequentes (FAQ)
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Fale Conosco
                </a>
              </li>
            </ul>
          </div>

          {/* Community & Admin */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#8DBF91]">
              Empreendedores
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li>
                <button
                  onClick={onOpenRegister}
                  className="text-left text-[#8DBF91] hover:underline font-semibold"
                >
                  Cadastrar meu negócio
                </button>
              </li>
              <li>
                <span className="text-gray-400 text-xs">
                  Verificação e aprovação obrigatória de moradores
                </span>
              </li>
              <li className="pt-2">
                <button
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white py-1 px-2.5 rounded-lg bg-white/5 border border-white/10"
                >
                  <Shield className="w-3.5 h-3.5 text-[#8DBF91]" />
                  Acesso Administrativo
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p className="max-w-2xl text-[11px] leading-relaxed text-gray-400">
            Aviso: O Guia Comercial Ninho Verde II é uma iniciativa comunitária independente criada para conectar vizinhos e prestadores de serviços do residencial. Não possui vínculo administrativo direto com a administração do loteamento ou com a loteadora.
          </p>

          <button
            onClick={onScrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <ArrowUp className="w-3.5 h-3.5" /> Voltar ao topo
          </button>
        </div>
      </div>
    </footer>
  );
};
