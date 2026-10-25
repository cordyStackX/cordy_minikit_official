export type JwtSignOptions = {
    /** Wallet identity already verified by your server's SIWE or Stellar challenge flow. */
    subject: string;
    /** Server-only secret. Use a unique random secret with at least 32 characters. */
    secret: string;
    expiresInSeconds?: number;
    issuer?: string;
    claims?: Record<string, unknown>;
};
/**
 * Create an HS256 JWT for a wallet identity that your server has already authenticated.
 * This signs claims only; it does not validate SIWE/SEP-10 signatures or wallet ownership.
 */
export declare function jwt_sign({ subject, secret, expiresInSeconds, issuer, claims, }: JwtSignOptions): string;
export declare const cordy: {
    jwt_sign: typeof jwt_sign;
};
//# sourceMappingURL=jwt.d.ts.map