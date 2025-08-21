# AI Development Quick Start

**Essential guidelines for AI-assisted development in MyBitcoinFuture**

## 🚨 Critical Rules

### **Context Template (ALWAYS USE)**
```
Context: MyBitcoinFuture Organization
- Repository: [specific repository name]
- Current file: [specific file path]
- Related repositories: [list related repositories]
- Bitcoin network: [mainnet/testnet]
- Integration points: [describe cross-repository dependencies]
```

### **Repository Structure**
```
MyBitcoinFuture/
├── 📊 dashboard/              # Main application (API + Web + CLI + Desktop)
├── 🔌 plugins/                # Plugin ecosystem
├── ⚙️ core/                   # Infrastructure components
├── 📈 monitoring/             # Observability stack
└── 🚀 platform-manifests/     # Deployment configs
```

### **Technology Stack**
- **Backend:** Node.js, Express.js, SQLite/PostgreSQL
- **Frontend:** React, Material-UI, Vite, TradingView Lightweight Charts
- **Bitcoin:** Bitcoin Core RPC, Mempool API, BRK integration
- **Security:** JWT authentication, 2FA, role-based access control

## ⚡ Quick Commands

### **Dashboard Development**
```bash
git clone https://github.com/MyBitcoinFuture/dashboard.git
cd dashboard
npm run install:all
npm run dev
```

### **Services**
- **Web Dashboard:** http://localhost:3003
- **API Server:** http://localhost:3100
- **Grafana (System Monitoring):** http://localhost:3000

## 🔒 Security Requirements

### **Bitcoin Security**
- **xpub-only architecture** - No private key storage
- **Address validation** - All Bitcoin addresses validated
- **Network isolation** - Proper mainnet/testnet handling

### **Application Security**
- **Input sanitization** - All inputs validated
- **Authentication** - JWT + 2FA required
- **Authorization** - Role-based access control
- **Audit logging** - All operations logged

## 📝 Development Patterns

### **API Development**
```javascript
router.get('/wallet/:id/balance', 
  authMiddleware,
  rateLimitMiddleware,
  validateWalletId,
  async (req, res) => {
    try {
      const balance = await walletService.getBalance(req.params.id);
      return ApiResponse.success(res, { balance });
    } catch (error) {
      logger.error('Wallet balance error:', error);
      return ApiResponse.error(res, error.message, 500);
    }
  }
);
```

### **Frontend Development**
```javascript
const WalletCard = ({ wallet }) => {
  const { t, formatCurrency } = useTranslation();
  
  return (
    <div className="wallet-card">
      <h3>{t('wallet.name', { name: wallet.name })}</h3>
      <p>{t('wallet.balance')}: {formatCurrency(wallet.balance)}</p>
    </div>
  );
};
```

## 🚀 Next Steps

1. **Read the full guidelines:** [AI_GUIDELINES.md](AI_GUIDELINES.md)
2. **Check repository-specific docs:** Each repo has its own README
3. **Follow security checklist:** [SECURITY.md](SECURITY.md)
4. **Use development templates:** [TEMPLATES.md](TEMPLATES.md)

---

**Need help?** Check the full [AI Development Guidelines](AI_GUIDELINES.md) for comprehensive details.
