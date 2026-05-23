import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id, pin } = await request.json();

    // 1. A BARREIRA DE SEGURANÇA (Senha da Equipe)
    // Se a senha não for "vou2026", ele bloqueia imediatamente!
    const STAFF_PIN = process.env.CHECKIN_PIN || "vou2026";
    if (pin !== STAFF_PIN) {
      return NextResponse.json({ error: "Acesso Negado: Senha da equipe incorreta" }, { status: 401 });
    }

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    // 2. Busca o ingresso no Supabase
    const { data: lead } = await supabaseAdmin.from("leads").select("*").eq("id", id).single();
    if (!lead) return NextResponse.json({ error: "Ingresso não encontrado" }, { status: 404 });

    // 3. Verifica se já foi usado
    if (lead.status === "presente") {
      return NextResponse.json({ message: "Ingresso JÁ UTILIZADO", lead }, { status: 400 });
    }

    // 4. Queima o ingresso
    await supabaseAdmin.from("leads").update({ status: "presente" }).eq("id", id);

    return NextResponse.json({ message: "Entrada Liberada!", lead });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}