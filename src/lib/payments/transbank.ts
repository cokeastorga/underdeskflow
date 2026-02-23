import { WebpayPlus } from 'transbank-sdk';
import { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';

// For production, keys should be loaded from env. For dev, we use integration keys.
const isProduction = process.env.NODE_ENV === 'production';

export const webpay = new WebpayPlus.Transaction(
    new Options(
        isProduction ? (process.env.TRANSBANK_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS) : IntegrationCommerceCodes.WEBPAY_PLUS,
        isProduction ? (process.env.TRANSBANK_API_KEY || IntegrationApiKeys.WEBPAY) : IntegrationApiKeys.WEBPAY,
        isProduction ? Environment.Production : Environment.Integration
    )
);
