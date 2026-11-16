import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectSuggestion: (value: string) => void;
  totalResults: number;
}

const POPULAR_SUGGESTIONS = [
  'Piscineiro',
  'Barbeiro',
  'Manicure',
  'Pedreiro',
  'Eletricista',
  'Diarista',
  'Lava-jato',
  'Professor de tênis',
  'Caçambas',
  'Jardinagem',
  'Pets',
  'Pizzaria',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSelectSuggestion,
  totalResults,
}) => {
  return (
    <div className="relative z-20 w-full max-w-4xl mx-auto -mt-8 px-4">
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-[#315B3D]/10 border border-[#D5E4D6] transition-all focus-within:ring-3 focus-within:ring-[#8DBF91]/50 focus-within:border-[#315B3D]">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-gray-400 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[#315B3D]" />
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquise por produtos, negócios ou serviços..."
            className="w-full pl-11 pr-10 py-3 text-base sm:text-lg text-gray-800 placeholder-gray-400 bg-transparent rounded-xl focus:outline-none"
          />

          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 font-semibold flex items-center gap-1 shrink-0 px-1">
            <Sparkles className="w-3.5 h-3.5 text-[#14b8a6]" />
            Populares:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {POPULAR_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                onClick={() => onSelectSuggestion(sug)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  searchTerm.toLowerCase() === sug.toLowerCase()
                    ? 'bg-[#315B3D] text-white font-bold'
                    : 'bg-[#F2F7F2] text-gray-600 hover:bg-[#EAF4E9] hover:text-[#315B3D]'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result feedback indicator if filtered */}
      {searchTerm && (
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 px-2">
          <span>
            Buscando por: <strong className="text-[#315B3D]">"{searchTerm}"</strong>
          </span>
          <span>
            {totalResults} {totalResults === 1 ? 'negócio encontrado' : 'negócios encontrados'}
          </span>
        </div>
      )}
    </div>
  );
};
