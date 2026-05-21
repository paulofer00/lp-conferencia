import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase"; 

export async function POST(request: Request) {
  try {
    const { name, email, phone, ticketType } = await request.json();

    // 1. Salva no Supabase (Status: Pendente)
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .insert([{ name, email, phone, ticketType, status: "pendente", origin: "conferencia-vou" }])
      .select()
      .single();

    if (error) throw error;

    // 2. Define o valor e nome baseado no tipo de ingresso escolhido
    let ticketName = "VOU - LOTE 01";
    let ticketPrice = 100; 

    if (ticketType === "caravana") {
      ticketName = "Caravana Vou Eu +2";
      ticketPrice = 6500;
    } else if (ticketType === "kids") {
      ticketName = "Criancas 8 a 11 Anos";
      ticketPrice = 3500;
    }

    /// 3. Monta o Payload CORRIGIDO para a InfinitePay (Com a Infiltração VULP)
    const infinitePayPayload = {
      handle: process.env.INFINITEPAY_HANDLE || "sidneyjati", 
      redirect_url: "https://lift.mirmoria.com.br/", 
      webhook_url: "https://lift.mirmoria.com.br/api/webhook?secret=conferencia_vou_secreto_2026", // A MÁGICA VOLTOU!
      metadata: String(lead.id), 
      order_nsu: String(lead.id), // Garantindo que o ID vai como string igual fizemos na VULP
      items: [
        {
          description: ticketName, 
          price: ticketPrice, // Lembre-se de deixar 100 aqui para o teste de 1 real
          quantity: 1
        }
      ]
    };

    // 4. Pede à API da InfinitePay para gerar o link
    const response = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(infinitePayPayload)
    });

    // 5. Se a InfinitePay der erro, agora vamos cuspir exatamente qual foi o erro para você ler!
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Erro retornado pela API da InfinitePay:", errorData);
      return NextResponse.json({ error: `A InfinitePay recusou: ${errorData}` }, { status: 400 });
    }

    const data = await response.json();
    
    // Sucesso! Devolve a URL pronta
    return NextResponse.json({ checkoutUrl: data.url });

  } catch (error: any) {
    console.error("Erro interno no checkout:", error);
    return NextResponse.json({ error: error.message || "Erro interno no servidor" }, { status: 500 });
  }
}