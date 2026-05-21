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
      // Usa o seu próprio e-mail configurado no .env para evitar cair no SPAM
      from: `"Conferência VOU" <${process.env.SMTP_USER}>`,
      to: lead.email,
      subject: '🎫 Seu Ingresso Garantido: Conferência VOU',
      html: `
        <div style="font-family: sans-serif; background-color: #000000; color: #ffffff; padding: 40px 20px; border-radius: 15px; max-width: 600px; margin: auto;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://lp-conferencia.vercel.app/logo-vou.png" alt="Conferência VOU" style="max-width: 200px;" />
          </div>

          <h1 style="text-align: center; color: #ffffff; text-transform: uppercase;">Inscrição Confirmada!</h1>
          
          <p style="font-size: 18px; line-height: 1.6;">Olá, <strong>${lead.name}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #cccccc;">O Reino avança e a sua presença está garantida. Abaixo está o seu ingresso digital.</p>

          <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
            <p style="color: #000000; font-weight: bold; margin-bottom: 15px; font-size: 18px;">APRESENTE ESTE QR CODE NA ENTRADA</p>
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 5px solid #000000;" />
            <p style="color: #666666; font-size: 14px; margin-top: 15px;">Ingresso: <strong>${lead.ticketType.toUpperCase()}</strong></p>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #777777;">
            <p>Av. Magalhães Barata, 45 - Aparecida, Santarém - PA</p>
            <p>Em caso de dúvidas, responda a este e-mail.</p>
          </div>
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