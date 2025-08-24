# GitHub Build Status Monitor

**Purpose:** Monitor build statuses across MyBitcoinFuture organization repositories from Cursor chat or command line.

**Security:** Uses GitHub REST API with optional authentication for higher rate limits.

## 🚀 Quick Start

### Basic Usage
```bash
# Check all repositories
./scripts/build-status.sh

# Check specific repository
./scripts/build-status.sh dashboard

# Watch all builds continuously
./scripts/build-status.sh watch

# Check with summary format
./scripts/build-status.sh --repo dashboard --format summary
```

### Advanced Usage
```bash
# Check specific workflow
./scripts/build-status.sh --repo dashboard --workflow ci.yml

# Check specific branch
./scripts/build-status.sh --repo dashboard --branch develop

# JSON output for automation
./scripts/build-status.sh --repo dashboard --format json

# Watch with custom interval
./scripts/build-status.sh --watch --interval 60
```

## 🔧 Setup

### 1. GitHub Token (Optional but Recommended)

**Without Token:**
- Limited to 60 requests/hour
- Can still check build statuses
- Good for occasional checks

**With Token:**
- 5000 requests/hour limit
- Better for continuous monitoring
- Required for private repositories

**Setup Token:**
```bash
# Option 1: Environment variable
export GITHUB_TOKEN=your_github_token_here

# Option 2: .env file
echo "GITHUB_TOKEN=your_github_token_here" > .env

# Option 3: Create token at GitHub
# Go to: GitHub Settings → Developer settings → Personal access tokens
# Create token with 'repo' scope for private repos, or 'public_repo' for public repos
```

### 2. Node.js Requirement
The monitor requires Node.js (already available in your environment).

## 📊 Supported Repositories

| Repository | Workflows | Description |
|------------|-----------|-------------|
| `dashboard` | `ci.yml`, `branded-installer-ci.yml`, `release.yml` | Main application CI/CD |
| `website` | `ci.yml`, `deploy.yml`, `static.yml` | Website deployment |
| `plugins` | `plugin-ci.yml`, `repository-dispatch.yml` | Public plugins CI/CD |
| `private-plugins` | `plugin-ci.yml`, `repository-dispatch.yml` | Private plugins CI/CD |
| `platform-manifests` | None configured | Platform deployment configs |

## 🎯 Output Formats

### Table Format (Default)
```
| Run ID | Workflow | Branch | Status | Conclusion | Created | Duration |
|--------|----------|--------|--------|------------|---------|----------|
| 123456 | CI/CD Pipeline | main | completed | success | 2024-01-15 10:30:00 | 5m 23s |
```

### Summary Format
```
📊 Build Status Summary for dashboard
=====================================
Total Runs: 5
├── Completed: 4
│   ├── Success: 3
│   └── Failed: 1
├── In Progress: 1
└── Queued: 0

✅ Overall Status: SUCCESS
```

### JSON Format
```json
{
  "repository": "dashboard",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "total_runs": 5,
  "runs": [
    {
      "id": 123456,
      "name": "CI/CD Pipeline",
      "status": "completed",
      "conclusion": "success",
      "branch": "main",
      "created_at": "2024-01-15T10:25:00.000Z",
      "updated_at": "2024-01-15T10:30:23.000Z",
      "duration": 323
    }
  ]
}
```

## 🔄 Watch Mode

Continuous monitoring with automatic refresh:

```bash
# Watch all repositories every 30 seconds
./scripts/build-status.sh --watch

# Watch specific repository every 60 seconds
./scripts/build-status.sh --repo dashboard --watch --interval 60

# Stop watching: Press Ctrl+C
```

## 🛠️ Command Line Options

| Option | Short | Description | Example |
|--------|-------|-------------|---------|
| `--repo` | `-r` | Specific repository | `--repo dashboard` |
| `--branch` | `-b` | Specific branch | `--branch develop` |
| `--workflow` | `-w` | Specific workflow file | `--workflow ci.yml` |
| `--limit` | `-l` | Number of recent runs | `--limit 10` |
| `--format` | `-f` | Output format | `--format json` |
| `--watch` | | Enable watch mode | `--watch` |
| `--interval` | `-i` | Watch interval (seconds) | `--interval 60` |
| `--help` | `-h` | Show help | `--help` |

## 🎯 Quick Commands

```bash
# Quick repository checks
./scripts/build-status.sh dashboard    # Check dashboard
./scripts/build-status.sh website      # Check website
./scripts/build-status.sh plugins      # Check plugins
./scripts/build-status.sh all          # Check all repos

# Quick watch commands
./scripts/build-status.sh watch        # Watch all builds
./scripts/build-status.sh dashboard --watch  # Watch dashboard only

# Quick format checks
./scripts/build-status.sh --format summary  # Summary for all repos
./scripts/build-status.sh --format json     # JSON for automation
```

## 🔍 Troubleshooting

### Common Issues

**1. "GitHub API error: 403 - API rate limit exceeded"**
```bash
# Solution: Set up GitHub token
export GITHUB_TOKEN=your_token_here
```

**2. "GitHub API error: 404 - Not Found"**
```bash
# Solution: Check repository name and workflow file
./scripts/build-status.sh --repo dashboard --workflow ci.yml
```

**3. "Node.js is not installed"**
```bash
# Solution: Install Node.js
# On Arch Linux: sudo pacman -S nodejs npm
```

**4. "Monitor script not found"**
```bash
# Solution: Run from project root directory
cd /path/to/MyBitcoinFuture
./scripts/build-status.sh
```

### Rate Limiting

**Without Token:**
- 60 requests/hour
- Good for occasional checks
- May hit limit with watch mode

**With Token:**
- 5000 requests/hour
- Good for continuous monitoring
- Personal access token required

## 🔐 Security Considerations

### API Token Security
- Store tokens in environment variables, not in code
- Use minimal required permissions
- Rotate tokens regularly
- Never commit tokens to version control

### Repository Access
- Public repositories: No token required
- Private repositories: Token with `repo` scope required
- Organization repositories: Token with appropriate permissions

## 📈 Integration with Cursor Chat

You can now check build statuses directly from Cursor chat:

```bash
# Quick status check
./scripts/build-status.sh dashboard

# Continuous monitoring
./scripts/build-status.sh --watch --interval 30

# JSON output for parsing
./scripts/build-status.sh --format json
```

## 🎯 Use Cases

### 1. Development Workflow
```bash
# Check if your recent push triggered builds
./scripts/build-status.sh dashboard --branch feature/new-feature

# Monitor build progress
./scripts/build-status.sh dashboard --watch --interval 15
```

### 2. Release Management
```bash
# Check all repositories before release
./scripts/build-status.sh all --format summary

# Monitor release builds
./scripts/build-status.sh dashboard --workflow release.yml --watch
```

### 3. CI/CD Monitoring
```bash
# Check plugin builds
./scripts/build-status.sh plugins --format json

# Monitor cross-repository builds
./scripts/build-status.sh --watch --interval 60
```

### 4. Troubleshooting
```bash
# Check failed builds
./scripts/build-status.sh dashboard --limit 10

# Get detailed JSON for analysis
./scripts/build-status.sh dashboard --format json --limit 20
```

---

**Built for MyBitcoinFuture Organization**  
*Monitor your builds with confidence and ease.*
