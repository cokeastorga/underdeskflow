/**
 * Secret Manager helper.
 * In production: uses Google Cloud Secret Manager.
 * In development: falls back to environment variables.
 */

const IS_PROD = process.env.NODE_ENV === "production" && process.env.GOOGLE_CLOUD_PROJECT;

async function getClient() {
    const { SecretManagerServiceClient } = await import("@google-cloud/secret-manager");
    return new SecretManagerServiceClient();
}

/**
 * Retrieve a secret value by name.
 * Name format: "sumup_{storeId}_apikey"
 */
export async function getSecret(name: string): Promise<string | null> {
    if (!IS_PROD) {
        // Dev fallback: env var with safe key format
        const envKey = `SECRET_${name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
        return process.env[envKey] ?? null;
    }
    try {
        const client = await getClient();
        const project = process.env.GOOGLE_CLOUD_PROJECT;
        const [version] = await client.accessSecretVersion({
            name: `projects/${project}/secrets/${name}/versions/latest`,
        });
        return version.payload?.data?.toString() ?? null;
    } catch {
        return null;
    }
}

/**
 * Store a secret value, creating or adding a new version (enables key rotation).
 */
export async function setSecret(name: string, value: string): Promise<void> {
    if (!IS_PROD) {
        // In dev we just log — cannot write env vars at runtime
        console.log(`[secrets] DEV: would store secret "${name}"`);
        return;
    }
    const client = await getClient();
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const secretPath = `projects/${project}/secrets/${name}`;

    // Ensure secret exists
    try {
        await client.getSecret({ name: secretPath });
    } catch {
        await client.createSecret({
            parent: `projects/${project}`,
            secretId: name,
            secret: { replication: { automatic: {} } },
        });
    }

    // Add new version (this is the rotation mechanism)
    await client.addSecretVersion({
        parent: secretPath,
        payload: { data: Buffer.from(value, "utf8") },
    });
}

/**
 * Delete all versions of a secret (full purge).
 */
export async function deleteSecret(name: string): Promise<void> {
    if (!IS_PROD) {
        console.log(`[secrets] DEV: would delete secret "${name}"`);
        return;
    }
    const client = await getClient();
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    try {
        await client.deleteSecret({ name: `projects/${project}/secrets/${name}` });
    } catch {
        // Secret may not exist — ignore
    }
}
