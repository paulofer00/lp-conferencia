"use client";

import { useEffect, useState } from "react";
import { Users, LayoutDashboard, LogOut, DollarSign, Ticket, CreditCard, ArrowUpRight, Activity } from "lucide-react";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
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
      setError("Senha incorreta.");
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

  // --- MÉTIRICAS GERAIS ---
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
  
  const revenueLote1 = paidLeads.filter(l => !l.ticketType || l.ticketType === "lote1").length * 70;
  const revenueCaravana = paidLeads.filter(l => l.ticketType === "caravana").length * 65;
  const revenueKids = paidLeads.filter(l => l.ticketType === "kids").length * 35;
  const totalRevenue = revenueLote1 + revenueCaravana + revenueKids;

  const recentSales = [...paidLeads]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 6);

  // --- TELA DE LOGIN MINIMALISTA ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white font-sans">
        <div className="w-full max-w-xs text-center">
          <Activity className="w-8 h-8 text-white mx-auto mb-6" />
          <h2 className="text-sm font-medium tracking-widest uppercase text-zinc-400 mb-8">VOU Admin</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="Código de Acesso"
              className="w-full bg-transparent border-b border-zinc-800 px-4 py-3 text-center text-white focus:outline-none focus:border-white transition-colors tracking-widest placeholder:text-zinc-700"
            />
            <button type="submit" className="w-full text-white text-xs font-bold tracking-widest uppercase py-4 hover:text-zinc-400 transition-colors">
              Acessar
            </button>
          </form>
          {error && <p className="text-red-500 mt-4 text-xs">{error}</p>}
        </div>
      </div>
    );
  }

  // --- TELA DO DASHBOARD PREMIUM ---
  return (
    <div className="min-h-screen bg-black text-zinc-200 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 border-r border-zinc-900 bg-black flex flex-col">
        <div className="p-8 flex items-center gap-3">
          <Activity className="w-5 h-5 text-white" />
          <span className="font-bold tracking-widest uppercase text-sm">VOU Admin</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button 
            onClick={() => setActiveTab("financeiro")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'financeiro' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab("inscritos")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inscritos' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <Users className="w-4 h-4" />
            Inscrições
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-400 transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-6 md:p-12 h-screen overflow-y-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-white">
              {activeTab === "financeiro" ? "Desempenho Financeiro" : "Gestão de Leads"}
            </h1>
            <p className="text-zinc-500 text-xs tracking-wider uppercase mt-2">Santarém, PA — 2026</p>
          </div>
          <button 
            onClick={fetchDashboardData} 
            disabled={loading}
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest"
          >
            {loading ? "Sincronizando..." : "Sincronizar"}
          </button>
        </header>

        {/* =========================================
            TAB 1: FINANCEIRO (MINIMALISTA)
        ============================================= */}
        {activeTab === "financeiro" && (
          <div className="space-y-8">
            
            {/* CARDS SUPERIORES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 border border-zinc-900 bg-[#050505] rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Faturamento</span>
                  <DollarSign className="w-4 h-4 text-zinc-700" />
                </div>
                <div>
                  <span className="text-4xl font-light text-white tracking-tight">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3 h-3" /> Receita Confirmada
                </div>
              </div>

              <div className="p-6 border border-zinc-900 bg-[#050505] rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Ingressos Pagos</span>
                  <Ticket className="w-4 h-4 text-zinc-700" />
                </div>
                <div>
                  <span className="text-4xl font-light text-white tracking-tight">{paidLeads.length}</span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                  Conversão de {totalLeads > 0 ? Math.round((paidLeads.length / totalLeads) * 100) : 0}%
                </div>
              </div>

              <div className="p-6 border border-zinc-900 bg-[#050505] rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Ticket Médio</span>
                  <CreditCard className="w-4 h-4 text-zinc-700" />
                </div>
                <div>
                  <span className="text-4xl font-light text-white tracking-tight">R$ {paidLeads.length > 0 ? (totalRevenue / paidLeads.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"}</span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                  Média por participante
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* GRÁFICO DE DIVISÃO (BARRAS FINAS) */}
              <div className="p-8 border border-zinc-900 bg-[#050505] rounded-2xl">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-8">Composição de Vendas</h3>
                <div className="space-y-6">
                  {/* Lote 1 */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-zinc-200">Lote 01 <span className="text-zinc-600 font-normal ml-2">{paidLeads.filter(l => !l.ticketType || l.ticketType === "lote1").length} un</span></span>
                      <span className="text-sm text-white">R$ {revenueLote1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: `${totalRevenue > 0 ? (revenueLote1 / totalRevenue) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  
                  {/* Caravana */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-zinc-200">Caravana +2 <span className="text-zinc-600 font-normal ml-2">{paidLeads.filter(l => l.ticketType === "caravana").length} un</span></span>
                      <span className="text-sm text-white">R$ {revenueCaravana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (revenueCaravana / totalRevenue) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  {/* Kids */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-zinc-200">VOU Kids <span className="text-zinc-600 font-normal ml-2">{paidLeads.filter(l => l.ticketType === "kids").length} un</span></span>
                      <span className="text-sm text-white">R$ {revenueKids.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-600 rounded-full" style={{ width: `${totalRevenue > 0 ? (revenueKids / totalRevenue) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ÚLTIMAS VENDAS */}
              <div className="p-8 border border-zinc-900 bg-[#050505] rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Últimas Transações</h3>
                  <div className="flex items-center gap-1.5 text-emerald-400/80 text-[10px] uppercase tracking-widest font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Ao Vivo
                  </div>
                </div>
                
                {recentSales.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-sm">Sem transações recentes.</div>
                ) : (
                  <div className="flex flex-col">
                    {recentSales.map((sale, idx) => (
                      <div key={idx} className="flex justify-between items-center py-3 border-b border-zinc-900 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{sale.name}</p>
                          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{sale.ticketType || "LOTE 1"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-emerald-400 font-medium">+ R$ {sale.ticketType === 'caravana' ? '65,00' : sale.ticketType === 'kids' ? '35,00' : '70,00'}</p>
                          <p className="text-[10px] text-zinc-600">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
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
            TAB 2: LISTA DE INSCRITOS (CRM CLEAN)
        ============================================= */}
        {activeTab === "inscritos" && (
          <div className="space-y-6">
            
            {/* NAVEGAÇÃO DE FILTROS (TABS) */}
            <div className="flex gap-6 border-b border-zinc-900 mb-6 overflow-x-auto">
              <button onClick={() => setFiltro("todos")} className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${filtro === 'todos' ? 'border-b-2 border-white text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>Todos ({totalLeads})</button>
              <button onClick={() => setFiltro("comprador")} className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${filtro === 'comprador' ? 'border-b-2 border-white text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>Pagos ({compradores})</button>
              <button onClick={() => setFiltro("presente")} className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${filtro === 'presente' ? 'border-b-2 border-white text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>No Evento ({presentes})</button>
              <button onClick={() => setFiltro("pendente")} className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${filtro === 'pendente' ? 'border-b-2 border-white text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>Pendentes ({pendentes})</button>
            </div>

            {/* TABELA ULTRA MINIMALISTA */}
            <div className="bg-[#050505] border border-zinc-900 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-600 text-xs font-medium">
                      <th className="py-4 px-6 font-normal">Participante</th>
                      <th className="py-4 px-6 font-normal">Tipo</th>
                      <th className="py-4 px-6 font-normal">Contato</th>
                      <th className="py-4 px-6 font-normal text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {leadsFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-zinc-600 text-sm">Nenhum registro encontrado.</td>
                      </tr>
                    ) : (
                      leadsFiltrados.map((lead) => (
                        <tr key={lead.id} className="hover:bg-zinc-900/20 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-medium text-zinc-200">{lead.name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{lead.email}</p>
                          </td>
                          <td className="py-4 px-6 text-zinc-400 uppercase text-xs tracking-wider">
                            {lead.ticketType || "Lote 1"}
                          </td>
                          <td className="py-4 px-6">
                            <a 
                              href={`https://wa.me/55${lead.phone?.replace(/\D/g, "")}`} 
                              target="_blank" 
                              className="text-zinc-400 hover:text-white transition-colors"
                            >
                              {lead.phone}
                            </a>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {lead.status === "presente" && (
                              <span className="inline-flex items-center gap-2 text-xs text-zinc-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Presente
                              </span>
                            )}
                            {lead.status === "comprador" && (
                              <span className="inline-flex items-center gap-2 text-xs text-zinc-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Pago
                              </span>
                            )}
                            {(lead.status === "pendente" || !lead.status) && (
                              <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span> Pendente
                              </span>
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