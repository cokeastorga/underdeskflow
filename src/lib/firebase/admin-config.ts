import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

/**
 * Initialize Firebase Admin SDK
 * Fails fast if required environment variables are missing.
 * This is intentional for security-critical infrastructure (Auth).
 */
function initAdmin(): App {
    // Reuse existing app (important for Next.js hot reload)
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const {
        FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY,
    } = process.env;

    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        throw new Error(
            "[Firebase Admin] Missing environment variables.\n" +
            "Required:\n" +
            "- FIREBASE_PROJECT_ID\n" +
            "- FIREBASE_CLIENT_EMAIL\n" +
            "- FIREBASE_PRIVATE_KEY\n"
        );
    }

    return initializeApp({
        credential: cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });
}

// Initialize immediately (fail fast if misconfigured)
adminApp = initAdmin();

// Export Admin services
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
