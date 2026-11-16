import React from 'react';
import {
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import condominioBg from '../assets/images/ninho_verde_condominio_1794828631509.jpg';

interface HeroProps {
  onExplore: () => void;
  onRegister: () => void;
  approvedCount: number;
}

export const Hero: React.FC<HeroProps> = ({ approvedCount }) => {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-10 pb-20 sm:pt-14 sm:pb-24 bg-[#EAF4E9] border-b border-[#E7EFE7]"
    >
      {/* Condominium background image clearly visible on the main cover */}
      <img
        src={condominioBg}
        alt="Vista panorâmica do residencial Ninho Verde II em meio à natureza"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-85 pointer-events-none select-none"
      />

      {/* Light translucent gradient to blend smoothly into the page below */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/25 to-[#F8FAF8] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-5 bg-white/70 backdrop-blur-sm rounded-3xl px-5 py-7 sm:px-10 sm:py-10 border border-white/80 shadow-xl shadow-[#1F3325]/10">
          {/* Residential Community Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#8DBF91]/60 shadow-xs text-xs font-bold text-[#315B3D]">
            <MapPin className="w-3.5 h-3.5 text-[#14b8a6]" />
            <span>Pardinho - SP • Rodovia Castello Branco km 196</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8DBF91]" />
            <span className="text-gray-500 font-medium">Loteamento Fechado</span>
          </div>

          {/* Main Title & Purpose */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1F3325] tracking-tight leading-tight">
            Encontre o que você procura, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#315B3D] via-[#0d9488] to-[#315B3D] bg-clip-text text-transparent">
              dentro do Ninho Verde II.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#1F3325]/90 font-medium leading-relaxed max-w-2xl mx-auto">
            Um espaço para descobrir os negócios e serviços oferecidos pelos moradores do nosso residencial. Conecte-se direto no WhatsApp, sem intermediários.
          </p>

          {/* 3 Step Flow Indicator */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs sm:text-sm font-semibold text-gray-700">
            <div className="flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-xl border border-gray-200/90 shadow-xs">
              <span className="w-5 h-5 rounded-full bg-[#EAF4E9] text-[#315B3D] flex items-center justify-center font-bold text-xs">
                1
              </span>
              <span>Pesquisar</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#315B3D] hidden sm:block" />
            <div className="flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-xl border border-gray-200/90 shadow-xs">
              <span className="w-5 h-5 rounded-full bg-[#EAF4E9] text-[#315B3D] flex items-center justify-center font-bold text-xs">
                2
              </span>
              <span>Encontrar</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#315B3D] hidden sm:block" />
            <div className="flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-xl border border-[#8DBF91]/70 text-[#315B3D] shadow-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-[#315B3D] text-white flex items-center justify-center font-bold text-xs">
                3
              </span>
              <span>WhatsApp Direto</span>
            </div>
          </div>

          {/* Trust points */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-[#315B3D]">
            <span className="inline-flex items-center gap-1.5 bg-white/85 px-3 py-1 rounded-full border border-[#8DBF91]/40">
              <ShieldCheck className="w-4 h-4 text-[#315B3D]" />
              Verificação e aprovação obrigatória de moradores
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/85 px-3 py-1 rounded-full border border-[#8DBF91]/40">
              <CheckCircle2 className="w-4 h-4 text-[#14b8a6]" />
              {approvedCount > 0 ? `${approvedCount} negócios ativos no catálogo` : 'Catálogo comunitário'}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/85 px-3 py-1 rounded-full border border-[#8DBF91]/40">
              <Sparkles className="w-4 h-4 text-amber-500" />
              100% gratuito para divulgação
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
