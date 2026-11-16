import React from 'react';
import { Business } from '../types/index.ts';
import { BusinessCard } from './BusinessCard.tsx';
import { SearchX, PlusCircle, RefreshCw } from 'lucide-react';

interface BusinessListProps {
  businesses: Business[];
  loading: boolean;
  searchTerm: string;
  selectedCategoryName?: string | null;
  selectedSubcategory?: string | null;
  onClearFilters: () => void;
  onOpenRegister: () => void;
}

export const BusinessList: React.FC<BusinessListProps> = ({
  businesses,
  loading,
  searchTerm,
  selectedCategoryName,
  selectedSubcategory,
  onClearFilters,
  onOpenRegister,
}) => {
  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Filter Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200/80 gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1F3325] tracking-tight flex items-center gap-2.5">
            Negócios e Serviços no Residencial
            <span className="text-xs font-bold bg-[#EAF4E9] text-[#315B3D] px-2.5 py-1 rounded-full border border-[#8DBF91]/50">
              {businesses.length} {businesses.length === 1 ? 'disponível' : 'disponíveis'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {selectedCategoryName
              ? `Filtrando por: ${selectedCategoryName}${selectedSubcategory ? ` › ${selectedSubcategory}` : ''}`
              : searchTerm
              ? `Resultados correspondentes a: "${searchTerm}"`
              : 'Lista telefônica e comercial digital dos moradores do Ninho Verde II'}
          </p>
        </div>

        {(searchTerm || selectedCategoryName || selectedSubcategory) && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315B3D] hover:text-[#25462e] bg-[#EAF4E9] hover:bg-[#d9ecd8] px-3 py-1.5 rounded-lg border border-[#8DBF91]/50 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpar busca e filtros
          </button>
        )}
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex justify-between">
                <div className="w-24 h-5 bg-gray-200 rounded-full" />
                <div className="w-20 h-5 bg-gray-100 rounded" />
              </div>
              <div className="w-3/4 h-6 bg-gray-200 rounded" />
              <div className="w-1/2 h-4 bg-gray-100 rounded" />
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-100 rounded" />
                <div className="w-5/6 h-3 bg-gray-100 rounded" />
              </div>
              <div className="w-full h-11 bg-gray-200 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : businesses.length > 0 ? (
        /* Results Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#E2EBE2] shadow-xs max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-[#EAF4E9] text-[#315B3D] flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-8 h-8 text-[#315B3D]" />
          </div>
          <h3 className="text-xl font-bold text-[#1F3325] mb-2">
            Não encontramos negócios para essa pesquisa.
          </h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Experimente outra palavra, limpe os termos de busca ou navegue pelas categorias acima. Você é morador e oferece este serviço?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onClearFilters}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Ver todos os negócios
            </button>
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#315B3D] hover:bg-[#25462e] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#8DBF91]" />
              Cadastrar este negócio
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
