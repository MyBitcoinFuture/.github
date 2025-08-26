# Contributing to MyBitcoinFuture

This document provides guidelines for contributing to MyBitcoinFuture.

## 🎯 Overview

MyBitcoinFuture is a comprehensive Bitcoin treasury management ecosystem. We welcome contributions from the community to help improve our platform.

## 🏗️ Repository Structure

Our organization consists of multiple repositories:

- **[dashboard](https://github.com/MyBitcoinFuture/dashboard)** - Main application
- **[plugins](https://github.com/MyBitcoinFuture/plugins)** - Plugin ecosystem
- **[website](https://github.com/MyBitcoinFuture/website)** - Organization website
- **[private-plugins](https://github.com/MyBitcoinFuture/private-plugins)** - Private plugin ecosystem
- **[platform-manifests](https://github.com/MyBitcoinFuture/platform-manifests)** - Platform configurations

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** 2.30.0 or higher
- **Docker** (optional, for containerized development)

### Development Setup

1. **Fork the repository** you want to contribute to
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/REPOSITORY_NAME.git
   cd REPOSITORY_NAME
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
5. **Start development**:
   ```bash
   npm run dev
   ```

## 📝 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the coding standards below
- Write tests for functionality
- Update documentation as needed
- Ensure all tests pass

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add feature description"
```

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request using the provided template.

## 📋 Coding Standards

### JavaScript/TypeScript

- Use **ESLint** and **Prettier** for code formatting
- Follow **JSDoc** standards for documentation
- Use **TypeScript** where applicable
- Prefer **async/await** over Promises
- Use **const** and **let** instead of **var**

### Code Style

```javascript
// Good
const createWallet = async (xpub, label) => {
  try {
    const wallet = await walletService.create(xpub, label);
    return wallet;
  } catch (error) {
    logger.error('Failed to create wallet:', error);
    throw error;
  }
};

// Bad
function createWallet(xpub, label) {
  return walletService.create(xpub, label)
    .then(wallet => wallet)
    .catch(error => {
      console.log(error);
      throw error;
    });
}
```

### File Naming

- Use **kebab-case** for file names: `wallet-service.js`
- Use **PascalCase** for classes: `WalletService`
- Use **camelCase** for functions and variables: `createWallet`

### Directory Structure

```
src/
├── services/           # Business logic services
├── repositories/       # Data access layer
├── models/            # Data models
├── utils/             # Utility functions
├── middleware/        # Express middleware
├── routes/            # API routes
└── config/            # Configuration files
```

## 🧪 Testing

### Test Structure

- **Unit tests** - Test individual functions and classes
- **Integration tests** - Test component interactions
- **E2E tests** - Test complete user workflows
- **Performance tests** - Test system performance
- **Security tests** - Test security measures

### Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
npm run test:security

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

```javascript
describe('WalletService', () => {
  let walletService;

  beforeEach(() => {
    walletService = new WalletService();
  });

  describe('createWallet', () => {
    it('should create a wallet with valid xpub', async () => {
      const xpub = 'xpub1234567890abcdef';
      const label = 'Test Wallet';

      const wallet = await walletService.createWallet(xpub, label);

      expect(wallet.xpub).toBe(xpub);
      expect(wallet.label).toBe(label);
      expect(wallet.id).toBeDefined();
    });

    it('should throw error for invalid xpub', async () => {
      const invalidXpub = 'invalid-xpub';

      await expect(
        walletService.createWallet(invalidXpub, 'Test')
      ).rejects.toThrow('Invalid xpub format');
    });
  });
});
```

## 📚 Documentation

### Code Documentation

- Use **JSDoc** comments for all public functions and classes
- Include parameter types and return types
- Provide usage examples for complex functions

```javascript
/**
 * Creates a Bitcoin wallet
 * @param {string} xpub - Extended public key
 * @param {string} label - Wallet label
 * @param {Object} options - Additional options
 * @param {string} options.network - Network (mainnet/testnet)
 * @returns {Promise<Wallet>} Created wallet object
 * @throws {Error} If xpub is invalid
 * @example
 * const wallet = await createWallet('xpub123...', 'My Wallet', { network: 'mainnet' });
 */
async function createWallet(xpub, label, options = {}) {
  // Implementation
}
```

### README Updates

- Update README files when adding features
- Include setup instructions for dependencies
- Document any breaking changes
- Add examples for functionality

## 🔒 Security Guidelines

### Security Best Practices

- **Never commit secrets** (API keys, passwords, private keys)
- **Validate all inputs** from external sources
- **Use parameterized queries** to prevent SQL injection
- **Sanitize user inputs** to prevent XSS
- **Follow the principle of least privilege**
- **Log security events** for audit purposes

### Security Testing

- Run security tests before submitting PRs
- Use tools like **npm audit** to check dependencies
- Test for common vulnerabilities (OWASP Top 10)
- Verify authentication and authorization

## 🚀 Pull Request Process

### Before Submitting

1. **Ensure all tests pass**
2. **Update documentation** as needed
3. **Follow coding standards**
4. **Test your changes** thoroughly
5. **Check for security issues**

### Pull Request Template

Use the provided pull request template and fill out all relevant sections:

- **Description** of changes
- **Type of change** (bug fix, feature, etc.)
- **Repository** affected
- **Related issues**
- **Testing completed**
- **Checklist items**

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Security review** for sensitive changes
4. **Documentation review** for new features
5. **Final approval** and merge

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Check documentation** for solutions
3. **Try to reproduce** the issue
4. **Gather relevant information**

### Bug Report Template

Use the provided issue template and include:

- **Clear description** of the bug
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details**
- **Screenshots** if applicable

## 💡 Feature Requests

### Before Requesting

1. **Check if the feature already exists**
2. **Consider the impact** on existing functionality
3. **Think about implementation** complexity
4. **Consider security implications**

### Feature Request Template

Use the provided issue template and include:

- **Problem statement**
- **Proposed solution**
- **Alternative solutions**
- **Implementation ideas**
- **Use cases**

## 🤝 Community Guidelines

### Code of Conduct

- **Be respectful** and inclusive
- **Help others** learn and grow
- **Provide constructive feedback**
- **Follow project guidelines**
- **Report inappropriate behavior**

### Communication

- **Use clear language** in issues and PRs
- **Be patient** with maintainers and contributors
- **Ask questions** when unsure
- **Share knowledge** with the community

## 📋 Checklist

Before submitting your contribution, ensure you have:

- [ ] **Forked the repository**
- [ ] **Created a feature branch**
- [ ] **Followed coding standards**
- [ ] **Written tests** for new functionality
- [ ] **Updated documentation**
- [ ] **Run all tests** successfully
- [ ] **Checked for security issues**
- [ ] **Used appropriate templates**
- [ ] **Provided clear descriptions**
- [ ] **Included relevant information**

## 🆘 Getting Help

### Resources

- **[Documentation](https://github.com/MyBitcoinFuture/.github)** - Organization documentation
- **[Issues](https://github.com/MyBitcoinFuture/dashboard/issues)** - Bug reports and feature requests
- **[Discussions](https://github.com/MyBitcoinFuture/dashboard/discussions)** - Community discussions
- **[AI Guidelines](docs/AI_GUIDELINES.md)** - AI development guidelines

### Contact

- **General Support:** support@mybitcoinfuture.com
- **Security Issues:** security@mybitcoinfuture.com
- **Development Questions:** Create an issue or discussion

## 🙏 Acknowledgments

Thank you for contributing to MyBitcoinFuture! Your contributions help make Bitcoin treasury management more accessible and secure for everyone.

---

**Happy coding! 🚀** 