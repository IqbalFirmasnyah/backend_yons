// src/services/midtrans.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const midtransClient = require('midtrans-client');

export interface CreateTransactionDto {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
  };
  itemDetails: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  customExpiry?: {
    expiry_duration: number;
    unit: 'second' | 'minute' | 'hour' | 'day';
  };
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private snap: any;
  private coreApi: any;

  constructor(private configService: ConfigService) {
    const isProduction =
      String(this.configService.get<string>('MIDTRANS_IS_PRODUCTION') ?? '')
        .trim()
        .toLowerCase() === 'true';
  
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY')?.trim();
    const clientKey = this.configService.get<string>('MIDTRANS_CLIENT_KEY')?.trim();
  
    if (!serverKey || !clientKey) {
      this.logger.error('Midtrans keys are not configured. Please check your .env file or ConfigModule setup.');
      throw new Error('Midtrans API keys are missing. Please configure them in your environment.');
    }
  
    this.logger.debug(
      `[Midtrans] isProduction=${isProduction} serverKey=${serverKey.slice(0,8)}... clientKey=${clientKey.slice(0,8)}...`
    );
  
    this.snap = new midtransClient.Snap({ isProduction, serverKey, clientKey });
    this.coreApi = new midtransClient.CoreApi({ isProduction, serverKey, clientKey });
  }
  
  async createSnapTransaction(transactionData: CreateTransactionDto) {
    try {
      const toIDR = (n: number) => Math.round(n); // ✅ tambahkan helper di awal
  
      this.logger.debug(
        'Attempting to create Snap transaction with parameters:',
        JSON.stringify(transactionData, null, 2),
      );
  
      // ✅ gunakan helper untuk pastikan nilai IDR bulat
      const parameter = {
        transaction_details: {
          order_id: transactionData.orderId,
          gross_amount: toIDR(transactionData.grossAmount),
        },
        customer_details: {
          first_name: transactionData.customerDetails.firstName,
          last_name: transactionData.customerDetails.lastName || '',
          email: transactionData.customerDetails.email,
          phone: transactionData.customerDetails.phone,
        },
        item_details: transactionData.itemDetails.map((i) => ({
          ...i,
          price: toIDR(i.price),
        })),
        ...(transactionData.customExpiry && {
          custom_expiry: transactionData.customExpiry,
        }),
      };
  
      const transaction = await this.snap.createTransaction(parameter);
  
      this.logger.log(
        `[Snap Transaction Created] Order ID: ${transactionData.orderId}, ` +
          `Transaction Token: ${transaction.token}, ` +
          `Redirect URL: ${transaction.redirect_url}`,
      );
  
      return {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
      };
    } catch (error) {
      this.logger.error(
        'Error creating Snap transaction:',
        error.message,
        error.ApiResponse
          ? `Midtrans API Response: ${JSON.stringify(error.ApiResponse)}`
          : '',
      );
      throw new Error('Failed to create payment transaction');
    }
  }
  

  async getTransactionStatus(orderId: string) {
    try {
      const statusResponse = await this.coreApi.transaction.status(orderId);
      // It's a good idea to log the full status response here too
      this.logger.debug(`[Midtrans Status] Order ID: ${orderId}, Full Response: ${JSON.stringify(statusResponse, null, 2)}`);
      return statusResponse;
    } catch (error) {
      this.logger.error('Error getting transaction status:', error);
      throw new Error('Failed to get transaction status');
    }
  }

  async cancelTransaction(orderId: string) {
    try {
      const cancelResponse = await this.coreApi.transaction.cancel(orderId);
      return cancelResponse;
    } catch (error) {
      this.logger.error('Error canceling transaction:', error);
      throw new Error('Failed to cancel transaction');
    }
  }

  verifyWebhookSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string,
  ): boolean {
    // It's important to ensure this serverKey is the same one used for CoreApi and Snap
    // If you're consistently using the hardcoded values, this should be fine.
    // However, if you switch to ConfigService, make sure it matches.
    const serverKey = 'SB-Mid-server-TM8KWtr3sos_qEuNTKNhIYfo'; // Directly using the hardcoded key for consistency
    const crypto = require('crypto');

    const hash = crypto
      .createHash('sha512')
      .update(orderId + statusCode + grossAmount + serverKey)
      .digest('hex');

    return hash === signatureKey;
  }
}