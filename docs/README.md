# MyBitcoinFuture Documentation

**Essential documentation for the MyBitcoinFuture organization**

## 🚀 Quick Start

- **[AI Development Quick Start](ai/QUICK_START.md)** - Get started with AI-assisted development
- **[Security Guidelines](ai/SECURITY.md)** - Security requirements and best practices
- **[Development Templates](ai/TEMPLATES.md)** - Code templates and patterns

## 📚 Core Documentation

### **AI Development**
- **[AI Guidelines](AI_GUIDELINES.md)** - Comprehensive AI development standards
- **[AI Agent Plans](AI_AGENT_PLAN_1_BACKEND_INFRASTRUCTURE.md)** - Backend infrastructure upgrade plan
- **[AI Agent Plans](AI_AGENT_PLAN_2_FRONTEND_UX_PLATFORMS.md)** - Frontend and UX upgrade plan

### **Repository Documentation**
- **[Dashboard Documentation](https://github.com/MyBitcoinFuture/dashboard/tree/main/docs)** - Main application docs
- **[Plugins Documentation](https://github.com/MyBitcoinFuture/plugins/blob/main/README.md)** - Plugin ecosystem
- **[Core Documentation](https://github.com/MyBitcoinFuture/core/blob/main/README.md)** - Infrastructure components
- **[Monitoring Documentation](https://github.com/MyBitcoinFuture/monitoring/blob/main/README.md)** - Observability stack
- **[Platform-Manifests Documentation](https://github.com/MyBitcoinFuture/platform-manifests/blob/main/README.md)** - Deployment configs

## 🏗️ Architecture

### **Technology Stack**
- **Backend:** Node.js, Express.js, SQLite/PostgreSQL
- **Frontend:** React, Material-UI, Vite, TradingView Lightweight Charts
- **Bitcoin:** Bitcoin Core RPC, Mempool API, BRK integration
- **Security:** JWT authentication, 2FA, role-based access control
- **Monitoring:** Prometheus, Grafana (system monitoring only)

### **Repository Structure**
```
MyBitcoinFuture/
├── 📊 dashboard/              # Main application (API + Web + CLI + Desktop)
├── 🔌 plugins/                # Plugin ecosystem
├── ⚙️ core/                   # Infrastructure components
├── 📈 monitoring/             # Observability stack
└── 🚀 platform-manifests/     # Deployment configs
```

## 🔒 Security

- **xpub-only architecture** - No private key storage
- **Multi-signature support** - Advanced wallet security
- **Enterprise authentication** - JWT + 2FA + RBAC
- **Comprehensive audit logging** - Full operation tracking

## 📊 Features

- **Multi-wallet management** - Track unlimited wallets
- **Real-time analytics** - Portfolio performance & risk assessment
- **Compliance reporting** - Regulatory & audit requirements
- **Plugin ecosystem** - Extensible functionality
- **Multi-platform** - Web, Desktop, CLI, API

## 🚀 Development

### **Quick Setup**
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

## 📋 Contributing

See [CONTRIBUTING.md](https://github.com/MyBitcoinFuture/.github/blob/main/CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](https://github.com/MyBitcoinFuture/.github/blob/main/LICENSE) for details.

---

**Built with ❤️ by the MyBitcoinFuture team**

*Empowering organizations to manage their Bitcoin treasury with confidence and security.*
