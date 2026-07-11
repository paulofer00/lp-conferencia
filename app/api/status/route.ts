import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const limitDate = new Date("2026-06-15T00:00:00-03:00");
    const kidsLimitDate = new Date("2026-08-22T00:00:00-03:00");
    const currentDate = new Date();

    // Conta as vendas concluídas (Lote 1 e 2)
    const { count } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("status", ["comprador", "presente"])
      .in("ticketType", ["lote1", "lote2", "LOTE1"]);

    // Conta as vendas concluídas (Kids)
    const { count: kidsCount } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("status", ["comprador", "presente"])
      .eq("ticketType", "kids");

    const ingressosVendidos = count || 0;
    const kidsVendidos = kidsCount || 0;
    
    // Se bateu a meta ou passou da data, retorna TRUE
    const isEsgotado = ingressosVendidos >= 45 || currentDate >= limitDate;
    const isKidsEsgotado = kidsVendidos >= 50 || currentDate >= kidsLimitDate;

    return NextResponse.json({ isEsgotado, isKidsEsgotado });
  } catch (error) {
    return NextResponse.json({ isEsgotado: false, isKidsEsgotado: false });
  }
}