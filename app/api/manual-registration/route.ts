import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    const { name, email, phone, ticketType, pin } = await request.json();

    // Barreira de segurança: Apenas a sua equipe pode gerar ingressos manuais
    const STAFF_PIN = process.env.CHECKIN_PIN || "vou2026";
    if (pin !== STAFF_PIN) {
      return NextResponse.json({ error: "Acesso Negado: Senha incorreta" }, { status: 401 });
    }

    if (!name || !email) {
      return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
    }

    // 1. Grava no banco de dados como Venda Concluída (comprador)
    const { data: lead, error: dbError } = await supabaseAdmin.from("leads").insert([{ 
      name, 
      email, 
      phone: phone || "Não informado", 
      ticketType, 
      status: "comprador", 
      origin: "presencial" 
    }]).select().single();

    if (dbError) throw dbError;

    // 2. Cria o QR Code de Check-in
    const checkinUrl = `https://lift.mirmoria.com.br/checkin?id=${lead.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(checkinUrl, { margin: 1, width: 300 });
    const qrImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // 3. Monta o Ingresso em PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pngImage = await pdfDoc.embedPng(qrImageBytes);

    page.drawText('CONFERÊNCIA VOU', { x: 50, y: 760, size: 28, font: fontBold });
    page.drawText('O REINO AVANÇA', { x: 50, y: 740, size: 14, font: fontNormal });
    page.drawText(`Participante: ${lead.name}`, { x: 50, y: 680, size: 16, font: fontBold });
    page.drawText(`Ingresso: ${lead.ticketType.toUpperCase()}`, { x: 50, y: 660, size: 14, font: fontNormal });
    page.drawText('Local: Igreja MIR Moria - Santarém/PA', { x: 50, y: 640, size: 12, font: fontNormal });
    page.drawImage(pngImage, { x: 50, y: 400, width: 200, height: 200 });

    page.drawText('Importante:', { x: 50, y: 350, size: 14, font: fontBold });
    page.drawText('1. Não compartilhe seu ingresso com outras pessoas.', { x: 50, y: 325, size: 11, font: fontNormal });
    page.drawText('2. Seu ingresso pode ser apresentado pela tela do celular ou impresso.', { x: 50, y: 305, size: 11, font: fontNormal });
    page.drawText('3. Evite fraudes. Uso exclusivo e nominal.', { x: 50, y: 285, size: 11, font: fontNormal });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // 4. Dispara o E-mail pelo Resend
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"Conferência VOU" <lift@mirmoria.com.br>`,
      to: lead.email,
      subject: '🎫 Seu Ingresso Garantido: Conferência VOU',
      html: `
        <div style="font-family: sans-serif; background-color: #fafafa; color: #111; padding: 40px 20px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #ddd;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #000;">Tá na mão, ${lead.name.split(' ')[0]}!</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; text-align: center;">Sua inscrição manual foi concluída com sucesso!</p>
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #eee; text-align: center;">
            <p style="margin: 5px 0;"><strong>Evento:</strong> Conferência VOU | O Reino Avança</p>
            <p style="margin: 5px 0;"><strong>Lote:</strong> ${lead.ticketType.toUpperCase()}</p>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">Abra o arquivo PDF em anexo para visualizar o seu QR Code oficial de entrada.</p>
        </div>
      `,
      attachments: [{ filename: `Ingresso-VOU-${lead.name.replace(/\s+/g, '-')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Inscrição manual realizada e ingresso enviado!" });
  } catch (error) {
    console.error("Erro na inscrição manual:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}