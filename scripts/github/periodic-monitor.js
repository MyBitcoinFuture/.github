#!/usr/bin/env node

/**
 * Periodic GitHub Workflow Monitor
 * 
 * Monitors workflow runs across MyBitcoinFuture organization repositories
 * and provides periodic status updates
 * 
 * Usage:
 *   node scripts/github/periodic-monitor.js [options]
 * 
 * Options:
 *   --interval <seconds>    Check interval in seconds (default: 300 = 5 minutes)
 *   --repos <repo1,repo2>   Comma-separated list of repositories to monitor
 *   --format <format>       Output format: json, summary, table (default: summary)
 *   --notify-failures       Only show notifications for failed builds
 *   --max-checks <number>   Maximum number of checks before stopping (default: unlimited)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env file if it exists
function loadEnvFile() {
  const possiblePaths = [
    path.join(__dirname, '..', '..', '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
    path.join(__dirname, '..', '..', '..', '..', '.env')
  ];
  
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      console.log(`📁 Loading .env from: ${envPath}`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !process.env[key]) {
          process.env[key] = value.trim();
        }
      });
      return;
    }
  }
}

// Load environment variables
loadEnvFile();

// Configuration
const ORGANIZATION = 'MyBitcoinFuture';
const REPOSITORIES = {
  dashboard: 'dashboard',
  website: 'website', 
  plugins: 'plugins',
  'private-plugins': 'private-plugins',
  'platform-manifests': 'platform-manifests'
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    interval: 300, // 5 minutes default
    repos: ['dashboard'], // Default to dashboard
    format: 'summary',
    notifyFailures: false,
    maxChecks: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--interval':
        options.interval = parseInt(args[++i]);
        break;
      case '--repos':
        options.repos = args[++i].split(',').map(r => r.trim());
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--notify-failures':
        options.notifyFailures = true;
        break;
      case '--max-checks':
        options.maxChecks = parseInt(args[++i]);
        break;
      case '--help':
        showHelp();
        process.exit(0);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Periodic GitHub Workflow Monitor

Usage: node scripts/github/periodic-monitor.js [options]

Options:
  --interval <seconds>    Check interval in seconds (default: 300 = 5 minutes)
  --repos <repo1,repo2>   Comma-separated list of repositories to monitor
  --format <format>       Output format: json, summary, table (default: summary)
  --notify-failures       Only show notifications for failed builds
  --max-checks <number>   Maximum number of checks before stopping (default: unlimited)
  --help                  Show this help message

Examples:
  node scripts/github/periodic-monitor.js
  node scripts/github/periodic-monitor.js --interval 60 --repos dashboard,website
  node scripts/github/periodic-monitor.js --notify-failures --max-checks 10
  `);
}

// GitHub API helper
class GitHubAPI {
  constructor(token = null) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.baseURL = 'api.github.com';
  }

  async request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `https://${this.baseURL}${path}`;
      const headers = {
        'User-Agent': 'MyBitcoinFuture-Periodic-Monitor',
        'Accept': 'application/vnd.github.v3+json'
      };

      if (this.token) {
        headers['Authorization'] = `token ${this.token}`;
      }

      const requestOptions = {
        method: options.method || 'GET',
        headers
      };

      const req = https.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              const errorMsg = json.message || data;
              const rateLimitInfo = res.headers['x-ratelimit-remaining'] ? 
                ` (Rate limit: ${res.headers['x-ratelimit-remaining']}/${res.headers['x-ratelimit-limit']})` : '';
              reject(new Error(`GitHub API error: ${res.statusCode} - ${errorMsg}${rateLimitInfo}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async getWorkflowRuns(owner, repo, limit = 3) {
    const path = `/repos/${owner}/${repo}/actions/runs?per_page=${limit}`;
    return await this.request(path);
  }
}

// Status formatter
class StatusFormatter {
  static formatSummary(runs, repo) {
    if (!runs || runs.length === 0) {
      return `No workflow runs found for ${repo}`;
    }

    const total = runs.length;
    const completed = runs.filter(r => r.status === 'completed').length;
    const inProgress = runs.filter(r => r.status === 'in_progress').length;
    const queued = runs.filter(r => r.status === 'queued').length;
    const failed = runs.filter(r => r.conclusion === 'failure').length;
    const success = runs.filter(r => r.conclusion === 'success').length;

    const status = this.getOverallStatus(success, failed, inProgress, queued);
    const emoji = this.getStatusEmoji(success, failed, inProgress, queued);

    return `${emoji} ${repo}: ${status} (${success}✅ ${failed}❌ ${inProgress}🔄 ${queued}⏳)`;
  }

  static formatJson(runs, repo) {
    return JSON.stringify({
      repository: repo,
      timestamp: new Date().toISOString(),
      total_runs: runs.length,
      runs: runs.map(run => ({
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        branch: run.head_branch,
        created_at: run.created_at,
        updated_at: run.updated_at
      }))
    }, null, 2);
  }

  static getStatusEmoji(success, failed, inProgress, queued) {
    if (failed > 0) return '❌';
    if (inProgress > 0) return '🔄';
    if (queued > 0) return '⏳';
    if (success > 0) return '✅';
    return '❓';
  }

  static getOverallStatus(success, failed, inProgress, queued) {
    if (failed > 0) return 'FAILED';
    if (inProgress > 0) return 'IN PROGRESS';
    if (queued > 0) return 'QUEUED';
    if (success > 0) return 'SUCCESS';
    return 'UNKNOWN';
  }
}

// Main monitor class
class PeriodicMonitor {
  constructor(options) {
    this.options = options;
    this.github = new GitHubAPI();
    this.checkCount = 0;
    this.lastStatus = {};
  }

  async checkRepository(repo) {
    try {
      const runs = await this.github.getWorkflowRuns(
        ORGANIZATION, 
        REPOSITORIES[repo], 
        3
      );

      if (runs.workflow_runs && runs.workflow_runs.length > 0) {
        const currentStatus = this.getStatusSummary(runs.workflow_runs);
        const hasChanged = this.hasStatusChanged(repo, currentStatus);
        
        if (!this.options.notifyFailures || currentStatus.failed > 0) {
          if (hasChanged || this.options.notifyFailures) {
            this.displayStatus(runs.workflow_runs, repo);
          }
        }
        
        this.lastStatus[repo] = currentStatus;
      }
    } catch (error) {
      console.log(`❌ Error checking ${repo}: ${error.message}`);
    }
  }

  getStatusSummary(runs) {
    return {
      total: runs.length,
      completed: runs.filter(r => r.status === 'completed').length,
      inProgress: runs.filter(r => r.status === 'in_progress').length,
      queued: runs.filter(r => r.status === 'queued').length,
      failed: runs.filter(r => r.conclusion === 'failure').length,
      success: runs.filter(r => r.conclusion === 'success').length
    };
  }

  hasStatusChanged(repo, currentStatus) {
    const lastStatus = this.lastStatus[repo];
    if (!lastStatus) return true;
    
    return (
      lastStatus.failed !== currentStatus.failed ||
      lastStatus.success !== currentStatus.success ||
      lastStatus.inProgress !== currentStatus.inProgress ||
      lastStatus.queued !== currentStatus.queued
    );
  }

  displayStatus(runs, repo) {
    const timestamp = new Date().toLocaleString();
    
    switch (this.options.format) {
      case 'json':
        console.log(StatusFormatter.formatJson(runs, repo));
        break;
      case 'table':
        // Simple table format
        console.log(`\n📊 ${repo} - ${timestamp}`);
        runs.forEach(run => {
          const status = run.conclusion || run.status;
          const emoji = status === 'success' ? '✅' : status === 'failure' ? '❌' : '🔄';
          console.log(`  ${emoji} ${run.name} (${run.head_branch}) - ${status}`);
        });
        break;
      case 'summary':
      default:
        console.log(`[${timestamp}] ${StatusFormatter.formatSummary(runs, repo)}`);
        break;
    }
  }

  async run() {
    console.log(`🚀 Starting periodic monitor for MyBitcoinFuture organization`);
    console.log(`📊 Repositories: ${this.options.repos.join(', ')}`);
    console.log(`⏱️  Check interval: ${this.options.interval} seconds`);
    console.log(`📋 Format: ${this.options.format}`);
    console.log(`🔔 Notify failures only: ${this.options.notifyFailures}`);
    if (this.options.maxChecks) {
      console.log(`🔢 Max checks: ${this.options.maxChecks}`);
    }
    console.log(`Press Ctrl+C to stop monitoring\n`);

    const checkAll = async () => {
      this.checkCount++;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🕐 Check #${this.checkCount} - ${new Date().toLocaleString()}`);
      
      for (const repo of this.options.repos) {
        await this.checkRepository(repo);
      }
      
      if (this.options.maxChecks && this.checkCount >= this.options.maxChecks) {
        console.log(`\n✅ Reached maximum checks (${this.options.maxChecks}). Stopping.`);
        process.exit(0);
      }
    };

    // Initial check
    await checkAll();
    
    // Set up periodic checks
    const interval = setInterval(checkAll, this.options.interval * 1000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping periodic monitor...');
      clearInterval(interval);
      process.exit(0);
    });
  }
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    const monitor = new PeriodicMonitor(options);
    await monitor.run();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { PeriodicMonitor, GitHubAPI, StatusFormatter };
