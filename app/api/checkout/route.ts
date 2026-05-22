import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase"; 

export async function POST(request: Request) {
  try {
    const { participants, ticketType } = await request.json();

    // 1. Salva o comprador principal (O primeiro do array) para gerar o ID mestre
    const mainParticipant = participants[0];
    const { data: mainLead, error: mainError } = await supabaseAdmin
      .from("leads")
      .insert([{ 
        name: mainParticipant.name, 
        email: mainParticipant.email, 
        phone: mainParticipant.phone, 
        ticketType, 
        status: "pendente", 
        origin: "conferencia-vou" 
      }])
      .select()
      .single();

    if (mainError) throw mainError;

    // 2. Se for caravana, salva os acompanhantes vinculados ao ID do comprador mestre!
    if (participants.length > 1) {
      const extraLeads = participants.slice(1).map((p: any) => ({
        name: p.name,
        email: p.email,
        phone: p.phone,
        ticketType,
        status: "pendente",
        origin: mainLead.id // O vínculo mágico para o Webhook achar eles depois!
      }));
      await supabaseAdmin.from("leads").insert(extraLeads);
    }

    // 3. Define o valor e nome baseado no tipo de ingresso escolhido
    let ticketName = "VOU - LOTE 01";
    let ticketPrice = 7000; 

    if (ticketType === "caravana") {
      ticketName = "Caravana Vou Eu +2";
      ticketPrice = 6500; // Altere para 100 se for fazer o teste de 1 real
    } else if (ticketType === "kids") {
      ticketName = "Criancas 8 a 11 Anos";
      ticketPrice = 3500;
    }

    // 4. Monta o Payload CORRIGIDO para a InfinitePay (Com a Infiltração VULP)
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

    // 5. Pede à API da InfinitePay para gerar o link
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