import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { participants, ticketType } = await request.json();

    // 1. REGRA DE NEGÓCIO: VIRADA DE LOTE AUTOMÁTICA
    let finalTicketType = ticketType;
    let ticketName = "VOU - LOTE 01";
    let ticketPrice = 7000; // R$ 70,00

    if (ticketType === "caravana") {
      ticketName = "Caravana Vou Eu +2";
      ticketPrice = 19500;
      finalTicketType = "caravana";
    } else if (ticketType === "kids") {
      ticketName = "Crianças 8 a 11 Anos";
      ticketPrice = 3500;
      finalTicketType = "kids";
    } else {
      // Se for ingresso individual, acionamos a trava de segurança!
      
      // Ajustamos a data limite com fuso horário de Brasília (-03:00) 
      // para a Vercel não virar o lote 3h mais cedo por causa do fuso UTC.
      const limitDate = new Date("2026-06-14T00:00:00-03:00");
      const currentDate = new Date();

      // Conta APENAS os ingressos individuais que já foram PAGOS ou estão no EVENTO
      const { count } = await supabaseAdmin
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("status", ["comprador", "presente"])
        .in("ticketType", ["lote1", "lote2", "LOTE1"]); // Pega o histórico das variações

      const ingressosVendidos = count || 0;

      // A MAGIA ACONTECE AQUI: Vendeu 45 OU chegou dia 14? Vira para Lote 2!
      if (ingressosVendidos >= 45 || currentDate >= limitDate) {
        finalTicketType = "lote2";
        ticketName = "VOU - LOTE 02";
        ticketPrice = 8000; // R$ 80,00
      } else {
        finalTicketType = "lote1";
        ticketName = "VOU - LOTE 01";
        ticketPrice = 7000; // R$ 70,00
      }
    }

    // 2. Salva o comprador principal com o LOTE CORRIGIDO DINAMICAMENTE
    const mainParticipant = participants[0];
    const { data: mainLead, error: mainError } = await supabaseAdmin
      .from("leads")
      .insert([{ 
        name: mainParticipant.name, 
        email: mainParticipant.email, 
        phone: mainParticipant.phone, 
        ticketType: finalTicketType, // Agora salva "lote1" ou "lote2" da forma certa
        status: "pendente", 
        origin: "conferencia-vou" 
      }])
      .select()
      .single();

    if (mainError) throw mainError;

    // 3. Se for caravana, salva os acompanhantes
    if (participants.length > 1) {
      const extraLeads = participants.slice(1).map((p: any) => ({
        name: p.name,
        email: p.email,
        phone: p.phone,
        ticketType: finalTicketType,
        status: "pendente",
        origin: mainLead.id
      }));
      await supabaseAdmin.from("leads").insert(extraLeads);
    }

    // 4. Monta o Payload para a InfinitePay com o preço exato do momento
    const infinitePayPayload = {
      handle: process.env.INFINITEPAY_HANDLE || "sidneyjati", 
      redirect_url: "https://lift.mirmoria.com.br/", 
      webhook_url: "https://lift.mirmoria.com.br/api/webhook?secret=conferencia_vou_secreto_2026",
      metadata: String(mainLead.id), 
      order_nsu: String(mainLead.id), 
      items: [
        {
          description: ticketName, 
          price: ticketPrice,
          quantity: 1
        }
      ]
    };

    const response = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(infinitePayPayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Erro retornado pela API da InfinitePay:", errorData);
      return NextResponse.json({ error: `A InfinitePay recusou: ${errorData}` }, { status: 400 });
    }

    const data = await response.json();
    return NextResponse.json({ checkoutUrl: data.url });

  } catch (error: any) {
    console.error("Erro interno no checkout:", error);
    return NextResponse.json({ error: error.message || "Erro interno no servidor" }, { status: 500 });
  }
}