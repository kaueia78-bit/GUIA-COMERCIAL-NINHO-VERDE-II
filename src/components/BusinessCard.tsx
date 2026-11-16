import React from 'react';
import { Business } from '../types/index.ts';
import { formatWhatsAppDisplay, buildWhatsAppLink } from '../utils/whatsapp.ts';
import { UserCheck, Tag, Phone, ExternalLink } from 'lucide-react';

interface BusinessCardProps {
  business: Business;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
  const formattedPhone = formatWhatsAppDisplay(business.whatsapp);
  const waLink = buildWhatsAppLink(business.whatsapp, business.name);

  // Extract keywords into little chips if present
  const keywordTags = business.keywords
    ? business.keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k && k.toLowerCase() !== business.categoryName.toLowerCase())
        .slice(0, 3)
    : [];

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E2EBE2] hover:border-[#8DBF91] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Header: Category Badge & Verified Mark */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF4E9] text-[#315B3D] border border-[#8DBF91]/40">
              <Tag className="w-3 h-3 text-[#14b8a6]" />
              {business.categoryName}
            </span>
            {business.subcategory && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold bg-[#F2F7F2] text-[#2B4C35] border border-[#D5E4D6]">
                {business.subcategory}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
            <UserCheck className="w-3 h-3" />
            Verificado
          </span>
        </div>

        {/* Business Name & Owner */}
        <h3 className="text-lg font-bold text-[#1F3325] group-hover:text-[#315B3D] transition-colors leading-snug">
          {business.name}
        </h3>
        <p className="text-xs text-gray-500 font-medium mb-3">
          Responsável: <span className="text-gray-700">{business.ownerName}</span>
        </p>

        {/* Short Description */}
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
          {business.description}
        </p>

        {/* Keyword tags */}
        {keywordTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {keywordTags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer & Direct WhatsApp CTA */}
      <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1 text-gray-600 font-medium">
            <Phone className="w-3.5 h-3.5 text-[#315B3D]" />
            {formattedPhone}
          </span>
          <span className="text-[11px] text-gray-400">Pardinho - SP</span>
        </div>

        {/* Direct WhatsApp Button */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md shadow-[#25D366]/20 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          {/* WhatsApp Icon */}
          <svg
            className="w-4 h-4 fill-current shrink-0"
            viewBox="0 0 24 24"
          >
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.54 1.961.82 2.8.82 3.182 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.772-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-1.109-.06-.251-.08-.577-.197-1.025-.39-1.899-.817-3.136-2.735-3.23-2.861-.095-.125-.769-1.021-.769-1.948 0-.927.487-1.383.66-1.572.174-.189.38-.236.507-.236.126 0 .253.001.364.006.118.006.275-.045.43.328.16.386.544 1.328.592 1.425.047.098.079.213.016.339-.063.125-.095.204-.189.314-.095.11-.199.246-.284.331-.095.094-.194.197-.083.388.11.19.49 1.425 1.547 2.012.802.447 1.478.587 1.688.692.21.105.332.093.456-.048.127-.142.538-.63.681-.847.143-.217.285-.18.475-.11.19.071 1.203.568 1.409.671.206.103.344.154.394.241.05.087.05.505-.094.91z" />
          </svg>
          <span>Entrar em contato pelo WhatsApp</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>
    </div>
  );
};
