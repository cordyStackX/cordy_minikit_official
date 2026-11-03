import { Keypair, Networks, StrKey, WebAuth } from "@stellar/stellar-sdk";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { SiweMessage } from "siwe";
import { generateSiweNonce } from "viem/siwe";

export type CreateCordyServerOptions = {
  signingSecret?: string;
  jwtKey?: string | Uint8Array;
  allowedDomains?: string[];
};

export type ConsResult =
  | { success: true; address?: string; chain?: "evm" | "stellar"; nonce?: string; transaction?: string; network_passphrase?: string; server_account?: string; home_domain?: string; web_auth_domain?: string; _setCookies?: string[] }
  | { success: false; message?: string; address?: undefined; chain?: undefined; _setCookies?: string[] };

const SESSION_COOKIE = "cordy_auth_session";
const CHALLENGE_COOKIE = "cordy_auth_challenge";
const CHALLENGE_TTL_SECONDS = 5 * 60;
const STELLAR_CHALLENGE_TTL_SECONDS = 15 * 60;
const SESSION_TTL_SECONDS = 24 * 60 * 60;

const fail = (message: string, cookies: string[] = []): ConsResult => ({
  success: false,
  message,
  ...(cookies.length ? { _setCookies: cookies } : {}),
});

function normalizeHost(value: string): string | undefined {
  const host = value.trim().toLowerCase();
  if (!host || /[\s,@/\\]/.test(host)) return undefined;
  try {
    const parsed = new URL(`http://${host}`);
    if (parsed.host !== host || parsed.username || parsed.password || parsed.pathname !== "/") return undefined;
    return parsed.host;
  } catch {
    return undefined;
  }
}

function requestHost(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-host");
  const raw = (forwarded || request.headers.get("host") || "").split(",")[0];
  return normalizeHost(raw);
}

function isLocalhost(host: string): boolean {
  return host === "localhost" || host.startsWith("localhost:") || host === "127.0.0.1" || host.startsWith("127.0.0.1:") || host === "[::1]" || host.startsWith("[::1]:");
}

function isSecureRequest(request: Request): boolean {
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim().toLowerCase();
  if (forwardedProtocol) return forwardedProtocol === "https";
  try { return new URL(request.url).protocol === "https:"; } catch { return false; }
}

function cookieValue(request: Request, name: string): string | undefined {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  for (const part of cookie.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try { return decodeURIComponent(part.slice(separator + 1).trim()); } catch { return undefined; }
  }
  return undefined;
}

function serializeCookie(name: string, value: string, maxAge: number, secure: boolean): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

function clearCookie(name: string, secure: boolean): string {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

async function readJson(request: Request): Promise<Record<string, unknown> | undefined> {
  try {
    const value: unknown = await request.json();
    return typeof value === "object" && value !== null ? value as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

export function createCordyServer(options: CreateCordyServerOptions) {
  const configuredSigningSecret = typeof options.signingSecret === "string" ? options.signingSecret.trim() : "";
  const configuredJwtKey = options.jwtKey;
  const configuredDomains = options.allowedDomains ? [...options.allowedDomains] : undefined;

  let jwtKeyChecked = false;
  let jwtKey: Uint8Array | undefined;
  let jwtKeyError: string | undefined;
  let signingKeypairChecked = false;
  let signingKeypair: Keypair | undefined;
  let signingKeypairError: string | undefined;
  let domainsChecked = false;
  let normalizedDomains: Set<string> | undefined;
  let domainsError: string | undefined;
  let warnedAboutRequestHost = false;

  function getJwtKey(): { success: true; key: Uint8Array } | { success: false; message: string } {
    if (!jwtKeyChecked) {
      jwtKeyChecked = true;
      if (typeof configuredJwtKey === "string") {
        const value = configuredJwtKey.trim();
        if (!value) jwtKeyError = "[cordy] jwtKey is missing";
        else jwtKey = new TextEncoder().encode(value);
      } else if (configuredJwtKey instanceof Uint8Array && configuredJwtKey.length > 0) {
        jwtKey = new Uint8Array(configuredJwtKey);
      } else {
        jwtKeyError = "[cordy] jwtKey is missing";
      }
      if (jwtKey && jwtKey.length < 32) {
        jwtKey = undefined;
        jwtKeyError = "[cordy] jwtKey must be at least 32 bytes";
      }
    }
    return jwtKey ? { success: true, key: jwtKey } : { success: false, message: jwtKeyError ?? "[cordy] jwtKey is missing" };
  }

  function getSigningKeypair(): { success: true; keypair: Keypair } | { success: false; message: string } {
    if (!signingKeypairChecked) {
      signingKeypairChecked = true;
      if (!configuredSigningSecret) signingKeypairError = "[cordy] signingSecret is missing";
      else {
        try { signingKeypair = Keypair.fromSecret(configuredSigningSecret); }
        catch { signingKeypairError = "[cordy] signingSecret is invalid"; }
      }
    }
    return signingKeypair ? { success: true, keypair: signingKeypair } : { success: false, message: signingKeypairError ?? "[cordy] signingSecret is missing" };
  }

  function resolveDomain(request: Request): { success: true; domain: string } | { success: false; message: string } {
    const host = requestHost(request);
    if (!host) return { success: false, message: "A valid request host is required." };
    if (!domainsChecked) {
      domainsChecked = true;
      if (configuredDomains) {
        if (configuredDomains.length === 0) domainsError = "allowedDomains must contain at least one host.";
        else {
          const values = configuredDomains.map(normalizeHost);
          if (values.some((value) => !value)) domainsError = "Every allowedDomains entry must be a valid host.";
          else normalizedDomains = new Set(values as string[]);
        }
      }
    }
    if (domainsError) return { success: false, message: domainsError };
    if (normalizedDomains && !normalizedDomains.has(host) && !isLocalhost(host)) {
      return { success: false, message: "This request host is not in the configured allowed domains." };
    }
    if (!configuredDomains && !warnedAboutRequestHost) {
      warnedAboutRequestHost = true;
      console.warn("[cordy] No allowedDomains configured; authentication domain is derived from the request host.");
    }
    return { success: true, domain: host };
  }

  async function signedToken(payload: JWTPayload, ttlSeconds: number, audience: string): Promise<{ success: true; token: string } | { success: false; message: string }> {
    const key = getJwtKey();
    if (!key.success) return key;
    try {
      const address = typeof payload.address === "string" ? payload.address : undefined;
      let jwt = new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuer("cordy-minikit")
        .setAudience(audience)
        .setIssuedAt()
        .setExpirationTime(`${ttlSeconds}s`);
      if (address) jwt = jwt.setSubject(address);
      return { success: true, token: await jwt.sign(key.key) };
    } catch {
      return { success: false, message: "[cordy] Unable to sign authentication token" };
    }
  }

  async function verifiedToken(token: string | undefined, audience: string): Promise<{ success: true; payload?: JWTPayload } | { success: false; message: string }> {
    const key = getJwtKey();
    if (!key.success) return key;
    if (!token) return { success: true };
    try {
      const { payload } = await jwtVerify(token, key.key, { algorithms: ["HS256"], issuer: "cordy-minikit", audience });
      return { success: true, payload };
    } catch {
      return { success: true };
    }
  }

  async function challenge(request: Request): Promise<ConsResult> {
    try {
      const resolved = resolveDomain(request);
      if (!resolved.success) return fail(resolved.message);
      const body = await readJson(request);
      if (!body) return fail("Request body must be a JSON object.");
      if (typeof body.account !== "string") return fail("A wallet account is required.");
      if (body.network !== "testnet" && body.network !== "public") return fail("Network must be testnet or public.");
      const jwt = getJwtKey();
      if (!jwt.success) return jwt;
      const secure = isSecureRequest(request);

      if (body.chain === "evm") {
        if (!/^0x[0-9a-fA-F]{40}$/.test(body.account)) return fail("A valid EVM account is required.");
        const nonce = generateSiweNonce();
        const token = await signedToken({ purpose: "challenge", chain: "evm", address: body.account, nonce, domain: resolved.domain, network: body.network }, CHALLENGE_TTL_SECONDS, "cordy-challenge");
        if (!token.success) return token;
        return { success: true, chain: "evm", nonce, _setCookies: [serializeCookie(CHALLENGE_COOKIE, token.token, CHALLENGE_TTL_SECONDS, secure)] };
      }

      if (body.chain !== "stellar") return fail("Unsupported wallet chain.");
      if (!StrKey.isValidEd25519PublicKey(body.account)) return fail("A valid Stellar account is required.");
      const server = getSigningKeypair();
      if (!server.success) return server;
      const passphrase = body.network === "testnet" ? Networks.TESTNET : Networks.PUBLIC;
      const transaction = WebAuth.buildChallengeTx(server.keypair, body.account, resolved.domain, STELLAR_CHALLENGE_TTL_SECONDS, passphrase, resolved.domain);
      const parsed = WebAuth.readChallengeTx(transaction, server.keypair.publicKey(), passphrase, resolved.domain, resolved.domain);
      const challengeHash = Buffer.from(parsed.tx.hash()).toString("hex");
      const token = await signedToken({ purpose: "challenge", chain: "stellar", address: body.account, challengeHash, domain: resolved.domain, network: body.network }, STELLAR_CHALLENGE_TTL_SECONDS, "cordy-challenge");
      if (!token.success) return token;
      return {
        success: true,
        chain: "stellar",
        transaction,
        network_passphrase: passphrase,
        server_account: server.keypair.publicKey(),
        home_domain: resolved.domain,
        web_auth_domain: resolved.domain,
        _setCookies: [serializeCookie(CHALLENGE_COOKIE, token.token, STELLAR_CHALLENGE_TTL_SECONDS, secure)],
      };
    } catch {
      return fail("Failed to create authentication challenge.");
    }
  }

  async function verify(request: Request): Promise<ConsResult> {
    const clearChallenge = [clearCookie(CHALLENGE_COOKIE, isSecureRequest(request))];
    try {
      const resolved = resolveDomain(request);
      if (!resolved.success) return fail(resolved.message, clearChallenge);
      const body = await readJson(request);
      if (!body) return fail("Request body must be a JSON object.", clearChallenge);
      const challengeToken = await verifiedToken(cookieValue(request, CHALLENGE_COOKIE), "cordy-challenge");
      if (!challengeToken.success) return fail(challengeToken.message, clearChallenge);
      const challenge = challengeToken.payload;
      if (!challenge || challenge.purpose !== "challenge" || challenge.domain !== resolved.domain) return fail("The authentication challenge is missing, expired, or invalid.", clearChallenge);

      let address: string;
      let chain: "evm" | "stellar";
      if (body.chain === "evm" && challenge.chain === "evm") {
        if (typeof body.address !== "string" || typeof body.message !== "string" || typeof body.signature !== "string" || body.network !== challenge.network) return fail("The EVM signature payload is incomplete or does not match its challenge.", clearChallenge);
        if (challenge.address !== body.address || !/^0x[0-9a-fA-F]{40}$/.test(body.address)) return fail("The EVM account does not match its challenge.", clearChallenge);
        const message = new SiweMessage(body.message);
        if (message.address.toLowerCase() !== body.address.toLowerCase() || message.domain !== resolved.domain || message.nonce !== challenge.nonce) return fail("The SIWE message does not match the challenge.", clearChallenge);
        const verified = await message.verify({ signature: body.signature, domain: resolved.domain, nonce: String(challenge.nonce), time: new Date().toISOString() }, { suppressExceptions: true });
        if (!verified.success) return fail("The SIWE signature is invalid or expired.", clearChallenge);
        address = body.address;
        chain = "evm";
      } else if (body.chain === "stellar" && challenge.chain === "stellar") {
        if (typeof body.address !== "string" || typeof body.signedXdr !== "string" || body.network !== challenge.network) return fail("The Stellar signature payload is incomplete or does not match its challenge.", clearChallenge);
        if (challenge.address !== body.address || !StrKey.isValidEd25519PublicKey(body.address)) return fail("The Stellar account does not match its challenge.", clearChallenge);
        const server = getSigningKeypair();
        if (!server.success) return fail(server.message, clearChallenge);
        const passphrase = body.network === "testnet" ? Networks.TESTNET : body.network === "public" ? Networks.PUBLIC : undefined;
        if (!passphrase) return fail("Network must be testnet or public.", clearChallenge);
        const serverAccount = server.keypair.publicKey();
        const parsed = WebAuth.readChallengeTx(body.signedXdr, serverAccount, passphrase, resolved.domain, resolved.domain);
        if (parsed.clientAccountID !== body.address || parsed.matchedHomeDomain !== resolved.domain) return fail("The SEP-10 challenge account or domain does not match.", clearChallenge);
        if (Buffer.from(parsed.tx.hash()).toString("hex") !== challenge.challengeHash) return fail("The SEP-10 response does not match the issued challenge.", clearChallenge);
        const timeBounds = parsed.tx.timeBounds;
        const now = Math.floor(Date.now() / 1000);
        if (!timeBounds || Number(timeBounds.minTime) > now || Number(timeBounds.maxTime) <= now || Number(timeBounds.maxTime) - Number(timeBounds.minTime) > STELLAR_CHALLENGE_TTL_SECONDS) return fail("The SEP-10 challenge is expired or has invalid time bounds.", clearChallenge);
        const verifiedSigners = WebAuth.verifyChallengeTxSigners(body.signedXdr, serverAccount, passphrase, [body.address], resolved.domain, resolved.domain);
        if (!verifiedSigners.includes(body.address)) return fail("The Stellar wallet signature is invalid.", clearChallenge);
        address = body.address;
        chain = "stellar";
      } else {
        return fail("The submitted wallet type does not match its challenge.", clearChallenge);
      }

      const session = await signedToken({ chain, address }, SESSION_TTL_SECONDS, "cordy-session");
      if (!session.success) return fail(session.message, clearChallenge);
      return {
        success: true,
        address,
        chain,
        _setCookies: [serializeCookie(SESSION_COOKIE, session.token, SESSION_TTL_SECONDS, isSecureRequest(request)), ...clearChallenge],
      };
    } catch {
      return fail("Wallet authentication could not be verified.", clearChallenge);
    }
  }

  async function disconnect(request: Request): Promise<ConsResult> {
    const secure = isSecureRequest(request);
    return { success: true, _setCookies: [clearCookie(SESSION_COOKIE, secure), clearCookie(CHALLENGE_COOKIE, secure)] };
  }

  async function session(request: Request): Promise<ConsResult> {
    const verified = await verifiedToken(cookieValue(request, SESSION_COOKIE), "cordy-session");
    if (!verified.success) return fail(verified.message);
    const payload = verified.payload;
    if (!payload || typeof payload.sub !== "string" || (payload.chain !== "evm" && payload.chain !== "stellar")) return { success: false };
    return { success: true, address: payload.sub, chain: payload.chain };
  }

  function response(result: ConsResult, status: number): Response {
    const { _setCookies, ...body } = result;
    const headers = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    for (const cookie of _setCookies ?? []) headers.append("set-cookie", cookie);
    return Response.json(body, { status, headers });
  }

  function routeFailure(message: string, status: number): Response {
    return response(fail(message), status);
  }

  type RouteContext = { params: Promise<{ action: string }> };
  type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;
  function handler() {
    const GET: RouteHandler = async (request, context) => {
      const { action } = await context.params;
      if (!["session", "challenge", "verify", "disconnect"].includes(action)) return routeFailure("Unknown authentication action.", 404);
      if (action !== "session") return routeFailure("Method not allowed.", 405);
      const result = await session(request);
      return response(result, result.success ? 200 : 401);
    };
    const POST: RouteHandler = async (request, context) => {
      const { action } = await context.params;
      if (!["session", "challenge", "verify", "disconnect"].includes(action)) return routeFailure("Unknown authentication action.", 404);
      if (action === "session") return routeFailure("Method not allowed.", 405);
      if (action === "challenge") {
        const result = await challenge(request);
        return response(result, result.success ? 200 : 400);
      }
      if (action === "verify") {
        const result = await verify(request);
        return response(result, result.success ? 200 : 401);
      }
      return response(await disconnect(request), 200);
    };
    const METHOD_NOT_ALLOWED: RouteHandler = async (_request, context) => {
      const { action } = await context.params;
      if (!["session", "challenge", "verify", "disconnect"].includes(action)) return routeFailure("Unknown authentication action.", 404);
      return routeFailure("Method not allowed.", 405);
    };
    return { GET, POST, PUT: METHOD_NOT_ALLOWED, PATCH: METHOD_NOT_ALLOWED, DELETE: METHOD_NOT_ALLOWED, OPTIONS: METHOD_NOT_ALLOWED, HEAD: METHOD_NOT_ALLOWED };
  }

  return { handler, session, challenge, verify, disconnect };
}
