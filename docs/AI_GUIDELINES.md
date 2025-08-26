# MyBitcoinFuture Organization AI Development Guidelines

**Status:** Organization-Wide AI Development Standards  
**Scope:** Complete MyBitcoinFuture Ecosystem with GitHub Teams Optimization

## 🚨 CRITICAL: Multi-Repository Organization Structure

**⚠️ THIS IS NOT A MONOREPO OR SUBMODULES - THESE ARE SEPARATE REPOSITORIES**

### Organization Structure
```
MyBitcoinFuture Organization (GitHub Organization)
├── 📊 dashboard/              # Main application repository
├── 🌐 website/                # Landing page & documentation repository  
├── 🔌 plugins/                # Plugin ecosystem repository
├── 🔐 private-plugins/        # Private plugin ecosystem repository
├── 🚀 platform-manifests/     # Platform deployment repository
└── 📋 .github/                # Organization-level files (NOT a repo)
```

### Key Rules for Multi-Repo Development
1. **Each directory is a separate Git repository** with its own `.git` folder
2. **NEVER initialize git in the organization root** - each repo manages its own git
3. **Always specify which repository** you're working in
4. **Cross-repository dependencies** must be handled via package.json or imports
5. **The `.github` folder** contains organization-level documentation, not code

## 🔑 CRITICAL: GitHub API Access Requirements

### Required API Permissions for AI Operations
**🚨 CRITICAL FOR AI AGENTS: GitHub API access is required for build monitoring and organization management**

**Personal Access Token Required Permissions:**
```
repo (Full control of private repositories)
admin:org (Full control of orgs and teams, read and write org projects)
admin:public_key (Full control of user public keys)
admin:repo_hook (Full control of repository hooks)
admin:org_hook (Full control of organization hooks)
workflow (Update GitHub Action workflows)
write:discussion (Write access to team discussions)
read:user (Read access to user profile information)
read:project (Read access to projects)
```

### Secure Token Management
**🚨 CRITICAL: NEVER commit tokens or secrets to repositories**

**Token Setup Instructions:**
1. **Create GitHub Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with permissions listed above
   - Set expiration to 1 year
   - Save token securely

2. **Set Token Environment Variable:**
   ```bash
   # Set token for current session
   export GITHUB_TOKEN=your_token_here
   
   # Or add to shell profile for persistence
   echo 'export GITHUB_TOKEN=your_token_here' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Verify Token Access:**
   ```bash
   # Test token access
   node .github/scripts/github/test-github-access.js
   
   # Test build monitoring
   ./.github/scripts/github/build-status.sh dashboard
   ```

### AI Agent GitHub Operations
**🚨 CRITICAL FOR AI AGENTS: Always verify token access before operations**

**Before ANY GitHub API operations:**
1. **Check token availability**: `echo $GITHUB_TOKEN | head -c 10` (should show first 10 chars)
2. **Test API access**: Run `node scripts/test-github-access.js`
3. **Verify repository access**: Check if target repositories are accessible
4. **Confirm rate limits**: Ensure sufficient API quota remaining

**GitHub API Operation Patterns:**
```bash
# Build monitoring operations
./.github/scripts/github/build-status.sh [repository] [options]
./.github/scripts/github/build-status.sh --watch --interval 30

# Organization management operations
node .github/scripts/github/github-org-manager.js [operation] [options]

# Repository management operations
node .github/scripts/github/github-repo-manager.js [operation] [options]
```

## 🏗️ GitHub Teams Optimization Framework

### Organization Management Capabilities
**AI agents can perform these organization management tasks:**

1. **Repository Management:**
   - Create and configure repositories
   - Set up branch protection rules
   - Configure repository settings
   - Manage repository visibility

2. **Team Management:**
   - Create and configure teams
   - Manage team memberships
   - Set up team permissions
   - Configure repository access

3. **Project Management:**
   - Create and configure project boards
   - Set up automated workflows
   - Manage milestones and issues
   - Configure issue templates

4. **Build Monitoring:**
   - Monitor workflow runs across repositories
   - Track build statuses and failures
   - Provide real-time build notifications
   - Generate build analytics reports

### Professional Configuration Standards
**AI agents must maintain these professional standards:**

1. **Repository Configuration:**
   - Professional descriptions and topics
   - Proper README files with clear structure
   - Security policies and code of conduct
   - License files and contribution guidelines

2. **Team Structure:**
   - Core Development Team (admin access)
   - Partners Team (limited access)
   - Beta Testers Team (read access)
   - Community Contributors Team (PR access)
   - Advisory Team (read access)

3. **Project Management:**
   - Marketplace Launch Pipeline
   - Plugin Development Roadmap
   - Partnership Coordination
   - Community Management

4. **Automation Workflows:**
   - Issue template automation
   - PR review automation
   - Build status monitoring
   - Release management automation

## 🔒 CRITICAL SAFETY RULES

### Cursor Agent Common Pain Points
**🚨 CRITICAL FOR CURSOR AGENTS: Common issues and solutions**

**Context Loss Issues:**
- **Problem**: Cursor agents forget which repository they're in
- **Solution**: Always check `pwd && git remote -v` before starting
- **Problem**: Agents lose track of file paths across repos
- **Solution**: Use absolute paths and specify repository context

**Import/Path Confusion:**
- **Problem**: Wrong import paths between repositories
- **Solution**: Always verify repository structure before imports
- **Problem**: Relative path confusion in multi-repo setup
- **Solution**: Use absolute paths or clear relative paths from repo root

**Git Confusion:**
- **Problem**: Agents try to initialize git in organization root
- **Solution**: Each repo manages its own git - never init in root
- **Problem**: Agents forget which repo they're committing to
- **Solution**: Always check `git status` and `git remote -v`

**Process Management:**
- **Problem**: Agents leave blocking processes running
- **Solution**: Always use timeouts and process cleanup
- **Problem**: Agents don't check for existing processes
- **Solution**: Always run process cleanup before starting servers

**GitHub API Access Issues:**
- **Problem**: Agents try to access GitHub API without token
- **Solution**: Always check `echo $GITHUB_TOKEN` before API operations
- **Problem**: Rate limit exceeded during operations
- **Solution**: Check rate limits with `node scripts/test-github-access.js`
- **Problem**: Repository access denied
- **Solution**: Verify token permissions and repository visibility

### File & Directory Deletion Prevention
**🚨 CRITICAL: NEVER DELETE FILES OR FOLDERS WITHOUT EXPLICIT USER PERMISSION**

**ABSOLUTE RULES:**
1. **NEVER delete any files unless user explicitly says "delete this specific file"**
2. **NEVER interpret "clean up" as "delete"** - always ask for clarification
3. **NEVER delete documentation files** - even if they seem "excessive"
4. **NEVER delete source code files** without explicit permission
5. **NEVER delete configuration files** without explicit permission
6. **When user says "clean up"** - ask: "Do you want me to organize/move files, or actually delete them?"

**Before ANY deletion (even if user says "delete"):**
1. **Ask for explicit confirmation**: "Are you sure you want me to delete [specific file]?"
2. **Verify the file/folder is safe to delete** - check if it's:
   - Generated/cache files (safe)
   - Temporary files (safe)
   - Actually unused code (verify first)
   - Part of a larger system (DANGEROUS)

3. **Check for dependencies** - search for imports/requires
4. **Confirm it's not moved elsewhere** - check if functionality exists elsewhere
5. **Use `git status`** to see what's tracked vs untracked
6. **When in doubt, ASK** - don't assume anything is safe to delete

**Safe deletions (ONLY with explicit permission):**
- `node_modules/` (regenerated by npm install)
- `.cache/` directories
- `*.log` files
- `dist/` or `build/` directories (regenerated)
- Temporary files with clear patterns

**NEVER DELETE (unless user explicitly says "delete this specific file"):**
- Source code files without verification
- Configuration files
- Documentation files (.md files)
- Test files
- Any `.js`, `.jsx`, `.ts`, `.tsx`, `.md` files
- Archive folders
- User-created content
- Any file the user might have created

**CRITICAL: When user says "clean up" or "organize":**
- **ALWAYS ask**: "Do you want me to organize/move files to a different location, or actually delete them?"
- **Default to organizing/moving** rather than deleting
- **Create archive folders** instead of deleting
- **Move files to .github/docs/archive/** if they seem like they should be archived

**Cursor-Specific File Safety:**
- **Always verify file exists** before editing: `ls -la path/to/file`
- **Check git status** before deleting: `git status path/to/file`
- **Use `git restore`** to undo changes: `git restore path/to/file`
- **Backup before major changes**: `cp file.js file.js.backup`
- **NEVER delete files without explicit user permission**
- **ALWAYS ask for confirmation** before any file deletion
- **When user says "clean up"** - ask if they want organization or deletion
- **Default to moving/organizing** rather than deleting

## 🎯 Essential AI Development Guidelines

### Context Management
**Always include in prompts:**
```
Context: MyBitcoinFuture Organization
- Current Repository: [specific repo name]
- Current File: [specific file path]
- Related Repositories: [list related repos]
- Task Scope: [what you're trying to accomplish]
- GitHub API Access: [token status and permissions]
```

### Repository-Specific Patterns

#### Dashboard Repository
- **Location**: `/dashboard/`
- **Purpose**: Main Bitcoin treasury management application
- **Key Files**: `api/`, `web/`, `cli/`, `desktop/`
- **Security**: JWT auth, xpub-only, no private keys
- **GitHub Access**: Private repository, requires token

#### Website Repository  
- **Location**: `/website/`
- **Purpose**: Landing page and public documentation
- **Key Files**: `src/components/`, `public/`
- **Security**: Public-facing, no sensitive data
- **GitHub Access**: Public repository, no token required

#### Plugins Repository
- **Location**: `/plugins/`
- **Purpose**: Plugin ecosystem and extensions
- **Key Files**: Plugin implementations, event system
- **Security**: Sandboxed execution, admin tokens
- **GitHub Access**: Private repository, requires token

#### Private-Plugins Repository
- **Location**: `/private-plugins/`
- **Purpose**: Private plugin ecosystem and premium features
- **Key Files**: Encrypted plugin implementations
- **Security**: Encrypted artifacts, license management
- **GitHub Access**: Private repository, requires token

#### Platform-Manifests Repository
- **Location**: `/platform-manifests/`
- **Purpose**: Deployment configurations
- **Key Files**: Docker, Kubernetes, platform configs
- **Security**: Container security, secret management
- **GitHub Access**: Public repository, no token required

### Bitcoin-Specific Guidelines
- **xpub-only architecture** - never handle private keys
- **Network validation** - always specify mainnet/testnet
- **Address validation** - validate all Bitcoin addresses
- **Transaction safety** - read-only operations by default
- **Mock data integration** - realistic but safe test data

### Security Guidelines
- **No hardcoded credentials** in documentation or code
- **Use placeholders** like `YOUR_JWT_TOKEN`, `YOUR_PASSWORD`
- **Environment variables** for all sensitive data
- **Input validation** on all user inputs
- **Audit logging** for all operations
- **GitHub token security** - never commit tokens to repositories

### Command Execution Safety
**🚨 CRITICAL FOR CURSOR CHAT: NEVER run blocking commands without timeouts**

**FORBIDDEN COMMANDS:**
```bash
# ❌ DANGEROUS - Will block Cursor chat
npm start
node server.js
npm run dev
docker-compose up
kubectl apply
```

**REQUIRED SAFE PATTERNS:**
```bash
# ✅ SAFE - With timeout
timeout 30s npm start
timeout 60s npm run dev

# ✅ SAFE - Background with kill
npm start & sleep 10 && kill %1
npm run dev & sleep 15 && pkill -f "node"

# ✅ SAFE - Docker detach
docker-compose up -d

# ✅ SAFE - Health check approach
npm start & sleep 5 && curl -s --max-time 10 http://localhost:3000/health

# ✅ SAFE - GitHub API operations
./scripts/build-status.sh dashboard --timeout 30
node scripts/github-org-manager.js --timeout 60
```

**MANDATORY PROCESS CLEANUP:**
```bash
# Before starting any server, ALWAYS run:
pkill -f "node.*start" 2>/dev/null
pkill -f "npm.*dev" 2>/dev/null
pkill -f "docker.*compose" 2>/dev/null
sleep 2

# Verify no processes are running:
ps aux | grep -E "(node|npm|docker)" | grep -v grep
```

**VERSION CHECKING (when issues occur):**
```bash
node --version
npm --version
docker --version
git status
```

**Cursor Terminal Best Practices:**
- **Always check current directory**: `pwd` before running commands
- **Verify repository context**: `git remote -v` to confirm repo
- **Use explicit paths**: Don't rely on relative paths across repos
- **Check file existence**: `ls -la` before editing files
- **Verify git status**: `git status` before making changes
- **Check GitHub token**: `echo $GITHUB_TOKEN | head -c 10` before API operations

## 🔍 AI Analysis Guidelines
**🎯 CRITICAL FOR AI AGENTS: How to provide effective analysis and feedback**

### Core Analysis Principles
- **Lead with substantive feedback** rather than praise. Find real issues first.
- **Look for specific gaps and improvements**, not just surface-level validation.
- **Think practically**: What would cause problems in real use? What's missing?
- **Give concrete examples** of issues/improvements, not vague suggestions.
- **Consider failure scenarios** and edge cases that might be overlooked.
- **Compare to practical standards** - what would work reliably in practice?
- **Identify the most important areas** that need attention or strengthening.

### Analysis Framework
**When reviewing code, architecture, or implementations:**

1. **Start with critical issues** - What could break or cause security problems?
2. **Identify missing components** - What's needed for production readiness?
3. **Assess integration points** - How does this fit with existing systems?
4. **Evaluate error handling** - What happens when things go wrong?
5. **Check security implications** - Are there vulnerabilities or exposure risks?
6. **Consider performance impact** - Will this scale or cause bottlenecks?
7. **Validate Bitcoin-specific concerns** - Does this handle Bitcoin operations safely?
8. **Review GitHub integration** - Does this properly integrate with GitHub APIs?

### Feedback Quality Standards
**Provide feedback that is:**
- **Specific and actionable** - Don't just say "this could be better"
- **Prioritized by impact** - Focus on issues that matter most
- **Context-aware** - Consider the repository and system context
- **Solution-oriented** - Suggest concrete improvements when possible
- **Risk-focused** - Highlight potential failure modes and security concerns

### Common Analysis Anti-Patterns to Avoid
- **Surface-level validation** - Don't just confirm things work
- **Vague suggestions** - Avoid "consider improving this" without specifics
- **Ignoring edge cases** - Always think about failure scenarios
- **Missing security analysis** - Security should be a primary concern
- **Overlooking integration** - Consider how changes affect other systems
- **Praise without substance** - Focus on actionable improvements

## 🔍 CRITICAL: Assumption Validation & Existing Code Check

### 🚨 MANDATORY: Validate Assumptions Before Implementation
**⚠️ CRITICAL FOR AI AGENTS: Always validate assumptions before making changes**

**Before implementing ANY new functionality:**

1. **Search for existing implementations** - Use semantic search and grep
2. **Check if functionality already exists** - Look for similar patterns
3. **Validate architectural assumptions** - Verify repository structure
4. **Confirm current state** - Check what's already working
5. **Review existing patterns** - Understand established conventions
6. **Verify GitHub API access** - Check token availability and permissions

**Required Validation Steps:**
```bash
# 1. Search for existing functionality
codebase_search "functionality name"
grep_search "functionality pattern"

# 2. Check if files/directories exist
ls -la path/to/expected/file
find . -name "pattern*" -type f

# 3. Verify repository context
pwd && git remote -v
git status

# 4. Check existing implementations
grep -r "similar_function" --include="*.js" --include="*.jsx" .

# 5. Verify GitHub API access
echo $GITHUB_TOKEN | head -c 10
node scripts/test-github-access.js
```

### 🔍 MANDATORY: Check Existing Code Before New Implementation
**🚨 CRITICAL: Never implement new code without checking existing solutions**

**Before writing ANY new code:**

1. **Search existing codebase** for similar functionality
2. **Check if the feature already exists** in a different form
3. **Review existing patterns** and conventions
4. **Understand current architecture** before adding new components
5. **Validate that new code is actually needed**
6. **Verify GitHub API integration** if required

**Required Pre-Implementation Checklist:**
- [ ] **Searched codebase** for existing similar functionality
- [ ] **Checked all repositories** for related implementations
- [ ] **Reviewed existing patterns** and conventions
- [ ] **Validated architectural assumptions** about current state
- [ ] **Confirmed new code is necessary** and not duplicative
- [ ] **Understood existing integration points** before adding new ones
- [ ] **Identified all systems that need integration** with new code
- [ ] **Mapped existing data flows** that new code will interact with
- [ ] **Checked for existing error handling patterns** to follow
- [ ] **Verified existing security patterns** to maintain consistency
- [ ] **Confirmed GitHub API access** if required for functionality

**Common Anti-Patterns to Avoid:**
- **Implementing features that already exist** in different forms
- **Creating new patterns** when established ones work
- **Assuming architecture** without checking current state
- **Duplicating functionality** across repositories
- **Ignoring existing conventions** and patterns
- **Forgetting GitHub API requirements** for new features

**Validation Commands:**
```bash
# Search for existing functionality
codebase_search "feature name"
grep_search "function_name"

# Check for existing patterns
find . -name "*.js" -exec grep -l "pattern" {} \;

# Verify current architecture
ls -la
cat package.json | grep -A 10 -B 10 "dependencies"

# Check existing implementations
grep -r "class.*Service" --include="*.js" .
grep -r "function.*Handler" --include="*.js" .

# Check for integration points
grep -r "require.*Service" --include="*.js" .
grep -r "import.*from" --include="*.js" .
grep -r "new.*Service" --include="*.js" .

# Check for existing error handling patterns
grep -r "try.*catch" --include="*.js" .
grep -r "throw.*Error" --include="*.js" .

# Check for existing security patterns
grep -r "validate.*input" --include="*.js" .
grep -r "sanitize" --include="*.js" .

# Check GitHub API integration
grep -r "github.*api" --include="*.js" .
grep -r "octokit" --include="*.js" .
```

### 📋 Implementation Validation Template
**Use this template before ANY implementation:**

```
IMPLEMENTATION VALIDATION CHECKLIST:

1. EXISTING CODE SEARCH:
   - [ ] Searched for similar functionality: [results]
   - [ ] Checked all repositories: [results]
   - [ ] Found existing patterns: [list]

2. ARCHITECTURE VALIDATION:
   - [ ] Current repository structure: [verified]
   - [ ] Existing integration points: [identified]
   - [ ] Established conventions: [understood]

3. ASSUMPTION VALIDATION:
   - [ ] Repository context: [confirmed]
   - [ ] File locations: [verified]
   - [ ] Dependencies: [checked]
   - [ ] GitHub API access: [verified]

4. IMPLEMENTATION DECISION:
   - [ ] New code needed: [yes/no with justification]
   - [ ] Enhancement of existing: [yes/no with details]
   - [ ] Integration approach: [specified]
   - [ ] Systems to integrate with: [list all affected systems]
   - [ ] Data flow integration: [specify how data flows will be affected]
   - [ ] Error handling integration: [specify how errors will be handled]
   - [ ] Security integration: [specify security considerations]
   - [ ] GitHub API integration: [specify if required and how]
```

## 🛠️ Common Patterns

### Cross-Repository Imports
```javascript
// Dashboard importing shared utilities
const { securityUtils } = require('@mybitcoinfuture/shared');

// Website importing shared utilities
import { formatBitcoin } from '@mybitcoinfuture/shared';

// Plugins importing dashboard utilities
const { pluginUtils } = require('@mybitcoinfuture/dashboard');
```

### Error Handling
```javascript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed:', error);
  return ApiResponse.error(res, error.message, 500);
}
```

### Bitcoin Validation
```javascript
const isValidXpub = (xpub) => {
  return /^xpub[a-km-zA-HJ-NP-Z1-9]{107}$/.test(xpub);
};
```

### API Response Pattern
```javascript
// Standard API response format
const ApiResponse = {
  success: (res, data) => res.json({ success: true, data, version: '1.0.0' }),
  error: (res, message, code = 500) => res.status(code).json({ 
    error: { code: 'ERROR', message }, 
    version: '1.0.0' 
  })
};
```

### GitHub API Integration Pattern
```javascript
// GitHub API integration with proper error handling
const GitHubAPI = {
  async request(path, options = {}) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable required');
    }
    
    // Implementation with proper error handling
  }
};
```

### Security Checklist (Quick Reference)
- [ ] **Input validation** - sanitize all inputs
- [ ] **Authentication** - verify JWT tokens
- [ ] **xpub validation** - Bitcoin addresses/xpubs only
- [ ] **Environment variables** - no hardcoded secrets
- [ ] **Audit logging** - log all operations
- [ ] **Error handling** - proper error responses
- [ ] **GitHub token security** - never commit tokens to repositories

### Common AI Anti-Patterns to Avoid
- **Repository confusion** - Always specify which repo you're working in
- **Import path errors** - Verify repository structure before imports  
- **Context loss** - Include current state in every significant operation
- **Process hanging** - Always use timeouts for long-running commands
- **File path assumptions** - Always verify file existence before editing
- **Git confusion** - Check `git status` and `git remote -v` before commits
- **File deletion without permission** - NEVER delete files unless user explicitly says "delete this specific file"
- **Interpreting "clean up" as "delete"** - Always ask for clarification
- **Deleting documentation** - Never delete .md files or documentation folders
- **Assumption-based implementation** - Never implement without validating assumptions
- **Duplicate functionality** - Always search for existing implementations first
- **Architecture ignorance** - Understand current state before adding new components
- **Pattern violation** - Follow established conventions, don't create new patterns unnecessarily
- **Integration ignorance** - Always identify and integrate with existing systems
- **Data flow disruption** - Understand existing data flows before modifying them
- **GitHub API access ignorance** - Always verify token availability before API operations
- **Token security violations** - Never commit tokens or secrets to repositories

### Essential Testing Patterns
```javascript
// Test structure
describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });
  
  it('should handle success case', async () => {
    // Arrange, Act, Assert
  });
  
  it('should handle error case', async () => {
    // Test error scenarios
  });
});
```

## 📚 Quick Reference

### Repository URLs
- **Dashboard**: `https://github.com/MyBitcoinFuture/dashboard`
- **Website**: `https://github.com/MyBitcoinFuture/website`
- **Plugins**: `https://github.com/MyBitcoinFuture/plugins`
- **Private-Plugins**: `https://github.com/MyBitcoinFuture/private-plugins`
- **Platform-Manifests**: `https://github.com/MyBitcoinFuture/platform-manifests`

### Key Commands
```bash
# Check which repo you're in
pwd && git remote -v

# Safe development
timeout 30s npm run dev

# Cross-repo work
cd ../other-repo && git status

# GitHub API operations
./.github/scripts/github/build-status.sh dashboard
node .github/scripts/github/test-github-access.js

# Check GitHub token
echo $GITHUB_TOKEN | head -c 10
```

### Quick Troubleshooting
```bash
# If commands seem to hang
Ctrl+C to interrupt
pkill -f "node" 2>/dev/null

# If file not found
ls -la path/to/file
find . -name "filename" 2>/dev/null

# If git issues
git status
git remote -v
git log --oneline -5

# If process issues
ps aux | grep -E "(node|npm)" | grep -v grep
lsof -i :3000  # Check port usage

# If GitHub API issues
echo $GITHUB_TOKEN | head -c 10
node scripts/test-github-access.js
```

---

**Built with ❤️ by the MyBitcoinFuture team**

*Empowering organizations to manage their Bitcoin treasury with confidence and security across all repositories with comprehensive GitHub Teams optimization.* 