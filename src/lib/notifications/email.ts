import { Resend } from "resend";
import { Order } from "@/domains/orders/types";
import { logger } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY || "non_existent_key_for_build");

/**
 * Format currency specific to Chile
 */
function fmtCLP(amount: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(amount);
}

/**
 * Dispatches a transaction receipt to the end consumer.
 */
export async function sendCustomerReceipt(order: Partial<Order>, storeName: string, requestId?: string) {
    if (!order.customerEmail) {
        logger.info("Order missing customer email, skipping receipt", { requestId, orderId: order.id });
        return;
    }

    try {
        const emailHtml = `
            <h2>¡Gracias por tu compra en ${storeName}!</h2>
            <p>Tu orden <strong>#${order.id}</strong> ha sido confirmada y el pago está verificado.</p>
            <hr />
            <h3>Detalles de tu compra:</h3>
            <p>Total pagado: <strong>${fmtCLP(order.total || 0)}</strong></p>
            <p>Estado de la orden: <strong>CONFIRMADA (PAID)</strong></p>
            <br/>
            <p>Si tienes alguna consulta sobre tu envío, contacta directamente con la tienda.</p>
            <p><small>Este correo fue generado automáticamente por UnderDeskFlow SaaS</small></p>
        `;

        await resend.emails.send({
            from: "UnderDeskFlow Tiendas <no-reply@udf.cl>", // Note: requires DNS verification in prod
            to: [order.customerEmail],
            subject: `Recibo de tu compra (Orden #${order.id})`,
            html: emailHtml,
        });

        logger.info("Customer receipt email dispatched", { requestId, orderId: order.id, to: order.customerEmail });
    } catch (error) {
        logger.error("Failed to send customer receipt email", { requestId, orderId: order.id, error });
    }
}

/**
 * Alerts the store owner (Tenant) of a successful recent checkout.
 */
export async function sendTenantNewSaleAlert(order: Partial<Order>, tenantEmail: string, requestId?: string) {
    try {
        const orderTotal = order.total || 0;
        const fee = Math.round(orderTotal * 0.08); // Fixed 8% fee
        const netPayout = orderTotal - fee;
        
        const emailHtml = `
            <h2>¡Hola! Tienes una nueva venta</h2>
            <p>¡Una nueva transacción acaba de ser confirmada a través de tu Checkout Online Bricks!</p>
            <hr />
            <h3>Liquidación Financiera:</h3>
            <ul>
                <li>Orden ID: <strong>#${order.id}</strong></li>
                <li>Monto Cobrado: <strong>${fmtCLP(orderTotal)}</strong></li>
                <li>Comisión SaaS (8%): <strong>-${fmtCLP(fee)}</strong></li>
                <li>Neto a recibir: <strong>${fmtCLP(netPayout)}</strong></li>
            </ul>
            <p>Revisa esta orden completa en el Dashboard de tu Administrador.</p>
            <p><small>UnderDeskFlow SaaS</small></p>
        `;

        await resend.emails.send({
            from: "UnderDeskFlow SaaS <alertas@udf.cl>",
            to: [tenantEmail],
            subject: `Nueva Venta: ${fmtCLP(orderTotal)} (Orden #${order.id})`,
            html: emailHtml,
        });

        logger.info("Tenant new sale alert dispatched", { requestId, orderId: order.id, to: tenantEmail });
    } catch (error) {
        logger.error("Failed to send tenant new sale alert email", { requestId, orderId: order.id, error });
    }
}
/**
 * Sends a high-deliverability account verification email via Resend.
 */
export async function sendVerificationEmail(email: string, verificationLink: string, requestId?: string) {
    try {
        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #18181b;">
                <h2 style="color: #8b5cf6;">¡Bienvenido a UnderDesk Flow!</h2>
                <p>Estás a un paso de activar tu infraestructura operativa. Por favor, verifica tu correo electrónico haciendo clic en el botón de abajo:</p>
                <div style="margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Verificar Mi Cuenta</a>
                </div>
                <p style="font-size: 14px; color: #71717a;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p style="font-size: 12px; color: #a1a1aa; word-break: break-all;">${verificationLink}</p>
                <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 30px 0;" />
                <p style="font-size: 12px; color: #71717a;">Este enlace expirará pronto por razones de seguridad.</p>
                <p style="font-size: 10px; color: #a1a1aa;">UnderDeskFlow SaaS - Infraestructura Invisible</p>
            </div>
        `;

        await resend.emails.send({
            from: "UnderDeskFlow <no-reply@udf.cl>",
            to: [email],
            subject: "Verifica tu cuenta en UnderDesk Flow",
            html: emailHtml,
        });

        logger.info("Verification email dispatched via Resend", { requestId, to: email });
    } catch (error) {
        logger.error("Failed to send verification email", { requestId, email, error });
        throw error;
    }
}
