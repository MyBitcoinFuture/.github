# AI Development Security Guidelines

**Security requirements for AI-assisted development in MyBitcoinFuture**

## 🔒 Critical Security Rules

### **Bitcoin Security (ALWAYS REQUIRED)**
- **xpub-only architecture** - Never store private keys
- **Address validation** - Validate all Bitcoin addresses
- **Network isolation** - Proper mainnet/testnet handling
- **Transaction signing** - Only with hardware wallets

### **Authentication & Authorization**
- **JWT tokens** - Secure token management
- **2FA required** - Multi-factor authentication
- **Role-based access** - Granular permissions
- **Session management** - Secure session handling

### **Data Protection**
- **Input sanitization** - Validate all inputs
- **SQL injection prevention** - Use parameterized queries
- **XSS prevention** - Sanitize user content
- **CSRF protection** - Cross-site request forgery prevention

## 🚨 Security Anti-Patterns (NEVER DO)

### **Bitcoin Security**
```javascript
// ❌ NEVER DO - Private key storage
const privateKey = "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS";
localStorage.setItem('privateKey', privateKey);

// ✅ ALWAYS DO - xpub only
const xpub = "xpub6C...";
const address = deriveAddress(xpub, 0);
```

### **Authentication**
```javascript
// ❌ NEVER DO - Plain text passwords
const password = req.body.password;
const user = await db.findUser({ password });

// ✅ ALWAYS DO - Hash passwords
const hashedPassword = await bcrypt.hash(password, 12);
const user = await db.findUser({ passwordHash: hashedPassword });
```

### **Input Validation**
```javascript
// ❌ NEVER DO - No validation
const walletId = req.params.id;
const wallet = await getWallet(walletId);

// ✅ ALWAYS DO - Validate inputs
const walletId = validateWalletId(req.params.id);
const wallet = await getWallet(walletId);
```

## 📋 Security Checklist

### **Before Every Commit**
- [ ] **No private keys** in code or config
- [ ] **Input validation** on all endpoints
- [ ] **Authentication** required for sensitive operations
- [ ] **Authorization** checks implemented
- [ ] **Error messages** don't leak sensitive data
- [ ] **Logs sanitized** of sensitive information

### **API Security**
- [ ] **Rate limiting** implemented
- [ ] **CORS** properly configured
- [ ] **HTTPS** in production
- [ ] **Security headers** set
- [ ] **Request validation** on all endpoints

### **Frontend Security**
- [ ] **XSS prevention** implemented
- [ ] **CSRF tokens** used
- [ ] **Content Security Policy** configured
- [ ] **Secure cookies** with proper flags
- [ ] **No sensitive data** in localStorage

## 🔍 Security Testing

### **Automated Security Checks**
```bash
# Run security tests
npm run test:security

# Check for vulnerabilities
npm audit

# Run linting with security rules
npm run lint:security
```

### **Manual Security Review**
- [ ] **Authentication flows** tested
- [ ] **Authorization** verified
- [ ] **Input validation** tested
- [ ] **Error handling** reviewed
- [ ] **Logs checked** for sensitive data

## 🚨 Security Incident Response

### **If Security Issue Found**
1. **Immediate action** - Fix or mitigate
2. **Document** - Record the issue and fix
3. **Test** - Verify the fix works
4. **Review** - Check for similar issues
5. **Update** - Security guidelines if needed

### **Reporting Security Issues**
- **Email:** security@mybitcoinfuture.com
- **GitHub:** Private security issue
- **Response time:** 24 hours for critical issues

---

**Remember:** Security is everyone's responsibility. When in doubt, ask for review.
