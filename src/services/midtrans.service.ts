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
    // const isProduction = process.env.MIDTRANS_IS_PRODUCTION
    // const serverKey = process.env.MIDTRANS_SERVER_KEY
    // const clientKey = process.env.MIDTRANS_CLIENT_KEY

    const isProduction = false; 
    const serverKey = 'SB-Mid-server-TM8KWtr3sos_qEuNTKNhIYfo';
    const clientKey = 'SB-Mid-client-pQvIg9dYoy5mliYR';

    if (!serverKey || !clientKey) {
        this.logger.error('Midtrans keys are not configured. Please check your .env file or ConfigModule setup.');
        throw new Error('Midtrans API keys are missing. Please configure them in your environment.');
    }

    // Initialize Snap API
    this.snap = new midtransClient.Snap({
      isProduction,
      serverKey,
      clientKey,
    });

    // Initialize Core API
    this.coreApi = new midtransClient.CoreApi({
      isProduction,
      serverKey,
      clientKey,
    });
  }

  async createSnapTransaction(transactionData: CreateTransactionDto) {
    try {
        this.logger.debug('Attempting to create Snap transaction with parameters:', JSON.stringify(transactionData, null, 2));
        
        const parameter = {
            transaction_details: {
                order_id: transactionData.orderId,
                gross_amount: transactionData.grossAmount,
            },
            customer_details: {
                first_name: transactionData.customerDetails.firstName,
                last_name: transactionData.customerDetails.lastName || '',
                email: transactionData.customerDetails.email,
                phone: transactionData.customerDetails.phone,
            },
            item_details: transactionData.itemDetails,
            ...(transactionData.customExpiry && {
                custom_expiry: transactionData.customExpiry,
            }),
            // NOTE: Add notification URL here if you want to set it per transaction
            // callbacks: {
            //   finish: "YOUR_APP_FRONTEND_REDIRECT_URL_AFTER_PAYMENT",
            //   error: "YOUR_APP_FRONTEND_REDIRECT_URL_ON_ERROR",
            //   pending: "YOUR_APP_FRONTEND_REDIRECT_URL_ON_PENDING",
            // }
        };

        const transaction = await this.snap.createTransaction(parameter);
        
        // --- ADDED LOGGING HERE ---
        this.logger.log(
            `[Snap Transaction Created] Order ID: ${transactionData.orderId}, ` +
            `Transaction Token: ${transaction.token}, ` +
            `Redirect URL: ${transaction.redirect_url}`
        );
        // At this point, the transaction status is typically 'pending' or 'settlement'
        // if it's an instant payment method.
        // To get the definitive status from Midtrans, you'd use getTransactionStatus()
        // which is usually triggered by a webhook or a manual status check.
        // For immediate verification after creation, you could call getTransactionStatus here
        // but it's not strictly necessary as the payment process itself is ongoing.
        // Let's add an example of how you *could* immediately check, but warn against overdoing it.
        try {
            // const initialStatus = await this.getTransactionStatus(transactionData.orderId);
            // this.logger.log(`[Snap Transaction Initial Status Check] Order ID: ${transactionData.orderId}, Status: ${initialStatus.transaction_status}`);
            // Note: For actual 'settlement' status, you'll primarily rely on webhooks,
            // as the payment flow often involves user interaction (e.g., bank transfer, QRIS scan).
        } catch (statusError) {
            this.logger.warn(`Could not get initial transaction status for ${transactionData.orderId}: ${statusError.message}`);
        }
        // --- END ADDED LOGGING ---
      
        return {
            token: transaction.token,
            redirect_url: transaction.redirect_url,
        };
    } catch (error) {
        this.logger.error(
            'Error creating Snap transaction:',
            error.message,
            error.ApiResponse ? `Midtrans API Response: ${JSON.stringify(error.ApiResponse)}` : '',
            error.httpStatus ? `HTTP Status: ${error.httpStatus}` : '',
            error.rawHttpClientResponse ? `Raw Response: ${error.rawHttpClientResponse}` : ''
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