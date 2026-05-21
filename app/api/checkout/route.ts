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
    // A API da InfinitePay exige que o preço seja enviado em cêntimos (ex: 7000 = R$ 70,00)
    let ticketName = "VOU - LOTE 01";
    let ticketPrice = 100; 

    if (ticketType === "caravana") {
      ticketName = "Caravana Vou Eu +2";
      ticketPrice = 6500;
    } else if (ticketType === "kids") {
      ticketName = "Crianças 8 a 11 Anos";
      ticketPrice = 3500;
    }

    // 3. Monta o Payload exato exigido pela documentação da InfinitePay
    const infinitePayPayload = {
      handle: process.env.INFINITEPAY_HANDLE,
      redirect_url: "https://lp-conferencia.vercel.app/", // Para onde o cliente volta depois de pagar
      order_nsu: lead.id, // O ID do lead no Supabase. É isto que o webhook vai receber de volta!
      items: [
        {
          name: ticketName,
          price: ticketPrice,
          quantity: 1
        }
      ]
    };

    // 4. Pede à API da InfinitePay para gerar o link de pagamento exclusivo
    const response = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(infinitePayPayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Erro retornado pela API da InfinitePay:", errorData);
      throw new Error("Falha ao gerar o link de pagamento");
    }

    const data = await response.json();
    
    // A API devolve a URL pronta na propriedade "url"
    return NextResponse.json({ checkoutUrl: data.url });

  } catch (error) {
    console.error("Erro na rota de checkout:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}