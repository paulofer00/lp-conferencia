"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Lock } from "lucide-react";

function CheckinContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "used" | "error" | "unauthorized">("idle");
  const [leadData, setLeadData] = useState<any>(null);
  const [pinInput, setPinInput] = useState("");
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);

  // 1. Verifica se a equipe já fez login hoje neste celular
  useEffect(() => {
    const savedPin = localStorage.getItem("staff_pin_vou");
    if (savedPin) {
      setIsStaffLoggedIn(true);
      if (id) processCheckin(id, savedPin);
    }
  }, [id]);

  // 2. Função que valida o ingresso com a senha embutida
  const processCheckin = (ticketId: string, pin: string) => {
    setStatus("loading");
    fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticketId, pin }) // Envia a senha junto!
    })
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(({ status, data }) => {
      if (status === 200) {
        setStatus("success");
        setLeadData(data.lead);
      } else if (status === 400 && data.message === "Ingresso JÁ UTILIZADO") {
        setStatus("used");
        setLeadData(data.lead);
      } else if (status === 401) {
        // Se a senha estiver errada, apaga a memória e bloqueia a tela
        localStorage.removeItem("staff_pin_vou");
        setIsStaffLoggedIn(false);
        setStatus("unauthorized");
      } else {
        setStatus("error");
      }
    });
  };

  // 3. Função de Login Manual da Equipe
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("staff_pin_vou", pinInput); // Salva a senha no celular
    setIsStaffLoggedIn(true);
    if (id) processCheckin(id, pinInput);
  };

  // --- TELA 1: O CADEADO (Aparece para clientes ou equipe não logada) ---
  if (!isStaffLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white selection:bg-purple-600">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
          <Lock className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase mb-2">Acesso Restrito</h2>
          <p className="text-zinc-400 text-sm mb-6">Digite a senha da equipe para habilitar este celular como leitor da catraca.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Senha da Equipe"
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-center text-white focus:outline-none focus:border-white tracking-widest"
              required
            />
            <button type="submit" className="w-full bg-white text-black font-black uppercase py-3 rounded-lg hover:bg-gray-200 transition-colors">
              Habilitar Leitor
            </button>
          </form>
          {status === "unauthorized" && <p className="text-red-500 font-bold mt-4 text-sm">Senha incorreta!</p>}
        </div>
      </div>
    );
  }

  // --- TELA 2: CARREGANDO ---
  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xl font-bold">Validando ingresso...</div>;
  }

  // --- TELA 3: RESULTADOS DA CATRACA ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center selection:bg-purple-600">
      
      {status === "success" && (
        <div className="bg-green-900/20 border-2 border-green-500 p-10 rounded-3xl max-w-md w-full shadow-[0_0_40px_rgba(34,197,94,0.3)]">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-black uppercase text-green-500 mb-4">Entrada Liberada</h1>
          <p className="text-2xl font-bold text-white mb-2">{leadData?.name}</p>
          <p className="text-green-400 font-medium">Ingresso: {leadData?.ticketType?.toUpperCase()}</p>
        </div>
      )}

      {status === "used" && (
        <div className="bg-red-900/20 border-2 border-red-500 p-10 rounded-3xl max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.3)]">
          <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
          <h1 className="text-4xl font-black uppercase text-red-500 mb-4">Atenção:<br/>Já Utilizado</h1>
          <p className="text-2xl font-bold text-white mb-2">{leadData?.name}</p>
          <p className="text-red-400 font-medium">Este QR Code já deu entrada no evento anteriormente.</p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-900/20 border-2 border-red-500 p-10 rounded-3xl max-w-md w-full">
          <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
          <h1 className="text-4xl font-black uppercase text-red-500 mb-4">Ingresso Inválido</h1>
          <p className="text-red-400 font-medium">QR Code não reconhecido ou corrompido.</p>
        </div>
      )}

      <button 
        onClick={() => { localStorage.removeItem("staff_pin_vou"); window.location.reload(); }}
        className="mt-12 text-zinc-600 underline text-sm hover:text-white"
      >
        Sair do modo Equipe
      </button>

    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Carregando...</div>}>
      <CheckinContent />
    </Suspense>
  );
}