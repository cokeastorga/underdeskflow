import { adminDb } from "@/lib/firebase/admin-config";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogContext {
    storeId?: string;
    orderId?: string;
    paymentIntentId?: string;
    worker?: string;
    channel?: string;
    requestId?: string; // Correlation ID spanning multiple logs
    error?: any;
    [key: string]: any;
}

async function writeSystemError(message: string, context: LogContext) {
    try {
        if (!adminDb) return;
        const ref = adminDb.collection("system_errors").doc();
        await ref.set({
            event: "system.failure",
            message,
            context: JSON.stringify(context),
            storeId: context?.storeId || "unknown",
            worker: context?.worker || "unknown",
            timestamp: Date.now()
        });
    } catch (e) {
        // Ultimate fallback if DB is down.
        console.error("FATAL: Could not write to system_errors", e);
    }
}

function log(level: LogLevel, message: string, context: LogContext = {}) {
    // 1. Extract and format the actual error if present to avoid [Object object] serialization issues.
    let errorStack = undefined;
    let errorMessage = undefined;
    
    if (context.error) {
        if (context.error instanceof Error) {
            errorStack = context.error.stack;
            errorMessage = context.error.message;
        } else {
            errorMessage = String(context.error);
        }
        delete context.error; // remove from raw so we can flatten it nicely
    }

    const entry = {
        level,
        message,
        ...context,
        errorMessage,
        errorStack,
        timestamp: new Date().toISOString(),
    };

    // 2. Structured JSON Output to Stdout/Stderr
    const jsonStr = JSON.stringify(entry);
    
    if (level === "error") {
        console.error(jsonStr);
        // 3. For critical errors, save them to Firestore so Admins can query them easily without diving into Vercel interfaces.
        writeSystemError(message, entry);
    } else if (level === "warn") {
        console.warn(jsonStr);
    } else if (level === "debug") {
        console.debug(jsonStr);
    } else {
        console.log(jsonStr);
    }
}

export const logger = {
    info: (msg: string, ctx?: LogContext) => log("info", msg, ctx),
    warn: (msg: string, ctx?: LogContext) => log("warn", msg, ctx),
    error: (msg: string, ctx?: LogContext) => log("error", msg, ctx),
    debug: (msg: string, ctx?: LogContext) => log("debug", msg, ctx),
};
