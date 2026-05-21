import { supabaseAdmin } from "../../../lib/supabase";
import { NextResponse } from "next/server";
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("secret") !== process.env.INFINITEPAY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 });
    }

    const body = await request.json();
    console.log("🔔 Webhook InfinitePay Recebido. Dados:", JSON.stringify(body));

    // Pega o ID que mandamos via metadados no link de pagamento
    const leadId = body.metadata || body.order_nsu || body.order_id;

    if (!leadId) return NextResponse.json({ error: "Lead ID missing" }, { status: 400 });

    const { data: lead } = await supabaseAdmin.from("leads").select("*").eq("id", leadId).single();
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // 1. Atualiza CRM para Comprador
    await supabaseAdmin.from("leads").update({ status: "comprador" }).eq("id", leadId);
    console.log(`🟢 Base Atualizada: Ingresso do(a) ${lead.name} confirmado!`);

    // 2. Gera o QR Code com os dados de validação
    const qrData = JSON.stringify({ id: lead.id, nome: lead.name, ingresso: lead.ticketType });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      color: { dark: '#000000', light: '#FFFFFF' },
      width: 400
    });

    // 3. Dispara o E-mail de Confirmação com o Ingresso
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: '"Conferência VOU" <seu-email@aqui.com>',
      to: lead.email,
      subject: '🎫 Seu Ingresso Garantido: Conferência VOU',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; padding: 40px; border-radius: 10px;">
          <h1 style="text-transform: uppercase; letter-spacing: 2px;">O REINO AVANÇA!</h1>
          <p style="font-size: 18px;">Fala <strong>${lead.name}</strong>, tudo certo?</p>
          <p style="color: #a1a1aa; font-size: 16px;">Sua presença está confirmada na Conferência VOU.</p>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
            <p style="color: #000; font-weight: bold; margin-bottom: 10px; font-size: 20px;">SEU INGRESSO (${lead.ticketType.toUpperCase()})</p>
            <img src="${qrCodeDataUrl}" alt="QR Code Ingresso" style="width: 250px; height: 250px; margin: 0 auto; display: block;" />
            <p style="color: #666; font-size: 14px; margin-top: 10px;">Apresente este código na portaria nos dias do evento.</p>
          </div>

          <hr style="border-color: #27272a; margin: 30px 0;" />
          <p style="color: #a1a1aa; font-size: 14px; text-align: center;">Igreja MIR Moria - Av. Magalhães Barata, 45 - Aparecida</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 E-mail com QR Code enviado com sucesso para: ${lead.email}`);

    return NextResponse.json({ message: "Ingresso gerado e enviado!" });

  } catch (error) {
    console.error("Erro crítico no webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}