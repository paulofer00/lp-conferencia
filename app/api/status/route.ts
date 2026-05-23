import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const limitDate = new Date("2026-06-14T00:00:00-03:00");
    const currentDate = new Date();

    // Conta as vendas concluídas
    const { count } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("status", ["comprador", "presente"])
      .in("ticketType", ["lote1", "lote2", "LOTE1"]);

    const ingressosVendidos = count || 0;
    
    // Se bateu a meta ou passou da data, retorna TRUE
    const isEsgotado = ingressosVendidos >= 45 || currentDate >= limitDate;

    return NextResponse.json({ isEsgotado });
  } catch (error) {
    return NextResponse.json({ isEsgotado: false });
  }
}