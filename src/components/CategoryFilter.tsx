import React from 'react';
import { Category } from '../types/index.ts';
import { getCategoryIcon } from '../utils/categoryIcons.tsx';
import { LayoutGrid, ChevronRight } from 'lucide-react';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  onSelectSubcategory: (sub: string | null) => void;
  loading?: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
  loading = false,
}) => {
  const activeCategoryObj = categories.find((c) => c.slug === selectedCategory);
  const activeSubcategories = activeCategoryObj?.subcategories || [];

  return (
    <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1F3325] tracking-tight">
            Categorias em Destaque
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Selecione um setor para explorar ou filtrar atividades específicas
          </p>
        </div>

        {(selectedCategory || selectedSubcategory) && (
          <button
            onClick={() => {
              onSelectCategory(null);
              onSelectSubcategory(null);
            }}
            className="text-xs font-bold text-[#315B3D] hover:underline self-start sm:self-auto cursor-pointer flex items-center gap-1"
          >
            Limpar filtro de categoria (Ver todas)
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* All categories card */}
            <button
              onClick={() => {
                onSelectCategory(null);
                onSelectSubcategory(null);
              }}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-24 cursor-pointer group ${
                selectedCategory === null
                  ? 'bg-[#315B3D] border-[#315B3D] text-white shadow-md shadow-[#315B3D]/20 ring-2 ring-[#315B3D]/30'
                  : 'bg-white border-[#E2EBE2] text-gray-700 hover:border-[#8DBF91] hover:bg-[#F8FAF8]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedCategory === null
                    ? 'bg-white/20 text-white'
                    : 'bg-[#EAF4E9] text-[#315B3D] group-hover:scale-105 transition-transform'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm block truncate">Todas</span>
                <span
                  className={`text-[10px] block ${
                    selectedCategory === null ? 'text-white/80' : 'text-gray-400'
                  }`}
                >
                  Ver catálogo todo
                </span>
              </div>
            </button>

            {/* Main Categories */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    const nextSlug = isSelected ? null : cat.slug;
                    onSelectCategory(nextSlug);
                    onSelectSubcategory(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-24 cursor-pointer group ${
                    isSelected
                      ? 'bg-[#315B3D] border-[#315B3D] text-white shadow-md shadow-[#315B3D]/20 ring-2 ring-[#315B3D]/30'
                      : 'bg-white border-[#E2EBE2] text-gray-700 hover:border-[#8DBF91] hover:bg-[#F8FAF8]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#EAF4E9] text-[#315B3D] group-hover:scale-105 transition-transform'
                    }`}
                  >
                    {getCategoryIcon(cat.icon, { className: 'w-4 h-4' })}
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm block truncate" title={cat.name}>
                      {cat.name}
                    </span>
                    <span
                      className={`text-[10px] block truncate ${
                        isSelected ? 'text-white/80' : 'text-gray-400'
                      }`}
                    >
                      {cat.description || 'Moradores'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Subcategories Refinement Strip (appears cleanly only when a main category is chosen) */}
          {activeCategoryObj && activeSubcategories.length > 0 && (
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#D5E4D6] shadow-2xs flex flex-col sm:flex-row sm:items-center gap-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#315B3D] shrink-0">
                {getCategoryIcon(activeCategoryObj.icon, { className: 'w-3.5 h-3.5 text-[#14b8a6]' })}
                <span>Atividades em {activeCategoryObj.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => onSelectSubcategory(null)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSubcategory === null
                      ? 'bg-[#315B3D] text-white'
                      : 'bg-[#F2F7F2] text-gray-600 hover:bg-[#EAF4E9] hover:text-[#315B3D]'
                  }`}
                >
                  Todas
                </button>
                {activeSubcategories.map((sub) => {
                  const isSubActive = selectedSubcategory === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => onSelectSubcategory(isSubActive ? null : sub)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isSubActive
                          ? 'bg-[#14b8a6] text-white shadow-xs'
                          : 'bg-[#F2F7F2] text-gray-700 hover:bg-[#EAF4E9] hover:text-[#315B3D]'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
