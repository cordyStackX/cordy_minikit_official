# Server session endpoints

The browser helpers call your application endpoints. They do not create or validate a session by themselves.

## Session verification endpoint

`cordy.jwt_verify()` defaults to `GET /api/auth/session`. The endpoint should inspect the application's HttpOnly cookie and return JSON:

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("cordy_session");

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Validate or look up the session on the server before returning user data.
  return NextResponse.json({
    authenticated: true,
    user: { subject: "wallet-or-user-id" },
  });
}
```

Use a different route by passing `{ endpoint: "/api/session" }`. A `401` or `403` response becomes `{ authenticated: false }`; other non-success responses throw an error.

## Logout endpoint

`cordy.jwt_disconnect()` defaults to `POST /api/auth/logout`. It expects your server to revoke the session and clear its cookie:

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("cordy_session");

  return NextResponse.json({ success: true });
}
```

If your cookie uses another name, delete that cookie instead. If your logout route is `/logout`, call:

```ts
await cordy.jwt_disconnect({ endpoint: "/logout" });
```

The helper also disconnects active EVM connectors and clears the Minikit Stellar wallet selection in the browser. It cannot revoke a server session unless the endpoint does so.

## Server-side JWT signing

The server export can sign a token after your server has already verified wallet ownership:

```ts
import { jwt_sign } from "@cordystackx/cordy_minikit/server";

const token = jwt_sign({
  subject: walletAddress,
  secret: process.env.CORDY_JWT_SECRET!,
  expiresInSeconds: 3600,
});
```

`jwt_sign()` signs claims; it does not verify SIWE, SEP-10, or any wallet signature. Keep `CORDY_JWT_SECRET` server-only and use at least 32 random characters. Never expose it as a `NEXT_PUBLIC_*` variable.
