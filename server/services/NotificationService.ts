/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sale, Raffle } from '../../src/types';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send digital ticket via WhatsApp Cloud API / Twilio
   */
  public async sendWhatsAppTicket(sale: Sale, raffle: Raffle): Promise<{ success: boolean; provider: string; details?: any }> {
    const whatsappToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const rawPhone = sale.phone || '';
    const formattedPhone = rawPhone.replace(/\D/g, '');

    if (!whatsappToken || !phoneId) {
      console.log(`[NotificationService] Simulación WhatsApp a +${formattedPhone}:
Hola ${sale.buyerName}, tu boleto #${sale.ticketNumber} para "${raffle.name}" ha sido confirmado exitosamente. Estado: ${sale.status}.`);
      return {
        success: true,
        provider: 'SIMULATED_LOCAL',
        details: 'API Keys de Meta WhatsApp no configuradas. Notificación simulada exitosamente en logs.'
      };
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: 'ticket_confirmation',
            language: { code: 'es' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: sale.buyerName },
                  { type: 'text', text: String(sale.ticketNumber) },
                  { type: 'text', text: raffle.name },
                ],
              },
            ],
          },
        }),
      });

      const data = await response.json();
      return { success: response.ok, provider: 'META_WHATSAPP_CLOUD_API', details: data };
    } catch (err: any) {
      console.error('[NotificationService] Error enviando WhatsApp:', err);
      return { success: false, provider: 'META_WHATSAPP_CLOUD_API', details: err.message };
    }
  }

  /**
   * Send transaction receipt / digital ticket email
   */
  public async sendEmailReceipt(sale: Sale, raffle: Raffle): Promise<{ success: boolean; provider: string }> {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!sale.email) {
      return { success: false, provider: 'NONE' };
    }

    if (!resendApiKey) {
      console.log(`[NotificationService] Simulación Email a ${sale.email}:
Recibo de compra boleto #${sale.ticketNumber} - Rifa: ${raffle.name}`);
      return { success: true, provider: 'SIMULATED_LOCAL' };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Rifas Pro <notificaciones@tu-dominio.com>',
          to: [sale.email],
          subject: `Boleto #${sale.ticketNumber} Confirmado - ${raffle.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #331055; border-radius: 12px; padding: 24px; background: #0c072b; color: #ffffff;">
              <h2 style="color: #c084fc; margin-top: 0;">¡Boleto Confirmado!</h2>
              <p>Hola <strong>${sale.buyerName}</strong>,</p>
              <p>Tu compra para la gran rifa <strong>${raffle.name}</strong> ha sido procesada con éxito.</p>
              <div style="background: #180b42; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 14px; color: #a855f7;">NÚMERO ASIGNADO:</span>
                <h1 style="font-size: 36px; color: #f43f5e; margin: 8px 0;">#${sale.ticketNumber}</h1>
                <p style="font-size: 12px; color: #94a3b8;">Estado: ${sale.status}</p>
              </div>
              <p style="font-size: 12px; color: #64748b;">Conserva este correo como comprobante digital oficial de tu compra.</p>
            </div>
          `,
        }),
      });

      return { success: res.ok, provider: 'RESEND_API' };
    } catch (err) {
      console.error('[NotificationService] Error enviando correo:', err);
      return { success: false, provider: 'RESEND_API' };
    }
  }
}

export const notificationService = NotificationService.getInstance();
