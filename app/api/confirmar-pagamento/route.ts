import { supabaseAdmin } from "../../../lib/supabase";
import { NextResponse } from "next/server";
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json();

    if (!leadId) return NextResponse.json({ error: "Lead ID missing" }, { status: 400 });

    const { data: lead } = await supabaseAdmin.from("leads").select("*").eq("id", leadId).single();
    
    // Se não encontrou ou se já pagou, não faz nada para não duplicar e-mail
    if (!lead || lead.status === "comprador") return NextResponse.json({ message: "Lead já processado" });

    // 1. Atualiza o status para comprador
    await supabaseAdmin.from("leads").update({ status: "comprador" }).eq("id", leadId);
    console.log(`🟢 Pagamento Confirmado via Redirecionamento: ${lead.name}`);

    // 2. Gera o QR Code
    const qrData = JSON.stringify({ id: lead.id, nome: lead.name, ingresso: lead.ticketType });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      color: { dark: '#000000', light: '#FFFFFF' },
      width: 400
    });

    // 3. Envia o E-mail pela Titan HostGator
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
      from: `"Conferência VOU" <${process.env.SMTP_USER}>`,
      to: lead.email,
      subject: '🎫 Seu Ingresso Garantido: Conferência VOU',
      html: `
        <div style="font-family: sans-serif; background-color: #000000; color: #ffffff; padding: 40px 20px; border-radius: 15px; max-width: 600px; margin: auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://lift.mirmoria.com.br/logo-vou.png" alt="Conferência VOU" style="max-width: 200px;" />
          </div>
          <h1 style="text-align: center; color: #ffffff; text-transform: uppercase;">Inscrição Confirmada!</h1>
          <p style="font-size: 18px; line-height: 1.6;">Olá, <strong>${lead.name}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #cccccc;">O Reino avança e a sua presença está garantida. Abaixo está o seu ingresso digital.</p>
          <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
            <p style="color: #000000; font-weight: bold; margin-bottom: 15px; font-size: 18px;">APRESENTE ESTE QR CODE NA ENTRADA</p>
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 5px solid #000000;" />
            <p style="color: #666666; font-size: 14px; margin-top: 15px;">Ingresso: <strong>${lead.ticketType.toUpperCase()}</strong></p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: "Sucesso!" });

  } catch (error) {
    console.error("Erro no plano B:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}