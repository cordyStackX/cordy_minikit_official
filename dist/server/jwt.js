import { createHmac, randomUUID } from "node:crypto";
function base64url(value) {
    return Buffer.from(value).toString("base64url");
}
/**
 * Create an HS256 JWT for a wallet identity that your server has already authenticated.
 * This signs claims only; it does not validate SIWE/SEP-10 signatures or wallet ownership.
 */
export function jwt_sign({ subject, secret, expiresInSeconds = 60 * 60, issuer = "cordy-minikit", claims = {}, }) {
    if (!subject.trim())
        throw new Error("JWT subject is required");
    if (secret.length < 32)
        throw new Error("JWT secret must be at least 32 characters");
    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 60 * 60 * 24 * 30) {
        throw new Error("JWT expiry must be between 1 second and 30 days");
    }
    for (const reserved of ["sub", "iat", "exp", "iss", "jti"]) {
        if (reserved in claims)
            throw new Error(`JWT claim '${reserved}' is managed by Cordy Minikit`);
    }
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64url(JSON.stringify({
        ...claims,
        iss: issuer,
        sub: subject,
        iat: now,
        exp: now + expiresInSeconds,
        jti: randomUUID(),
    }));
    const unsignedToken = `${header}.${payload}`;
    const signature = createHmac("sha256", secret).update(unsignedToken).digest("base64url");
    return `${unsignedToken}.${signature}`;
}
export const cordy = { jwt_sign };
