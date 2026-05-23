"use client";

import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase"; // Se der erro de import no cliente, podemos ajustar para uma rota de API, mas para leitura direta com o supabase-js público ou via uma rota API dedicada fica blindado. Vamos fazer via fetch para uma rota API para manter a segurança das chaves!
import { Users, ShoppingBag, UserCheck, UserX, Lock, RefreshCw } from "lucide-react";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "pendente" | "comprador" | "presente">("todos");

  // 1. Controle de Acesso da Equipe
  useEffect(() => {
    const savedPin = localStorage.getItem("staff_pin_vou");
    if (savedPin === "vou2026") { // Mesma senha que usamos na catraca
      setIsAuthenticated(true);
      fetchDashboardData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "vou2026") {
      localStorage.setItem("staff_pin_vou", pinInput);
      setIsAuthenticated(true);
      fetchDashboardData();
    } else {
      setError("Senha administrativa incorreta!");
    }
  };

  // 2. Busca de dados centralizada via API (Para não expor chaves master no front)
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Criaremos uma rota simples de API para despejar os leads aqui de forma segura
      const res = await fetch("/api/admin-leads");
      const data = await res.json();
      if (res.ok) {
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error("Erro ao carregar painel:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Contadores de Métricas
  const totalLeads = leads.length;
  const pendentes = leads.filter(l => l.status === "pendente" || !l.status).length;
  const compradores = leads.filter(l => l.status === "comprador").length;
  const presentes = leads.filter(l => l.status === "presente").length;

  // Filtra a lista exibida na tela
  const leadsFiltrados = leads.filter(l => {
    if (filtro === "todos") return true;
    if (filtro === "pendente") return l.status === "pendente" || !l.status;
    return l.status === filtro;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-white">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full text-center">
          <Lock className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase mb-4">Painel do Organizador</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="Senha de Acesso"
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-center text-white focus:outline-none focus:border-purple-500"
            />
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors uppercase text-sm">
              Entrar no Painel
            </button>
          </form>
          {error && <p className="text-red-500 font-bold mt-4 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Gestão Conferencia VOU</h1>
          <p className="text-zinc-400 text-sm">Controle de inscrições, financeiro e portaria ao vivo.</p>
        </div>
        <button 
          onClick={fetchDashboardData} 
          disabled={loading}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {/* METRICAS CARDS */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="flex justify-between items-center text-zinc-500 mb-2"><span className="text-xs font-bold uppercase tracking-wider">Total Geral</span><Users className="w-5 h-5 text-zinc-400" /></div>
          <div className="text-3xl font-black">{totalLeads}</div>
        </div>
        <div onClick={() => setFiltro("pendente")} className={`bg-zinc-900 border p-5 rounded-xl cursor-pointer transition-colors ${filtro === 'pendente' ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-700'}`}>
          <div className="flex justify-between items-center text-amber-500 mb-2"><span className="text-xs font-bold uppercase tracking-wider">Interessados (Não Comprou)</span><UserX className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-amber-500">{pendentes}</div>
        </div>
        <div onClick={() => setFiltro("comprador")} className={`bg-zinc-900 border p-5 rounded-xl cursor-pointer transition-colors ${filtro === 'comprador' ? 'border-purple-500 bg-purple-500/5' : 'border-zinc-800 hover:border-zinc-700'}`}>
          <div className="flex justify-between items-center text-purple-500 mb-2"><span className="text-xs font-bold uppercase tracking-wider">Inscritos (Pago)</span><ShoppingBag className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-purple-500">{compradores}</div>
        </div>
        <div onClick={() => setFiltro("presente")} className={`bg-zinc-900 border p-5 rounded-xl cursor-pointer transition-colors ${filtro === 'presente' ? 'border-green-500 bg-green-500/5' : 'border-zinc-800 hover:border-zinc-700'}`}>
          <div className="flex justify-between items-center text-green-500 mb-2"><span className="text-xs font-bold uppercase tracking-wider">No Evento (Checked-in)</span><UserCheck className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-green-500">{presentes}</div>
        </div>
      </div>

      {/* FILTROS DE LISTA */}
      <div className="max-w-7xl mx-auto mb-6 flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setFiltro("todos")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap ${filtro === 'todos' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>Todos ({totalLeads})</button>
        <button onClick={() => setFiltro("pendente")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap ${filtro === 'pendente' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-amber-500/70 hover:text-amber-500'}`}>Não Compraram ({pendentes})</button>
        <button onClick={() => setFiltro("comprador")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap ${filtro === 'comprador' ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-purple-400 hover:text-purple-300'}`}>Confirmados ({compradores})</button>
        <button onClick={() => setFiltro("presente")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap ${filtro === 'presente' ? 'bg-green-600 text-white' : 'bg-zinc-900 text-green-400 hover:text-green-300'}`}>Já Credenciados ({presentes})</button>
      </div>

      {/* TABELA DE LISTAGEM */}
      <div className="max-w-7xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Nome</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Ingresso</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm">
              {leadsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-12 text-zinc-500 font-medium">Nenhum participante encontrado nesta categoria.</td>
                </tr>
              ) : (
                leadsFiltrados.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="p-4 font-bold text-zinc-200">{lead.name}</td>
                    <td className="p-4">
                      <div className="text-zinc-400 text-xs">{lead.email}</div>
                      <a 
                        href={`https://wa.me/55${lead.phone?.replace(/\D/g, "")}`} 
                        target="_blank" 
                        className="text-purple-400 text-xs hover:underline block mt-0.5 font-medium"
                      >
                        📱 {lead.phone}
                      </a>
                    </td>
                    <td className="p-4"><span className="bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wide">{lead.ticketType || "LOTE1"}</span></td>
                    <td className="p-4 text-center">
                      {lead.status === "presente" && <span className="bg-green-500/10 text-green-400 text-xs font-black px-3 py-1.5 rounded-full border border-green-500/20 uppercase tracking-wider">✓ Presente</span>}
                      {lead.status === "comprador" && <span className="bg-purple-500/10 text-purple-400 text-xs font-black px-3 py-1.5 rounded-full border border-purple-500/20 uppercase tracking-wider">💳 Confirmado</span>}
                      {(lead.status === "pendente" || !lead.status) && (
                        <span className="bg-amber-500/10 text-amber-500 text-xs font-black px-3 py-1.5 rounded-full border border-amber-500/20 uppercase tracking-wider">⏳ Pendente</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}