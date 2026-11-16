import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Sparkles, MessageCircle, HeartHandshake } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  icon?: React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    question: 'O que é o Guia Comercial Ninho Verde II?',
    answer:
      'É um catálogo digital exclusivo desenvolvido para centralizar todos os negócios, pequenos empreendedores, autônomos e prestadores de serviços que atuam dentro do loteamento Ninho Verde II em Pardinho - SP. Funciona como uma lista telefônica digital moderna e prática.',
  },
  {
    question: 'Por que o cadastro do meu negócio não entra no ar na hora?',
    answer:
      'Para a total segurança e tranquilidade dos moradores do residencial, todo novo cadastro passa obrigatoriamente por uma verificação administrativa manual antes de ser publicado. Isso garante a idoneidade das informações e confirma o vínculo com a comunidade.',
  },
  {
    question: 'Existe algum custo para cadastrar ou anunciar meu serviço?',
    answer:
      'Não! A plataforma é 100% gratuita para todos os moradores e empreendedores locais divulgarem suas atividades comerciais.',
  },
  {
    question: 'Como os clientes entram em contato comigo?',
    answer:
      'O morador clica no botão "Entrar em contato pelo WhatsApp" no card do seu negócio e é direcionado instantaneamente para uma conversa direta no seu aplicativo de WhatsApp com uma mensagem inicial preenchida.',
  },
  {
    question: 'O guia é administrado pela Momentum ou pela administração do condomínio?',
    answer:
      'Não. O Guia Comercial Ninho Verde II é uma iniciativa comunitária independente criada por e para os moradores, com o objetivo de apoiar a economia local e facilitar o dia a dia de quem vive ou frequenta o residencial.',
  },
  {
    question: 'Posso atualizar meus dados ou telefone depois de cadastrado?',
    answer:
      'Sim. Caso precise alterar seu telefone, descrição ou categoria, basta solicitar a alteração ou contatar a moderação através do formulário de contato do site.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF4E9] text-[#315B3D] text-xs font-bold">
          <HelpCircle className="w-3.5 h-3.5" />
          Perguntas Frequentes
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F3325] tracking-tight">
          Como funciona o Guia Comercial?
        </h2>
        <p className="text-sm text-gray-500 max-w-xl mx-auto">
          Tire suas dúvidas sobre o funcionamento, regras de verificação e conexão direta via WhatsApp.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-white border-[#8DBF91] shadow-md shadow-[#315B3D]/5'
                  : 'bg-white/80 border-[#E2EBE2] hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="font-bold text-sm sm:text-base text-[#1F3325]">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#315B3D]' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
