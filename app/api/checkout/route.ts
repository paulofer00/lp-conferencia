import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { participants, ticketType } = await request.json();

    let finalTicketType = ticketType;
    let ticketName = "VOU - LOTE 01";
    let ticketPrice = 7000;

    // 1. REGRA DE PREÇOS E LOTES
    if (ticketType === "caravana") {
      ticketName = "Caravana Vou Eu +2";
      ticketPrice = 19500;
      finalTicketType = "caravana";
    } else if (ticketType === "kids") {
      ticketName = "Crianças 8 a 11 Anos";
      ticketPrice = 3500;
      finalTicketType = "kids";
    } else {
      // Regra do Lote 01 e Lote 02 (Pode ser 1 ou 2 pessoas)
      const limitDate = new Date("2026-06-14T00:00:00-03:00");
      const currentDate = new Date();

      const { count } = await supabaseAdmin
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("status", ["comprador", "presente"])
        .in("ticketType", ["lote1", "lote2", "LOTE1"]);

      const ingressosVendidos = count || 0;

      // Se o lote virou: R$ 80 vezes a quantidade de pessoas preenchidas
      if (ingressosVendidos >= 45 || currentDate >= limitDate) {
        finalTicketType = "lote2";
        ticketPrice = 8000 * participants.length; 
        ticketName = participants.length > 1 ? `VOU - LOTE 02 (${participants.length} Ingressos)` : "VOU - LOTE 02";
      } else {
        // Lote normal: R$ 70 vezes a quantidade de pessoas
        finalTicketType = "lote1";
        ticketPrice = 7000 * participants.length;
        ticketName = participants.length > 1 ? `VOU - LOTE 01 (${participants.length} Ingressos)` : "VOU - LOTE 01";
      }
    }

    // 2. Salva o comprador principal
    const mainParticipant = participants[0];
    const { data: mainLead, error: mainError } = await supabaseAdmin
      .from("leads")
      .insert([{ 
        name: mainParticipant.name, 
        email: mainParticipant.email, 
        phone: mainParticipant.phone, 
        ticketType: finalTicketType, 
        status: "pendente", 
        origin: "conferencia-vou" 
      }])
      .select()
      .single();

    if (mainError) throw mainError;

    // 3. Salva os acompanhantes (1 acompanhante no Lote 01, ou 2 na Caravana)
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

    // 4. Monta o Payload para a InfinitePay
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
          quantity: 1 // Na InfinitePay cobramos o valor total num item só
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