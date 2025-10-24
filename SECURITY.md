# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Cordy MiniKit seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Disclose the vulnerability publicly before it has been addressed

### Please DO:

1. **Email us directly** at: security@cordystackx.com (or create a private security advisory on GitHub)
2. **Include the following information:**
   - Type of vulnerability
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected source code (tag/branch/commit or direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### What to expect:

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will send a more detailed response within 7 days indicating the next steps
- We will keep you informed of the progress towards a fix and announcement
- We may ask for additional information or guidance

## Security Best Practices

When using Cordy MiniKit in your projects:

### Private Keys

- ❌ **NEVER** expose private keys in frontend code
- ❌ **NEVER** use `NEXT_PUBLIC_` prefix for private keys
- ❌ **NEVER** commit private keys to version control
- ✅ **ALWAYS** use server-side environment variables
- ✅ **ALWAYS** use different keys for development and production
- ✅ **ALWAYS** rotate keys regularly

### Environment Variables

```bash
# ✅ SAFE - Server-side only
PRIVATE_KEY=0x...
SERVER_PRIVATE_KEY=0x...

# ❌ UNSAFE - Exposed to frontend
NEXT_PUBLIC_PRIVATE_KEY=0x...  # NEVER DO THIS!
```

### Network Endpoints

- Use authenticated RPC endpoints for production
- Implement rate limiting on backend endpoints
- Monitor RPC usage for anomalies
- Use multiple fallback RPCs for reliability

### Smart Contract Interactions

- Always validate addresses before transactions
- Implement transaction amount limits
- Add confirmation steps for large transfers
- Monitor gas prices to avoid excessive fees
- Validate token contract addresses

### Wallet Connections

- Only connect to trusted wallet providers
- Verify network IDs before transactions
- Implement connection timeouts
- Clear sensitive data on disconnect

## Known Security Considerations

### Server-Side Execution Only

Private key signing should **ONLY** be used in:
- Backend API routes
- Server actions
- Serverless functions
- Node.js scripts
- Cron jobs

**NEVER** in browser/frontend code.

### RPC Endpoint Security

- Public RPC endpoints may log requests
- Use private/authenticated RPCs for sensitive operations
- Consider using your own node for maximum privacy

### Gas Fee Management

- Wallet must have sufficient native currency for gas
- Implement gas price limits
- Monitor for gas price spikes
- Consider gas estimation before transactions

## Vulnerability Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release new security fix versions as soon as possible

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.x) and announced:

- In the GitHub Release notes
- In the CHANGELOG.md
- Via security advisory on GitHub
- On our website: https://cordy-stack-x.vercel.app/

## Acknowledgments

We appreciate the security research community's efforts in keeping our project safe. Security researchers who responsibly disclose vulnerabilities will be:

- Acknowledged in our security advisories (with permission)
- Listed in our CONTRIBUTORS.md file
- Eligible for rewards (case by case basis)

## Contact

For security-related questions or concerns:
- Email: cordovamarcgiestinlouis@gmail.com
- GitHub: https://github.com/cordyStackX/cordy_minikit_official/security

---

**Remember: Security is everyone's responsibility. When in doubt, ask!** 🔒
