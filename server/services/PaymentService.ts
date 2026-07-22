/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dbInstance } from '../db';

export interface PaymentGatewayConfig {
  mercadoPagoAccessToken?: string;
  stripeSecretKey?: string;
  wompiPublicKey?: string;
  wompiIntegritySecret?: string;
}

export class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Process incoming webhook payload from MercadoPago
   */
  public async handleMercadoPagoWebhook(payload: any): Promise<{ success: boolean; message: string; saleId?: string }> {
    try {
      console.log('[PaymentService] Processing MercadoPago Webhook:', payload);
      
      const dataId = payload?.data?.id || payload?.id;

      if (!dataId) {
        return { success: false, message: 'ID de pago no proporcionado en webhook.' };
      }

      const externalReference = payload?.external_reference || payload?.data?.external_reference;
      
      if (externalReference) {
        const sale = dbInstance.sales.find(s => s.id === externalReference);
        if (sale) {
          await dbInstance.updateSaleStatus('system', sale.id, 'PAID');
          return { success: true, message: `Venta #${sale.ticketNumber} marcada como PAGADA automáticamente.`, saleId: sale.id };
        }
      }

      return { success: true, message: 'Webhook recibido y procesado.' };
    } catch (err: any) {
      console.error('[PaymentService] MercadoPago Webhook error:', err);
      return { success: false, message: err.message || 'Error procesando webhook.' };
    }
  }

  /**
   * Process incoming webhook payload from Stripe
   */
  public async handleStripeWebhook(payload: any): Promise<{ success: boolean; message: string; saleId?: string }> {
    try {
      console.log('[PaymentService] Processing Stripe Webhook event:', payload?.type);

      if (payload?.type === 'payment_intent.succeeded' || payload?.type === 'checkout.session.completed') {
        const object = payload.data?.object;
        const saleId = object?.metadata?.saleId || object?.client_reference_id;

        if (saleId) {
          const sale = dbInstance.sales.find(s => s.id === saleId);
          if (sale) {
            await dbInstance.updateSaleStatus('system', sale.id, 'PAID');
            return { success: true, message: `Venta #${sale.ticketNumber} aprobada vía Stripe.`, saleId: sale.id };
          }
        }
      }

      return { success: true, message: 'Evento Stripe procesado correctamente.' };
    } catch (err: any) {
      console.error('[PaymentService] Stripe Webhook error:', err);
      return { success: false, message: err.message || 'Error procesando webhook Stripe.' };
    }
  }

  /**
   * Process incoming webhook payload from Wompi
   */
  public async handleWompiWebhook(payload: any): Promise<{ success: boolean; message: string; saleId?: string }> {
    try {
      console.log('[PaymentService] Processing Wompi Webhook event:', payload?.event);

      if (payload?.event === 'transaction.updated') {
        const transaction = payload?.data?.transaction;
        if (transaction?.status === 'APPROVED') {
          const reference = transaction.reference;
          const sale = dbInstance.sales.find(s => s.id === reference);
          if (sale) {
            await dbInstance.updateSaleStatus('system', sale.id, 'PAID');
            return { success: true, message: `Venta #${sale.ticketNumber} aprobada vía Wompi.`, saleId: sale.id };
          }
        }
      }

      return { success: true, message: 'Webhook Wompi procesado.' };
    } catch (err: any) {
      console.error('[PaymentService] Wompi Webhook error:', err);
      return { success: false, message: err.message || 'Error en Webhook Wompi.' };
    }
  }
}

export const paymentService = PaymentService.getInstance();
