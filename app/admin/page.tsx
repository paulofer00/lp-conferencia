"use client";

import { useEffect, useState } from "react";
import { Users, ShoppingBag, UserCheck, UserX, Lock, RefreshCw, LayoutDashboard, LogOut, DollarSign, Ticket, Activity, CreditCard, CheckCircle } from "lucide-react";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Controle de Abas (Sidebar)
  const [activeTab, setActiveTab] = useState<"financeiro" | "inscritos">("financeiro");
  const [filtro, setFiltro] = useState<"todos" | "pendente" | "comprador" | "presente">("todos");

  useEffect(() => {
    const savedPin = localStorage.getItem("staff_pin_vou");
    if (savedPin === "vou2026") {
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

  const handleLogout = () => {
    localStorage.removeItem("staff_pin_vou");
    setIsAuthenticated(false);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-leads");
      const data = await res.json();
      if (res.ok) setLeads(data.leads || []);
    } catch (err) {
      console.error("Erro ao carregar painel:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- MÁTRICAS GERAIS ---
  const totalLeads = leads.length;
  const pendentes = leads.filter(l => l.status === "pendente" || !l.status).length;
  const compradores = leads.filter(l => l.status === "comprador").length;
  const presentes = leads.filter(l => l.status === "presente").length;

  const leadsFiltrados = leads.filter(l => {
    if (filtro === "todos") return true;
    if (filtro === "pendente") return l.status === "pendente" || !l.status;
    return l.status === filtro;
  });

  // --- MÉTRICAS FINANCEIRAS ---
  const paidLeads = leads.filter(l => l.status === "comprador" || l.status === "presente");
  
  // Cálculo de Receita Baseado na Regra de Negócios
  const revenueLote1 = paidLeads.filter(l => !l.ticketType || l.ticketType === "lote1").length * 70;
  const revenueCaravana = paidLeads.filter(l => l.ticketType === "caravana").length * 65;
  const revenueKids = paidLeads.filter(l => l.ticketType === "kids").length * 35;
  const totalRevenue = revenueLote1 + revenueCaravana + revenueKids;

  // Últimas Vendas (Pegamos os últimos 5 compradores)
  const recentSales = [...paidLeads]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

  // --- TELA DE LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-white">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
          <Lock className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase mb-4">Acesso Restrito</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="Senha de Acesso"
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-center text-white focus:outline-none focus:border-purple-500 tracking-widest"
            />
            <button type="submit" className="w-full bg-white text-black font-black py-3 rounded-lg hover:bg-gray-200 transition-colors uppercase text-sm">
              Entrar no Painel
            </button>
          </form>
          {error && <p className="text-red-500 font-bold mt-4 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  // --- TELA DO DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row font-sans selection:bg-purple-600">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#0a0a0a] border-r border-zinc-900 flex flex-col">
        <div className="p-6 md:p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-black tracking-widest uppercase text-lg">VOU Admin</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab("financeiro")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'financeiro' ? 'bg-zinc-900 text-white shadow-md border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab("inscritos")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'inscritos' ? 'bg-zinc-900 text-white shadow-md border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <Users className="w-5 h-5" />
            Lista de Inscrições
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-900 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-6 md:p-10 h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              {activeTab === "financeiro" ? "Desempenho Financeiro" : "Gestão de Leads"}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Santarém / PA - Conferência 2026</p>
          </div>
          <button 
            onClick={fetchDashboardData} 
            disabled={loading}
            className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-5 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sincronizar Dados</span>
          </button>
        </header>

        {/* =========================================
            TAB 1: FINANCEIRO (ESTILO NEXA AI)
        ============================================= */}
        {activeTab === "financeiro" && (
          <div className="space-y-6">
            
            {/* CARDS SUPERIORES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0d0d0d] border border-zinc-800/80 p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign className="w-24 h-24 text-green-500" />
                </div>
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-2">Faturamento Bruto</p>
                <div className="text-4xl md:text-5xl font-black text-white">
                  <span className="text-2xl text-zinc-600 mr-1">R$</span>
                  {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-green-500 text-xs font-bold mt-4 bg-green-500/10 inline-block px-3 py-1 rounded-full border border-green-500/20">
                  ↑ Receita 100% Confirmada
                </p>
              </div>

              <div className="bg-[#0d0d0d] border border-zinc-800/80 p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShoppingBag className="w-24 h-24 text-purple-500" />
                </div>
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-2">Ingressos Vendidos</p>
                <div className="text-4xl md:text-5xl font-black text-white">{paidLeads.length}</div>
                <p className="text-purple-400 text-xs font-bold mt-4 bg-purple-500/10 inline-block px-3 py-1 rounded-full border border-purple-500/20">
                  {totalLeads > 0 ? Math.round((paidLeads.length / totalLeads) * 100) : 0}% de Conversão Total
                </p>
              </div>

              <div className="bg-[#0d0d0d] border border-zinc-800/80 p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Ticket className="w-24 h-24 text-blue-500" />
                </div>
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-2">Ticket Médio</p>
                <div className="text-4xl md:text-5xl font-black text-white">
                  <span className="text-2xl text-zinc-600 mr-1">R$</span>
                  {paidLeads.length > 0 ? (totalRevenue / paidLeads.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"}
                </div>
                <p className="text-blue-400 text-xs font-bold mt-4 bg-blue-500/10 inline-block px-3 py-1 rounded-full border border-blue-500/20">
                  Média por inscrito pago
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* GRÁFICO DE DIVISÃO DE RECEITA (CSS PURO) */}
              <div className="bg-[#0d0d0d] border border-zinc-800/80 p-8 rounded-3xl">
                <h3 className="text-lg font-black uppercase mb-8">Composição de Vendas</h3>
                <div className="space-y-6">
                  {/* Lote 1 */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-white font-bold">Lote 01</p>
                        <p className="text-zinc-500 text-xs uppercase">{paidLeads.filter(l => !l.ticketType || l.ticketType === "lote1").length} Ingressos</p>
                      </div>
                      <p className="text-white font-black">R$ {revenueLote1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (revenueLote1 / totalRevenue) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  
                  {/* Caravana */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-white font-bold">Caravana +2</p>
                        <p className="text-zinc-500 text-xs uppercase">{paidLeads.filter(l => l.ticketType === "caravana").length} Ingressos</p>
                      </div>
                      <p className="text-white font-black">R$ {revenueCaravana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (revenueCaravana / totalRevenue) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  {/* Kids */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-white font-bold">VOU Kids</p>
                        <p className="text-zinc-500 text-xs uppercase">{paidLeads.filter(l => l.ticketType === "kids").length} Ingressos</p>
                      </div>
                      <p className="text-white font-black">R$ {revenueKids.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (revenueKids / totalRevenue) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ÚLTIMAS VENDAS REAIS */}
              <div className="bg-[#0d0d0d] border border-zinc-800/80 p-8 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black uppercase">Últimas Vendas</h3>
                  <span className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Ao Vivo
                  </span>
                </div>
                
                {recentSales.length === 0 ? (
                  <div className="text-center py-10 text-zinc-600 font-medium">Nenhuma venda registrada ainda.</div>
                ) : (
                  <div className="space-y-4">
                    {recentSales.map((sale, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-black">
                            {sale.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{sale.name}</p>
                            <p className="text-zinc-500 text-xs uppercase tracking-wider">{sale.ticketType || "Lote 1"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-black">+ R$ {sale.ticketType === 'caravana' ? '65,00' : sale.ticketType === 'kids' ? '35,00' : '70,00'}</p>
                          <p className="text-zinc-600 text-xs">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 2: LISTA DE INSCRITOS (CRM)
        ============================================= */}
        {activeTab === "inscritos" && (
          <div className="space-y-6">
            
            {/* CARDS DE STATUS (Filtros) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
              <div onClick={() => setFiltro("todos")} className={`bg-[#0d0d0d] border p-5 rounded-2xl cursor-pointer transition-all ${filtro === 'todos' ? 'border-white bg-white/5' : 'border-zinc-800 hover:border-zinc-700'}`}>
                <div className="text-zinc-500 mb-1"><span className="text-xs font-bold uppercase tracking-wider">Total Leads</span></div>
                <div className="text-3xl font-black text-white">{totalLeads}</div>
              </div>
              <div onClick={() => setFiltro("pendente")} className={`bg-[#0d0d0d] border p-5 rounded-2xl cursor-pointer transition-all ${filtro === 'pendente' ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-zinc-800 hover:border-zinc-700'}`}>
                <div className="text-amber-500/70 mb-1"><span className="text-xs font-bold uppercase tracking-wider">Pendentes</span></div>
                <div className="text-3xl font-black text-amber-500">{pendentes}</div>
              </div>
              <div onClick={() => setFiltro("comprador")} className={`bg-[#0d0d0d] border p-5 rounded-2xl cursor-pointer transition-all ${filtro === 'comprador' ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'border-zinc-800 hover:border-zinc-700'}`}>
                <div className="text-purple-400/70 mb-1"><span className="text-xs font-bold uppercase tracking-wider">Confirmados</span></div>
                <div className="text-3xl font-black text-purple-400">{compradores}</div>
              </div>
              <div onClick={() => setFiltro("presente")} className={`bg-[#0d0d0d] border p-5 rounded-2xl cursor-pointer transition-all ${filtro === 'presente' ? 'border-green-500 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-zinc-800 hover:border-zinc-700'}`}>
                <div className="text-green-400/70 mb-1"><span className="text-xs font-bold uppercase tracking-wider">No Evento</span></div>
                <div className="text-3xl font-black text-green-400">{presentes}</div>
              </div>
            </div>

            {/* TABELA DE LISTAGEM */}
            <div className="bg-[#0d0d0d] border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-500 text-xs font-black uppercase tracking-widest">
                      <th className="p-6">Participante</th>
                      <th className="p-6">Ingresso</th>
                      <th className="p-6">WhatsApp</th>
                      <th className="p-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-sm">
                    {leadsFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center p-12 text-zinc-600 font-medium">A lista está limpa. Aguardando novos registros.</td>
                      </tr>
                    ) : (
                      leadsFiltrados.map((lead) => (
                        <tr key={lead.id} className="hover:bg-zinc-900/30 transition-colors">
                          <td className="p-6">
                            <p className="font-bold text-white text-base">{lead.name}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{lead.email}</p>
                          </td>
                          <td className="p-6">
                            <span className="bg-zinc-800 text-zinc-300 text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider border border-zinc-700">
                              {lead.ticketType || "LOTE1"}
                            </span>
                          </td>
                          <td className="p-6">
                            <a 
                              href={`https://wa.me/55${lead.phone?.replace(/\D/g, "")}`}
                              target="_blank" 
                              className="text-white hover:text-green-400 flex items-center gap-2 transition-colors font-medium"
                            >
                              {lead.phone}
                            </a>
                          </td>
                          <td className="p-6 text-right">
                            {lead.status === "presente" && <span className="bg-green-500/10 text-green-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-green-500/20 uppercase tracking-widest inline-flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Catraca Liberada</span>}
                            {lead.status === "comprador" && <span className="bg-purple-500/10 text-purple-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-purple-500/20 uppercase tracking-widest inline-flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Pago</span>}
                            {(lead.status === "pendente" || !lead.status) && (
                              <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1.5 rounded-full border border-amber-500/20 uppercase tracking-widest inline-flex items-center gap-1.5">⏳ Carrinho Aband.</span>
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
        )}

      </main>
    </div>
  );
}