#!/usr/bin/env node

/**
 * GitHub Build Status Monitor
 * 
 * Monitors build statuses across MyBitcoinFuture organization repositories
 * 
 * Usage:
 *   node scripts/github-build-monitor.js [options]
 * 
 * Options:
 *   --repo <repository>     Specific repository to check (dashboard, website, plugins, private-plugins)
 *   --branch <branch>       Branch to check (default: main)
 *   --workflow <workflow>   Specific workflow to check
 *   --limit <number>        Number of recent runs to check (default: 5)
 *   --format <format>       Output format: json, table, summary (default: table)
 *   --watch                 Watch mode - continuously monitor builds
 *   --interval <seconds>    Watch interval in seconds (default: 30)
 */

const https = require('https');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load .env file if it exists
function loadEnvFile() {
  // Look for .env in multiple possible locations
  const possiblePaths = [
    path.join(__dirname, '..', '..', '..', '.env'),  // From .github/scripts/github/ to workspace root
    path.join(__dirname, '..', '..', '.env'),        // From .github/scripts/github/ to .github/
    path.join(__dirname, '..', '..', '..', '..', '.env')  // From .github/scripts/github/ to workspace root (alternative)
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
      return; // Found and loaded, exit
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

const WORKFLOWS = {
  dashboard: ['ci.yml', 'branded-installer-ci.yml', 'release.yml'],
  website: ['ci.yml', 'deploy.yml', 'static.yml'],
  plugins: ['plugin-ci.yml', 'repository-dispatch.yml'],
  'private-plugins': ['plugin-ci.yml', 'repository-dispatch.yml'],
  'platform-manifests': []
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    repo: null,
    branch: 'main',
    workflow: null,
    limit: 5,
    format: 'table',
    watch: false,
    interval: 30
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--repo':
        options.repo = args[++i];
        break;
      case '--branch':
        options.branch = args[++i];
        break;
      case '--workflow':
        options.workflow = args[++i];
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--interval':
        options.interval = parseInt(args[++i]);
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
GitHub Build Status Monitor

Usage: node scripts/github-build-monitor.js [options]

Options:
  --repo <repository>     Specific repository to check (dashboard, website, plugins, private-plugins)
  --branch <branch>       Branch to check (default: main)
  --workflow <workflow>   Specific workflow to check
  --limit <number>        Number of recent runs to check (default: 5)
  --format <format>       Output format: json, table, summary (default: table)
  --watch                 Watch mode - continuously monitor builds
  --interval <seconds>    Watch interval in seconds (default: 30)
  --help                  Show this help message

Examples:
  node scripts/github-build-monitor.js --repo dashboard
  node scripts/github-build-monitor.js --repo dashboard --workflow ci.yml --format json
  node scripts/github-build-monitor.js --watch --interval 60
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
        'User-Agent': 'MyBitcoinFuture-Build-Monitor',
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
              // Add more detailed error information
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

  async getWorkflowRuns(owner, repo, workflow = null, branch = null, limit = 5) {
    let path = `/repos/${owner}/${repo}/actions/runs?per_page=${limit}`;
    
    if (workflow) {
      path += `&workflow_id=${encodeURIComponent(workflow)}`;
    }
    
    if (branch) {
      path += `&branch=${encodeURIComponent(branch)}`;
    }

    try {
      return await this.request(path);
    } catch (error) {
      // If workflow-specific request fails, try without workflow filter
      if (workflow && error.message.includes('404')) {
        console.log(`⚠️  Workflow '${workflow}' not found, checking all workflows...`);
        return this.request(`/repos/${owner}/${repo}/actions/runs?per_page=${limit}${branch ? `&branch=${encodeURIComponent(branch)}` : ''}`);
      }
      throw error;
    }
  }

  async getWorkflowRun(owner, repo, runId) {
    return this.request(`/repos/${owner}/${repo}/actions/runs/${runId}`);
  }

  async getWorkflowRunJobs(owner, repo, runId) {
    return this.request(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs`);
  }
}

// Build status formatter
class BuildStatusFormatter {
  static formatTable(runs, repo) {
    if (!runs || runs.length === 0) {
      return `No workflow runs found for ${repo}`;
    }

    const headers = ['Run ID', 'Workflow', 'Branch', 'Status', 'Conclusion', 'Created', 'Duration'];
    const rows = runs.map(run => [
      run.id.toString(),
      run.name || 'Unknown',
      run.head_branch,
      run.status,
      run.conclusion || 'N/A',
      new Date(run.created_at).toLocaleString(),
      run.status === 'completed' ? this.formatDuration(run.created_at, run.updated_at) : 'Running'
    ]);

    return this.createTable(headers, rows);
  }

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

    return `
📊 Build Status Summary for ${repo}
=====================================
Total Runs: ${total}
├── Completed: ${completed}
│   ├── Success: ${success}
│   └── Failed: ${failed}
├── In Progress: ${inProgress}
└── Queued: ${queued}

${this.getStatusEmoji(success, failed, inProgress, queued)} Overall Status: ${this.getOverallStatus(success, failed, inProgress, queued)}
    `.trim();
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
        updated_at: run.updated_at,
        duration: run.status === 'completed' ? 
          this.calculateDuration(run.created_at, run.updated_at) : null
      }))
    }, null, 2);
  }

  static createTable(headers, rows) {
    const columnWidths = headers.map((_, i) => 
      Math.max(headers[i].length, ...rows.map(row => String(row[i] || '').length))
    );

    const separator = '|' + columnWidths.map(width => '-'.repeat(width + 2)).join('|') + '|';
    const headerRow = '|' + headers.map((header, i) => 
      ` ${header.padEnd(columnWidths[i])} `).join('|') + '|';

    const dataRows = rows.map(row => 
      '|' + row.map((cell, i) => 
        ` ${String(cell || '').padEnd(columnWidths[i])} `).join('|') + '|'
    );

    return [headerRow, separator, ...dataRows].join('\n');
  }

  static formatDuration(createdAt, updatedAt) {
    const duration = this.calculateDuration(createdAt, updatedAt);
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  }

  static calculateDuration(createdAt, updatedAt) {
    return Math.floor((new Date(updatedAt) - new Date(createdAt)) / 1000);
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
class BuildMonitor {
  constructor(options) {
    this.options = options;
    this.github = new GitHubAPI();
    this.repositories = options.repo ? [options.repo] : Object.keys(REPOSITORIES);
  }

  async checkRepository(repo) {
    try {
      console.log(`\n🔍 Checking ${repo} repository...`);
      
      // First, test if we can access the repository
      try {
        await this.github.request(`/repos/${ORGANIZATION}/${REPOSITORIES[repo]}`);
        console.log(`✅ Repository ${repo} is accessible`);
      } catch (error) {
        console.log(`❌ Cannot access repository ${repo}: ${error.message}`);
        return;
      }
      
      const workflows = this.options.workflow ? 
        [this.options.workflow] : 
        WORKFLOWS[repo] || [];

      if (workflows.length === 0) {
        console.log(`⚠️  No workflows configured for ${repo}`);
        return;
      }

      for (const workflow of workflows) {
        try {
          const runs = await this.github.getWorkflowRuns(
            ORGANIZATION, 
            REPOSITORIES[repo], 
            workflow,
            this.options.branch,
            this.options.limit
          );

          if (runs.workflow_runs && runs.workflow_runs.length > 0) {
            console.log(`\n📋 Workflow: ${workflow}`);
            this.displayResults(runs.workflow_runs, repo);
          } else {
            console.log(`📋 Workflow: ${workflow} - No recent runs`);
          }
        } catch (error) {
          console.log(`❌ Error checking workflow ${workflow}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error checking repository ${repo}: ${error.message}`);
    }
  }

  displayResults(runs, repo) {
    switch (this.options.format) {
      case 'json':
        console.log(BuildStatusFormatter.formatJson(runs, repo));
        break;
      case 'summary':
        console.log(BuildStatusFormatter.formatSummary(runs, repo));
        break;
      case 'table':
      default:
        console.log(BuildStatusFormatter.formatTable(runs, repo));
        break;
    }
  }

  async monitor() {
    console.log(`🚀 Starting build monitor for MyBitcoinFuture organization`);
    console.log(`📊 Repositories: ${this.repositories.join(', ')}`);
    console.log(`🔄 Watch mode: ${this.options.watch ? 'enabled' : 'disabled'}`);
    
    if (this.options.watch) {
      console.log(`⏱️  Check interval: ${this.options.interval} seconds`);
      console.log(`Press Ctrl+C to stop monitoring\n`);
    }

    const checkAll = async () => {
      for (const repo of this.repositories) {
        await this.checkRepository(repo);
      }
    };

    if (this.options.watch) {
      await checkAll();
      
      const interval = setInterval(async () => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🕐 ${new Date().toLocaleString()} - Checking builds...`);
        await checkAll();
      }, this.options.interval * 1000);

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n👋 Stopping build monitor...');
        clearInterval(interval);
        process.exit(0);
      });
    } else {
      await checkAll();
    }
  }
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    const monitor = new BuildMonitor(options);
    await monitor.monitor();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BuildMonitor, GitHubAPI, BuildStatusFormatter };
