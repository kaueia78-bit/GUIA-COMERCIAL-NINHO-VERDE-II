import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import {
  Compass,
  PlusCircle,
  ShieldCheck,
  LogOut,
  LogIn,
  Menu,
  X,
  Store,
  PhoneCall,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  onOpenRegister: () => void;
  onOpenAdmin: () => void;
  onScrollTo: (id: string) => void;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRegister,
  onOpenAdmin,
  onScrollTo,
  pendingCount = 0,
}) => {
  const { user, role, loginWithGoogle, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2EBE2] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Brand */}
          <div
            onClick={() => onScrollTo('hero')}
            className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group min-w-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#315B3D] to-[#1F3E28] flex items-center justify-center text-white shadow-md shadow-[#315B3D]/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              {/* Nature & Nest Leaf SVG representation */}
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#8DBF91]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v9c0 5 9 6 9 6s9-1 9-6V7l-9-5z" />
                <path d="M12 7v10" />
                <path d="M9 10l3-3 3 3" />
                <path d="M9 14l3-3 3 3" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-[#1F3325] truncate">
                  NINHO VERDE <span className="text-[#315B3D]">II</span>
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider bg-[#EAF4E9] text-[#315B3D] px-2 py-0.5 rounded-full border border-[#8DBF91]/40 shrink-0">
                  Guia Oficial
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                Catálogo Comercial dos Moradores
              </p>
            </div>
          </div>

          {/* Desktop Nav Links (lg+ avoids crowding on 768px tablets) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            <button
              onClick={() => onScrollTo('catalog')}
              className="text-sm font-semibold text-gray-700 hover:text-[#315B3D] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Store className="w-4 h-4 text-[#8DBF91]" />
              Catálogo
            </button>
            <button
              onClick={() => onScrollTo('categories')}
              className="text-sm font-semibold text-gray-700 hover:text-[#315B3D] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#8DBF91]" />
              Categorias
            </button>
            <button
              onClick={() => onScrollTo('faq')}
              className="text-sm font-semibold text-gray-700 hover:text-[#315B3D] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#8DBF91]" />
              Como Funciona
            </button>
            <button
              onClick={() => onScrollTo('contact')}
              className="text-sm font-semibold text-gray-700 hover:text-[#315B3D] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-[#8DBF91]" />
              Contato
            </button>
          </nav>

          {/* Desktop CTA & Admin Actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* Register Business CTA */}
            <button
              onClick={onOpenRegister}
              className="inline-flex items-center gap-2 bg-[#315B3D] hover:bg-[#25462e] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-[#315B3D]/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-[#8DBF91]" />
              Cadastrar meu negócio
            </button>

            {/* Always accessible Painel Admin button with password entry */}
            <button
              onClick={onOpenAdmin}
              className={`relative inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-sm border transition-all cursor-pointer whitespace-nowrap ${
                role === 'admin'
                  ? 'bg-[#EAF4E9] hover:bg-[#d9ecd8] text-[#315B3D] border-[#8DBF91]'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
              title="Acessar Painel Administrativo"
            >
              <ShieldCheck className={`w-4 h-4 ${role === 'admin' ? 'text-[#315B3D]' : 'text-gray-500'}`} />
              <span>Painel Admin</span>
              {pendingCount > 0 && (
                <span className="w-5 h-5 bg-amber-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <span className="text-xs text-gray-600 font-medium truncate max-w-[120px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile & Tablet Actions (< lg) */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <button
              onClick={onOpenRegister}
              className="inline-flex items-center gap-1.5 bg-[#315B3D] hover:bg-[#25462e] text-white px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Cadastrar negócio"
            >
              <PlusCircle className="w-4 h-4 text-[#8DBF91]" />
              <span className="hidden sm:inline">Cadastrar negócio</span>
              <span className="sm:hidden">Cadastrar</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menu"
              className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              {pendingCount > 0 && !mobileMenuOpen && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E2EBE2] px-4 pt-3 pb-6 space-y-2 shadow-lg max-h-[calc(100dvh-4rem)] overflow-y-auto">
          <button
            onClick={() => {
              onScrollTo('catalog');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 text-base font-medium text-gray-800 hover:bg-[#EAF4E9] rounded-xl flex items-center gap-2.5 cursor-pointer"
          >
            <Store className="w-4 h-4 text-[#315B3D]" />
            Ver Catálogo de Negócios
          </button>
          <button
            onClick={() => {
              onScrollTo('categories');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 text-base font-medium text-gray-800 hover:bg-[#EAF4E9] rounded-xl flex items-center gap-2.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#315B3D]" />
            Categorias
          </button>
          <button
            onClick={() => {
              onScrollTo('faq');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 text-base font-medium text-gray-800 hover:bg-[#EAF4E9] rounded-xl flex items-center gap-2.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#315B3D]" />
            Dúvidas e Regras
          </button>
          <button
            onClick={() => {
              onScrollTo('contact');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 text-base font-medium text-gray-800 hover:bg-[#EAF4E9] rounded-xl flex items-center gap-2.5 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-[#315B3D]" />
            Contato e Localização
          </button>

          <div className="pt-3 border-t border-gray-100 space-y-2.5">
            <button
              onClick={() => {
                onOpenRegister();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#315B3D] text-white py-3 rounded-xl font-bold shadow-md cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-[#8DBF91]" />
              Cadastrar meu negócio
            </button>

            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#EAF4E9] text-[#315B3D] py-2.5 rounded-xl font-bold border border-[#8DBF91] cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-[#315B3D]" />
              Painel Administrativo {pendingCount > 0 && `(${pendingCount} pendentes)`}
            </button>

            {user && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-600 font-medium truncate max-w-[200px]">
                  {user.email || user.displayName}
                </span>
                <button
                  onClick={logout}
                  className="text-xs text-red-600 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
