import { supabaseAdmin } from "../../../lib/supabase";
import { NextResponse } from "next/server";
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const leadId = body.order_nsu || body.metadata?.leadId;

    if (!leadId) return NextResponse.json({ error: "Sem ID do pedido" }, { status: 400 });

    const { data: mainLead } = await supabaseAdmin.from("leads").select("*").eq("id", leadId).single();
    if (!mainLead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

    const { data: extraLeads } = await supabaseAdmin.from("leads").select("*").eq("origin", mainLead.id);
    const allLeads = [mainLead, ...(extraLeads || [])];

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    for (const lead of allLeads) {
      await supabaseAdmin.from("leads").update({ status: "comprador" }).eq("id", lead.id);

      // 1. Gera o QR Code e transforma em bytes de imagem para o PDF
      const qrData = JSON.stringify({ id: lead.id, nome: lead.name, ingresso: lead.ticketType });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 300 });
      const qrImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

      // 2. Monta o Ingresso em PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // Tamanho A4 Padrão
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const pngImage = await pdfDoc.embedPng(qrImageBytes);

      // Desenhando os Textos no PDF
      page.drawText('CONFERÊNCIA VOU', { x: 50, y: 760, size: 28, font: fontBold });
      page.drawText('O REINO AVANÇA', { x: 50, y: 740, size: 14, font: fontNormal });

      page.drawText(`Participante: ${lead.name}`, { x: 50, y: 680, size: 16, font: fontBold });
      page.drawText(`Ingresso: ${lead.ticketType.toUpperCase()}`, { x: 50, y: 660, size: 14, font: fontNormal });
      page.drawText('Local: Igreja MIR Moria - Santarém/PA', { x: 50, y: 640, size: 12, font: fontNormal });

      // Centralizando o QR Code no PDF
      page.drawImage(pngImage, {
        x: 50,
        y: 400,
        width: 200,
        height: 200,
      });

      // Regras (Inspirado no padrão profissional)
      page.drawText('Importante:', { x: 50, y: 350, size: 14, font: fontBold });
      page.drawText('1. Não compartilhe seu ingresso com outras pessoas.', { x: 50, y: 325, size: 11, font: fontNormal });
      page.drawText('2. Seu ingresso pode ser apresentado pela tela do celular ou impresso.', { x: 50, y: 305, size: 11, font: fontNormal });
      page.drawText('3. Evite fraudes. Uso exclusivo e nominal.', { x: 50, y: 285, size: 11, font: fontNormal });

      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);

      // 3. O Corpo do E-mail (Limpo e rápido de carregar)
      const mailOptions = {
        from: `"Conferência VOU" <lift@mirmoria.com.br>`,
        to: lead.email,
        subject: '🎫 Seu Ingresso Garantido: Conferência VOU',
        html: `
          <div style="font-family: sans-serif; background-color: #fafafa; color: #111; padding: 40px 20px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #ddd;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0; color: #000;">Tá na mão, ${lead.name.split(' ')[0]}!</h1>
            </div>
            <p style="font-size: 16px; line-height: 1.6; text-align: center;">Seguem em anexo os seus ingressos para a <strong>Conferência VOU</strong>.</p>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #eee; text-align: center;">
              <p style="margin: 5px 0;"><strong>Evento:</strong> Conferência VOU | O Reino Avança</p>
              <p style="margin: 5px 0;"><strong>Local:</strong> Santarém / PA</p>
              <p style="margin: 5px 0;"><strong>Lote:</strong> ${lead.ticketType.toUpperCase()}</p>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center;">Abra o arquivo PDF em anexo para visualizar o seu QR Code oficial de entrada.</p>
          </div>
        `,
        // 4. A MÁGICA DO ANEXO!
        attachments: [
          {
            filename: `Ingresso-VOU-${lead.name.replace(/\s+/g, '-')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ PDF gerado e enviado para: ${lead.email}`);
    }

    return NextResponse.json({ message: "Todos os PDFs processados!" });

  } catch (error) {
    console.error("Erro crítico no webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}