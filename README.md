# MyBitcoinFuture Organization

**⚠️ IMPORTANT: This is a GitHub ORGANIZATION, not a monorepo with submodules!**

Each directory in this organization represents a **separate GitHub repository** that you need to work with individually.

## 🏗️ Organization Structure

```
MyBitcoinFuture/ (Organization Root)
├── 📊 dashboard/              # Main application repository
│   ├── api/                  # Express.js API server
│   ├── web/                  # React web interface  
│   ├── cli/                  # Command-line interface
│   ├── desktop/              # Electron desktop app
│   └── shared/               # Shared utilities
├── 🔌 plugins/                # Plugin ecosystem repository
├── ⚙️ .github/                 # Organization documentation & configs
├── 🚀 platform-manifests/     # Platform deployment configs
└── 📁 profile/                # Organization profile
```

## 🚨 CRITICAL: How to Work with This Organization

### **NEVER treat these as submodules!**
- Each directory is a **separate Git repository**
- You must **commit and push to each repo individually**
- Changes in one repo do NOT automatically sync to others

### **Correct Workflow:**

1. **Make changes in a specific repo:**
   ```bash
   cd dashboard
   # Make your changes
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Repeat for each repo you modified:**
   ```bash
   cd ../plugins
   git add .
   git commit -m "Plugin changes"
   git push origin main
   ```

3. **Update organization docs:**
   ```bash
   cd ../.github
   git add .
   git commit -m "Update organization docs"
   git push origin main
   ```

## 📚 Repository Descriptions

### **dashboard/** - Main Application
- **Purpose**: Complete Bitcoin treasury management application
- **Tech Stack**: Node.js, Express.js, React, SQLite/PostgreSQL
- **Key Features**: 
  - Bitcoin Core RPC integration
  - Portfolio management
  - Advanced analytics
  - Security features
- **Status**: ✅ Production ready

### **plugins/** - Plugin Ecosystem  
- **Purpose**: Extensible plugin system for dashboard
- **Tech Stack**: Node.js plugin framework
- **Key Features**:
  - IFTTT automation
  - Accounting integrations
  - Compliance tools
  - White-label solutions
- **Status**: ✅ Active development

### **platform-manifests/** - Deployment Configs
- **Purpose**: Platform-specific deployment configurations
- **Platforms**: Start9, Docker, Kubernetes, Production
- **Key Features**:
  - Docker Compose files
  - Kubernetes manifests
  - Platform-specific configs
  - CI/CD pipelines
- **Status**: ✅ Production ready

### **.github/** - Organization Management
- **Purpose**: Organization documentation, templates, and configs
- **Contents**:
  - AI development guidelines
  - Security documentation
  - Integration guides
  - Organization policies
- **Status**: ✅ Active maintenance

## 🔧 Development Guidelines

### **Cross-Repository Development**
When working across multiple repos:

1. **Always specify which repo you're working in**
2. **Consider dependencies between repos**
3. **Update documentation in .github/ when making org-wide changes**
4. **Test integrations between repos**

### **Commit Messages**
Use consistent commit message format:
```
[repo-name] Brief description

Detailed description of changes
- Change 1
- Change 2

Status: [status]
```

### **Branch Strategy**
- `main` - Production ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

## 🚀 Quick Start

### **Clone All Repos:**
```bash
# Clone the organization (this gives you the structure)
git clone https://github.com/MyBitcoinFuture/MyBitcoinFuture.git
cd MyBitcoinFuture

# Each directory is already a git repo, but you might need to set remotes
cd dashboard
git remote -v  # Check if remote is set
# If not set: git remote add origin https://github.com/MyBitcoinFuture/dashboard.git
```

### **Development Setup:**
```bash
# Start with dashboard (main app)
cd dashboard
npm install
npm run dev

# In another terminal, work on plugins
cd ../plugins
npm install
npm run dev
```

## 📋 Common Tasks

### **Adding a New Feature Across Repos:**
1. **Plan**: Which repos need changes?
2. **Implement**: Make changes in each repo
3. **Test**: Test integrations between repos
4. **Commit**: Commit to each repo individually
5. **Push**: Push each repo to GitHub
6. **Document**: Update .github/ docs if needed

### **Fixing a Bug:**
1. **Identify**: Which repo has the bug?
2. **Fix**: Make the fix in the specific repo
3. **Test**: Test the fix
4. **Commit & Push**: To the specific repo
5. **Update**: Documentation if needed

### **Organization-Wide Changes:**
1. **Plan**: What needs to change across repos?
2. **Implement**: Changes in each affected repo
3. **Test**: Cross-repo integration testing
4. **Commit & Push**: Each repo individually
5. **Document**: Update .github/ documentation

## 🛡️ Security Notes

- **Never commit credentials** to any repo
- **Use environment variables** for sensitive data
- **Follow security guidelines** in .github/docs/security.md
- **Review changes** before pushing to production repos

## 📞 Support

- **Issues**: Create in the specific repo where the issue occurs
- **Organization Issues**: Create in .github/ repo
- **Cross-Repo Issues**: Create in .github/ repo and reference affected repos

---

**Remember: This is an ORGANIZATION, not a monorepo! Each directory is a separate repository that needs individual attention.** 