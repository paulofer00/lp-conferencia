"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, ChevronDown, CheckCircle, Ticket } from 'lucide-react';
import Image from 'next/image';

export default function ConferênciaVouLP() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Estados da barra de progresso
  const [progress, setProgress] = useState(40);

  // --- NOVOS ESTADOS DO MODAL DE CHECKOUT ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [currentParticipant, setCurrentParticipant] = useState(0);
  const [participants, setParticipants] = useState([
    { name: '', email: '', phone: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const targetDate = new Date("2026-08-28T19:30:00-03:00").getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        setTimeLeft({
          days: days,
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });

        const calcProgress = 100 - (days * 0.6); 
        setProgress(Math.max(40, Math.min(100, calcProgress)));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- FUNÇÕES DO CHECKOUT ---
  const openCheckout = (ticketType: string) => {
    setSelectedTicket(ticketType);
    setCurrentParticipant(0);
    
    // Se for caravana, preparamos 3 espaços em branco. Se não, 1 espaço.
    if (ticketType === 'caravana') {
      setParticipants([
        { name: '', email: '', phone: '' },
        { name: '', email: '', phone: '' },
        { name: '', email: '', phone: '' }
      ]);
    } else {
      setParticipants([{ name: '', email: '', phone: '' }]);
    }
    setIsModalOpen(true);
  };

  const updateParticipant = (field: string, value: string) => {
    const newParticipants = [...participants];
    newParticipants[currentParticipant] = { ...newParticipants[currentParticipant], [field]: value };
    setParticipants(newParticipants);
  };

  const handleNextOrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se for caravana e não estivermos no último participante, apenas avança a tela
    if (selectedTicket === 'caravana' && currentParticipant < 2) {
      setCurrentParticipant(currentParticipant + 1);
      return;
    }

    // Se for ingresso normal OU já preencheu os 3 da caravana, envia para a API!
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants, ticketType: selectedTicket }) // Enviamos o array inteiro!
      });
      
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; 
      }
    } catch (error) {
      console.error("Erro ao gerar checkout", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden selection:bg-purple-600 selection:text-white relative">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-screen flex flex-col items-center justify-end pb-12 sm:pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/conferencia-vou-01.jpg" 
            alt="Conferência VOU - O Reino Avança" 
            fill
            priority
            className="object-cover object-center" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10">
          <button 
            onClick={() => document.getElementById('ingressos')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 sm:px-12 py-4 bg-white text-black font-black uppercase text-lg sm:text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Garantir Meu Ingresso
          </button>
        </div>
      </section>

      {/* 2. BARRAS DESLIZANTES EM "X" */}
      <section className="relative h-[150px] -mt-8 sm:-mt-12 z-20 flex items-center justify-center pointer-events-none">
        
        <div className="absolute w-[200vw] left-[-50vw] rotate-[-4deg] bg-white z-10 shadow-xl flex pointer-events-auto">
          <motion.div 
            className="flex whitespace-nowrap py-3 sm:py-4 text-black w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          >
            {Array(20).fill("CONFERÊNCIA VOU 👣 O REINO AVANÇA 🔥 ").map((text, i) => (
              <span key={i} className="text-3xl sm:text-4xl font-black px-4 uppercase">{text}</span>
            ))}
          </motion.div>
        </div>

        <div className="absolute w-[200vw] left-[-50vw] rotate-[4deg] bg-zinc-900 border-y border-white/20 z-20 shadow-2xl flex pointer-events-auto">
          <motion.div 
            className="flex whitespace-nowrap py-3 sm:py-4 text-white w-max"
            animate={{ x: ["-50%", "0%"] }} 
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          >
            {Array(20).fill("CONFERÊNCIA VOU 👣 O REINO AVANÇA 🔥 ").map((text, i) => (
              <span key={i} className="text-3xl sm:text-4xl font-black px-4 uppercase">{text}</span>
            ))}
          </motion.div>
        </div>

      </section>

      {/* 3. EXPLICAÇÃO DO "VOU" */}
      <section className="py-24 px-6 max-w-6xl mx-auto relative">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">O que é a Conferência VOU?</h2>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto font-medium text-lg">Nossa resposta ao IDE. Uma ativação de propósito dividida em três pilares fundamentais.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* VONTADE */}
          <div className="relative bg-[#0d0d0d] p-8 border-2 border-zinc-800 hover:border-zinc-500 hover:-translate-y-2 transition-all duration-300 shadow-[8px_8px_0px_rgba(39,39,42,0.5)]">
            <div className="absolute inset-0 opacity-20 bg-[url('/grunge.jpg')] bg-cover mix-blend-overlay pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-start text-left">
              <div className="flex items-baseline mb-6">
                <span className="text-[120px] leading-none font-black text-transparent bg-clip-text bg-[url('/grunge.jpg')] bg-cover bg-center filter drop-shadow-lg">
                  V
                </span>
                <span className="text-3xl font-black tracking-widest text-zinc-200 ml-1">ONTADE</span>
              </div>
              <p className="text-zinc-300 font-medium italic mb-6 text-lg leading-relaxed">
                "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens."
              </p>
              <p className="text-sm text-zinc-500 font-black uppercase tracking-widest">(Colossenses 3:23)</p>
            </div>
          </div>

          {/* OBEDIÊNCIA */}
          <div className="relative bg-[#0d0d0d] p-8 border-2 border-zinc-800 hover:border-zinc-500 hover:-translate-y-2 transition-all duration-300 shadow-[8px_8px_0px_rgba(39,39,42,0.5)]">
            <div className="absolute inset-0 opacity-20 bg-[url('/grunge.jpg')] bg-cover mix-blend-overlay pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-start text-left">
              <div className="flex items-baseline mb-6">
                <span className="text-[120px] leading-none font-black text-transparent bg-clip-text bg-[url('/grunge.jpg')] bg-cover bg-center filter drop-shadow-lg">
                  O
                </span>
                <span className="text-3xl font-black tracking-widest text-zinc-200 ml-1">BEDIÊNCIA</span>
              </div>
              <p className="text-zinc-300 font-medium italic mb-6 text-lg leading-relaxed">
                "Portanto, meus amados irmãos, sede firmes, constantes, sempre abundantes na obra do Senhor..."
              </p>
              <p className="text-sm text-zinc-500 font-black uppercase tracking-widest">(1 Coríntios 15:58)</p>
            </div>
          </div>

          {/* URGÊNCIA */}
          <div className="relative bg-[#0d0d0d] p-8 border-2 border-zinc-800 hover:border-zinc-500 hover:-translate-y-2 transition-all duration-300 shadow-[8px_8px_0px_rgba(39,39,42,0.5)]">
            <div className="absolute inset-0 opacity-20 bg-[url('/grunge.jpg')] bg-cover mix-blend-overlay pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-start text-left">
              <div className="flex items-baseline mb-6">
                <span className="text-[120px] leading-none font-black text-transparent bg-clip-text bg-[url('/grunge.jpg')] bg-cover bg-center filter drop-shadow-lg">
                  U
                </span>
                <span className="text-3xl font-black tracking-widest text-zinc-200 ml-1">RGÊNCIA</span>
              </div>
              <p className="text-zinc-300 font-medium italic mb-6 text-lg leading-relaxed">
                "A seara é grande, mas poucos são os trabalhadores."
              </p>
              <p className="text-sm text-zinc-500 font-black uppercase tracking-widest">(Mateus 9:37)</p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. CONTADOR PROGRESSIVO DE URGÊNCIA */}
      <section className="py-16 md:py-24 px-6 w-full max-w-5xl mx-auto flex flex-col items-center justify-center">
        <div className="w-full relative h-14 md:h-20 bg-white rounded-full shadow-[inset_0_-4px_6px_rgba(0,0,0,0.1)] flex items-center">
          <motion.div 
            className="absolute left-0 h-full rounded-full bg-gradient-to-r from-black via-zinc-800 to-zinc-500 flex items-center min-w-[220px] md:min-w-[350px]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <span className="absolute left-6 md:left-10 text-sm md:text-3xl font-black uppercase tracking-wider md:tracking-widest text-white whitespace-nowrap z-30 drop-shadow-md">
              Faltam {timeLeft.days} Dias
            </span>
            <div className="absolute right-0 translate-x-1/2 w-14 h-14 md:w-24 md:h-24 bg-gradient-to-br from-white to-zinc-200 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white flex items-center justify-center z-20">
              <div className="w-8 h-8 md:w-20 md:h-20 rounded-full bg-gradient-to-tl from-zinc-300 to-white shadow-inner"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. CONVIDADO ESPECIAL: PG */}
      <section className="relative w-full bg-[#0a0a0a] flex flex-col md:block md:min-h-[80vh] overflow-hidden">
        <div className="relative w-full h-[55vh] min-h-[400px] md:hidden block">
          <Image 
            src="/pg-mobile.png" 
            alt="PG - Convidado Especial" 
            fill 
            className="object-cover object-top" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"></div>
        </div>

        <div className="hidden md:block absolute inset-0 z-0">
          <Image 
            src="/pg-01.png" 
            alt="PG - Convidado Especial" 
            fill 
            className="object-cover object-[70%_center] md:object-center" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent w-full md:w-3/4"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-8 pb-20 md:py-40 flex items-center h-full">
          <div className="flex flex-col items-start md:w-1/2 -mt-16 md:mt-0">
            <h2 className="text-5xl md:text-7xl font-black uppercase leading-none mb-6">
              <span className="text-white block mb-2">Quem estará</span>
              <span className="text-zinc-500">Conosco?</span>
            </h2>
            <div className="relative w-40 sm:w-60 h-20 sm:h-24 mb-6">
              <Image 
                src="/logo-pg.jpeg" 
                alt="Logo PG" 
                fill 
                className="object-contain object-left mix-blend-screen opacity-90"
              />
            </div>
            <p className="text-zinc-300 text-lg md:text-xl font-medium leading-relaxed max-w-lg">
              Uma das maiores vozes do rock cristão no Brasil. Ex-vocalista da Oficina G3, PG marcou gerações com letras profundas e um som inconfundível. Ele estará conosco ministrando e ativando a igreja através do louvor e da palavra.
            </p>
          </div>
        </div>
      </section>

      {/* 6. PARA QUEM É A CONFERÊNCIA */}
      <section className="relative py-24 md:py-32 w-full bg-[#0a0a0a] overflow-hidden flex items-center min-h-screen">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/pg-02.png" 
            alt="PG no palco" 
            fill 
            className="object-cover object-[30%_center] md:object-left opacity-90" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0a0a0a]/80 to-[#0a0a0a] w-full"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-end items-center">
          <div className="hidden md:block md:w-1/2"></div>
          <div className="w-full md:w-1/2 flex flex-col">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white mb-10 md:mb-12 text-center shadow-black drop-shadow-md">
              Para quem é a Conferência?
            </h2>
            <div className="flex flex-col gap-4">
              {[
                "Para quem procura propósito e direção para o futuro.",
                "Quem precisa de um verdadeiro encontro com Deus.",
                "Se você está se sentindo sozinho ou sem esperança.",
                "Jovens e adultos que precisam de um recomeço na caminhada."
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-5 bg-white p-6 rounded-2xl border-2 border-[#1e1e1e] hover:-translate-y-1 transition-transform duration-300 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]"
                >
                  <CheckCircle className="text-[#1e1e1e] w-7 h-7 flex-shrink-0" />
                  <p className="text-[#1e1e1e] text-lg font-bold leading-snug">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. RECAP 2025 (CARROSSEL INFINITO) */}
      <section className="py-24 bg-[#0a0a0a] overflow-hidden flex flex-col items-center">
        <div className="max-w-6xl mx-auto text-center px-6 mb-12">
          <h2 className="text-3xl md:text-5xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 drop-shadow-sm">
            Se o que aconteceu em 2025 foi extraordinário...
          </h2>
        </div>
        <div className="relative w-full flex overflow-hidden py-4 pointer-events-none">
          <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-[#0a0a0a] to-transparent z-10"></div>
          <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-[#0a0a0a] to-transparent z-10"></div>

          <motion.div 
            className="flex gap-4 md:gap-6 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 50 }} 
          >
            {[
              '/2025/IMG_8496.jpg', '/2025/IMG_8500.jpg', '/2025/IMG_8528.jpg', 
              '/2025/IMG_8527.jpg', '/2025/IMG_8536.jpg', '/2025/IMG_8541.jpg', 
              '/2025/IMG_8549.jpg', '/2025/IMG_7924.jpg', '/2025/IMG_7989.jpg',
              '/2025/IMG_8496.jpg', '/2025/IMG_8500.jpg', '/2025/IMG_8528.jpg', 
              '/2025/IMG_8527.jpg', '/2025/IMG_8536.jpg', '/2025/IMG_8541.jpg', 
              '/2025/IMG_8549.jpg', '/2025/IMG_7924.jpg', '/2025/IMG_7989.jpg'
            ].map((src, idx) => (
              <div 
                key={idx} 
                className="relative w-48 h-[18rem] md:w-64 md:h-[26rem] overflow-hidden flex-shrink-0 border-2 border-zinc-800"
              >
                <Image 
                  src={src} 
                  alt={`Evento 2025 foto ${idx}`} 
                  fill 
                  className="object-cover" 
                />
              </div>
            ))}
          </motion.div>
        </div>  
        <div className="mt-12 px-6 z-20">
          <h3 className="text-2xl md:text-4xl font-black uppercase bg-white text-black px-8 py-4 skew-x-[-5deg] shadow-[8px_8px_0px_rgba(255,85,0,0.3)]">
            A expectativa para 2026 é ainda maior
          </h3>
        </div>
      </section>

      {/* 8. INGRESSOS */}
      <section id="ingressos" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase flex items-center justify-center gap-4">
            <Ticket className="w-10 h-10" /> Ingressos
          </h2>
          <p className="text-gray-400 mt-4 text-lg">Garanta seu lugar. Lotes sujeitos à virada sem aviso prévio.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* LOTE 1 */}
          <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl flex flex-col justify-between hover:-translate-y-2 transition-transform shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
            <div>
              <h3 className="text-2xl font-black uppercase mb-2">VOU - LOTE 01</h3>
              <p className="text-gray-400 text-sm mb-6">Acesso completo a todos os dias</p>
              <div className="text-5xl font-black mb-8">R$ 70<span className="text-xl text-gray-500">,00</span></div>
            </div>
            {/* Aqui mudamos para openCheckout */}
            <button onClick={() => openCheckout('lote1')} className="w-full bg-white text-black font-black uppercase py-4 rounded-lg hover:bg-gray-200 transition-colors">
              Comprar Ingresso
            </button>
          </div>

          {/* CARAVANA */}
          <div className="bg-zinc-800 border-2 border-white p-8 rounded-2xl flex flex-col justify-between transform md:-translate-y-4 shadow-[0_0_30px_rgba(255,255,255,0.1)] relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black font-bold uppercase text-xs px-4 py-1 rounded-full">
              Mais Popular
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase mb-2">Caravana Vou Eu +2</h3>
              <p className="text-gray-400 text-sm mb-6">Ingresso promocional para grupos</p>
              <div className="text-5xl font-black mb-8">R$ 65<span className="text-xl text-gray-500">,00</span><span className="text-sm font-normal text-gray-400 block mt-2">/pessoa</span></div>
            </div>
            <button onClick={() => openCheckout('caravana')} className="w-full bg-white text-black font-black uppercase py-4 rounded-lg hover:bg-gray-200 transition-colors">
              Comprar Combo
            </button>
          </div>

          {/* CRIANÇAS */}
          <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl flex flex-col justify-between hover:-translate-y-2 transition-transform shadow-2xl">
            <div>
              <h3 className="text-2xl font-black uppercase mb-2">Crianças 8 a 11 Anos</h3>
              <p className="text-gray-400 text-sm mb-6">Programação VOU Kids</p>
              <div className="text-5xl font-black mb-8">R$ 35<span className="text-xl text-gray-500">,00</span></div>
            </div>
            <button onClick={() => openCheckout('kids')} className="w-full bg-transparent border-2 border-white text-white font-black uppercase py-4 rounded-lg hover:bg-white hover:text-black transition-colors">
              Comprar Kids
            </button>
          </div>
        </div>
      </section>

      {/* 9. LOCALIZAÇÃO E CONTATO */}
      <section className="py-24 bg-[#0a0a0a] px-6 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2 w-full h-[400px] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
            <iframe 
              src="https://www.google.com/maps?q=Av.+Magalh%C3%A3es+Barata,+45+-+Aparecida,+Santar%C3%A9m+-+PA,+68040-540&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-4xl md:text-5xl font-black uppercase mb-8">Onde será o Evento?</h2>
            <div className="space-y-8">
              <div className="flex items-start gap-5">
                <MapPin className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-xl font-bold mb-1">Igreja MIR Moria</h4>
                  <p className="text-zinc-400 leading-relaxed text-lg">
                    Av. Magalhães Barata, 45 - Aparecida<br />
                    Santarém - PA, 68040-540
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <Clock className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-xl font-bold mb-1">Horários</h4>
                  <p className="text-zinc-400 leading-relaxed text-lg">
                    Sexta e Sábado: 19h30<br />
                    Domingo: 09h00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black uppercase text-center mb-12">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {[
            { q: "Preciso levar o ingresso impresso?", a: "Não! Você receberá um QR Code no seu e-mail após a compra. Basta apresentar na tela do seu celular no dia do evento." },
            { q: "Haverá estacionamento no local?", a: "Sim, a Igreja MIR Moria possui estacionamento, porém as vagas são limitadas. Recomendamos chegar cedo." },
            { q: "Crianças pagam ingresso?", a: "Crianças de 8 a 11 anos pagam o valor especial para a programação VOU Kids. Menores de 8 anos têm entrada gratuita, mas não terão cadeira reservada no salão principal." },
            { q: "Posso cancelar minha compra?", a: "Cancelamentos podem ser solicitados em até 7 dias após a compra, desde que feitos até 48 horas antes do início do evento." }
          ].map((faq, idx) => (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <button 
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full text-left px-6 py-4 flex justify-between items-center font-bold text-lg hover:bg-zinc-800/50 transition-colors"
              >
                {faq.q}
                <ChevronDown className={`w-5 h-5 transition-transform ${faqOpen === idx ? 'rotate-180' : ''}`} />
              </button>
              {faqOpen === idx && (
                <div className="px-6 pb-4 text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-[#0a0a0a] py-8 text-center border-t border-zinc-900">
        <p className="text-zinc-500 text-sm font-medium">© 2026 Conferência VOU. Todos os direitos reservados.</p>
        <p className="text-zinc-600 text-xs font-bold mt-2 tracking-widest uppercase">Desenvolvido por MAPA TECH</p>
      </footer>

      {/* === MODAL DE CHECKOUT === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              ✕
            </button>
            <h3 className="text-2xl font-black uppercase mb-2">Garantir Ingresso</h3>
            <p className="text-zinc-400 mb-6 text-sm">Preencha seus dados para prosseguir para o pagamento seguro.</p>
            
            <form onSubmit={handleNextOrSubmit} className="space-y-4">
              
              {selectedTicket === 'caravana' && (
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
                  <span className="text-purple-500 font-bold uppercase text-sm tracking-wider">
                    Inscrição {currentParticipant + 1} de 3
                  </span>
                  {currentParticipant > 0 && (
                    <button 
                      type="button" 
                      onClick={() => setCurrentParticipant(currentParticipant - 1)}
                      className="text-zinc-500 hover:text-white text-xs uppercase font-bold transition-colors"
                    >
                      ← Voltar
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-1">Nome Completo</label>
                <input required type="text" value={participants[currentParticipant].name} onChange={e => updateParticipant('name', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors" placeholder="João Silva" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-1">E-mail</label>
                <input required type="email" value={participants[currentParticipant].email} onChange={e => updateParticipant('email', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors" placeholder="joao@email.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-1">WhatsApp</label>
                <input required type="tel" value={participants[currentParticipant].phone} onChange={e => updateParticipant('phone', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors" placeholder="(00) 00000-0000" />
              </div>
              
              <button disabled={isSubmitting} type="submit" className="w-full bg-white text-black font-black uppercase py-4 rounded-lg mt-6 hover:bg-gray-200 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting 
                  ? "Gerando Pagamento..." 
                  : (selectedTicket === 'caravana' && currentParticipant < 2 
                      ? "Próxima Inscrição →" 
                      : "Ir para Pagamento")}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}