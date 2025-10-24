# Contributing to Cordy MiniKit

Thank you for your interest in contributing to Cordy MiniKit! 🎉

We welcome contributions from the community. This document will guide you through the contribution process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Submission Guidelines](#submission-guidelines)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project follows a simple [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to be respectful and constructive. Please report any concerns to cordovamarcgiestinlouis@gmail.com.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed** and what you expected
- **Include your environment details** (OS, Node version, package version)

**Bug Report Template:**

```markdown
## Description
[Clear description of the bug]

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
[What you expected to happen]

## Actual Behavior
[What actually happened]

## Environment
- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04, Arch Linux x86_64]
- Node.js Version: [e.g., 18.17.0]
- Package Version: [e.g., 1.4.5]
- Browser (if applicable): [e.g., Chrome 120]

## Additional Context
[Any other relevant information]
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List any alternatives** you've considered

### Improving Documentation

Documentation improvements are always welcome!

- Fix typos or grammatical errors
- Add examples or use cases
- Improve clarity of explanations
- Translate documentation
- Add missing documentation

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (recommended) or npm
- Git

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cordy_minikit_official.git
   cd cordy_minikit_official
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/cordyStackX/cordy_minikit_official.git
   ```

4. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

5. **Create a branch:**
   ```bash
   git checkout -b feature/my-new-feature
   # or
   git checkout -b fix/bug-description
   ```

### Project Structure

```
cordy_minikit/
├── chains/          # Chain definitions
├── components/      # React components
├── config/          # Configuration files
├── controllers/     # Business logic
├── css/             # Styles
├── docs/            # Documentation
├── examples/        # Example code
├── hooks/           # React hooks
├── types/           # TypeScript types
├── utils/           # Utility functions
└── index.ts         # Main export
```

### Building

```bash
pnpm run build
# or
npm run build
```

This will:
1. Compile TypeScript to JavaScript
2. Generate type declarations
3. Copy CSS files to dist/

### Testing Your Changes

1. **Build the package:**
   ```bash
   pnpm run build
   ```

2. **Test in a local project:**
   ```bash
   # In your test project
   npm install /path/to/cordy_minikit
   ```

3. **Test specific features:**
   - Wallet connection
   - Token transfers
   - Network switching
   - Private key signing (backend only)

### Running Examples

```bash
# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run example scripts
node examples/simple-send-script.js
```

## Submission Guidelines

### Before Submitting

- [ ] Test your changes thoroughly
- [ ] Update documentation if needed
- [ ] Add examples if adding new features
- [ ] Ensure code follows our coding standards
- [ ] Run build successfully
- [ ] Update CHANGELOG.md (for significant changes)

### Submitting a Pull Request

1. **Keep your fork up to date:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run final checks:**
   ```bash
   pnpm run build
   ```

3. **Push to your fork:**
   ```bash
   git push origin feature/my-new-feature
   ```

4. **Create a Pull Request** on GitHub

5. **Fill out the PR template:**
   - Describe your changes
   - Reference any related issues
   - Include screenshots (if UI changes)
   - List breaking changes (if any)

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define types for function parameters and return values
- Avoid `any` type when possible
- Use interfaces for object shapes

### Code Style

```typescript
// ✅ Good
export interface TransactionOptions {
  usePrivateKey?: boolean;
  privateKey?: string;
  rpcUrl?: string;
}

export async function CordyStackTrans(
  address: string,
  amount: number,
  options?: TransactionOptions
): Promise<boolean> {
  // Implementation
}

// ❌ Avoid
export async function CordyStackTrans(address, amount, options) {
  // Missing types
}
```

### Naming Conventions

- **Files:** `kebab-case.ts` or `PascalCase.tsx` for React components
- **Variables/Functions:** `camelCase`
- **Types/Interfaces:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **React Components:** `PascalCase`

### Error Handling

```typescript
// ✅ Good - Clear error messages
if (!address) {
  console.error("❌ Recipient address not found");
  return false;
}

// ✅ Good - Helpful suggestions
if (err.code === "INSUFFICIENT_FUNDS") {
  console.error("💡 Not enough gas or token balance");
}

// ❌ Avoid - Generic errors
if (!address) {
  throw new Error("Error");
}
```

### Console Logging

Use emojis and clear messages:

```typescript
✅ Success
❌ Error  
⚠️ Warning
🔍 Searching
🔐 Security
💰 Balance
🚀 Action
⏳ Waiting
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding tests
- `chore:` Maintenance tasks

### Examples

```bash
feat(network): add Fantom network support

- Add Fantom mainnet and testnet configs
- Update network detector to include Fantom
- Add Fantom examples to documentation

Closes #123
```

```bash
fix(transaction): handle insufficient gas error

- Add specific error message for insufficient gas
- Check native balance before transaction
- Provide helpful suggestions to users

Fixes #456
```

## Pull Request Process

1. **Update Documentation:** If you change APIs, update the relevant docs
2. **Add Examples:** For new features, include usage examples
3. **Update CHANGELOG:** For significant changes
4. **Pass Review:** Address reviewer feedback
5. **Squash Commits:** Clean up commit history if requested
6. **Wait for Approval:** Maintainers will review and merge

### PR Checklist

- [ ] Code builds without errors
- [ ] Changes are tested
- [ ] Documentation is updated
- [ ] Examples are added (if applicable)
- [ ] Commit messages follow convention
- [ ] No breaking changes (or documented)
- [ ] CHANGELOG updated (if significant)

## Questions?

- 📫 Email: cordovamarcgiestinlouis@gmail.com
- 🐛 Issues: [Report Issues](https://github.com/cordyStackX/cordy_minikit_official/issues)

## Recognition

If the project grows, contributors will be:
- Mentioned in release notes
- Acknowledged in project documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Cordy MiniKit! Together we make Web3 development easier.** 🚀
