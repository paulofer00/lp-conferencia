import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Puxa todos os leads cadastrados ordenados pelos mais recentes
    const { data: leads, error } = await supabaseAdmin
      .from("leads")
      .select("id, name, email, phone, ticketType, status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Erro na API administrativa:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}