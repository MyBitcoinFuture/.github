# GitHub Quick Reference Card

**MyBitcoinFuture Organization Management**

---

## 🔑 Token Setup (One-Time)

```bash
# Create GitHub Personal Access Token
# Go to: GitHub Settings → Developer settings → Personal access tokens
# Permissions: repo, admin:org, admin:public_key, admin:repo_hook, admin:org_hook, workflow, write:discussion, read:user, read:project

# Set token (choose one method)
export GITHUB_TOKEN=ghp_your_token_here                    # Session only
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.bashrc # Persistent
echo "GITHUB_TOKEN=ghp_your_token_here" > .env             # Project-specific

# Verify token
echo $GITHUB_TOKEN | head -c 10
node scripts/test-github-access.js
```

---

## 📊 Build Monitoring

```bash
# Quick checks
./scripts/build-status.sh website                    # Public repo (no token needed)
./scripts/build-status.sh dashboard                  # Private repo (token required)
./scripts/build-status.sh all                        # All repositories

# Output formats
./scripts/build-status.sh dashboard --format table   # Default table format
./scripts/build-status.sh dashboard --format summary # Summary format
./scripts/build-status.sh dashboard --format json    # JSON for automation

# Continuous monitoring
./scripts/build-status.sh --watch --interval 30     # Watch all builds
./scripts/build-status.sh dashboard --watch          # Watch specific repo

# Specific workflows
./scripts/build-status.sh dashboard --workflow ci.yml
./scripts/build-status.sh dashboard --branch develop
```

---

## 🏗️ Organization Management

```bash
# Audit current state
node scripts/github-org-manager.js audit

# Set up teams
node scripts/github-org-manager.js setup-teams

# Configure repositories
node scripts/github-org-manager.js setup-repositories

# Create project boards
node scripts/github-org-manager.js setup-projects

# Validate configuration
node scripts/github-org-manager.js validate

# Generate report
node scripts/github-org-manager.js report
```

---

## 🔍 Diagnostics

```bash
# Test GitHub API access
node scripts/test-github-access.js

# Check token status
echo $GITHUB_TOKEN | head -c 10

# Check rate limits
node scripts/test-github-access.js

# Verify repository access
./scripts/build-status.sh website
./scripts/build-status.sh dashboard
```

---

## 🚨 Troubleshooting

```bash
# Token not working
echo $GITHUB_TOKEN | head -c 10                      # Check if set
node scripts/test-github-access.js                   # Test access
# Regenerate token if needed

# Rate limit exceeded
node scripts/test-github-access.js                   # Check limits
# Wait for reset or use authenticated access

# Repository access denied
node scripts/test-github-access.js                   # Check permissions
# Verify token has 'repo' scope for private repos

# Permission issues
node scripts/github-org-manager.js audit             # Check organization
# Verify team assignments and permissions
```

---

## 📋 Team Structure

**Core Development Team:**
- Admin access to all repositories
- Can create/manage repositories
- Can manage team memberships

**Partners Team:**
- Limited access to specific repos
- Read access to public repos
- Cannot modify org settings

**Beta Testers Team:**
- Read access to pre-release repos
- Can create issues/discussions
- No write access to code

**Community Contributors Team:**
- Write access to documentation
- Can submit PRs to open source
- Cannot merge without review

**Advisory Team:**
- Read access to strategic repos
- Can participate in discussions
- No code modification rights

---

## 📁 Repository Configuration

**Public Repositories:**
- website (landing page & docs)
- platform-manifests (deployment configs)

**Private Repositories:**
- dashboard (main application)
- plugins (plugin ecosystem)
- private-plugins (premium features)

**Repository Settings:**
- Professional descriptions
- Topics and tags
- Branch protection rules
- Merge settings (squash + merge)

---

## 📊 Project Boards

**marketplace-launch-pipeline:**
- Backlog → In Development → Testing → Marketplace Review → Published

**plugin-development-roadmap:**
- Planning → Development → Testing → Release

**partnership-coordination:**
- Discussion → Development → Testing → Integration → Launch

**community-management:**
- New Issues → Triage → In Progress → Community Review → Resolved

---

## 🔒 Security Checklist

- [ ] Token stored in environment variables only
- [ ] No tokens committed to repositories
- [ ] Token has minimal required permissions
- [ ] Token expiration set to 1 year
- [ ] Two-factor authentication enabled
- [ ] Branch protection rules active
- [ ] Security scanning enabled
- [ ] Audit logging configured

---

## 📈 Success Metrics

**Build Monitoring:**
- Build success rate > 95%
- Failure detection time < 5 minutes
- Rate limit efficiency > 90%

**Organization Management:**
- Team structure completeness 100%
- Repository configuration compliance 100%
- Project board utilization > 80%

**Security:**
- Zero security incidents
- 100% access control compliance
- Regular security audits passed

---

## 🎯 Quick Commands for Cursor Chat

```bash
# Check build status
./scripts/build-status.sh dashboard --format summary

# Monitor builds during development
./scripts/build-status.sh --watch --interval 30

# Audit organization
node scripts/github-org-manager.js audit

# Generate report
node scripts/github-org-manager.js report

# Test API access
node scripts/test-github-access.js
```

---

**🔒 Remember:** Never commit tokens or secrets to repositories!
**📊 Goal:** Professional, secure, optimized GitHub organization
**💰 ROI:** Maximum value from GitHub Teams $4/month subscription
