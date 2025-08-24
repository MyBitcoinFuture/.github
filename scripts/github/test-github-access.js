#!/usr/bin/env node

/**
 * GitHub API Access Test
 * 
 * Tests GitHub API access and helps diagnose authentication issues
 */

const https = require('https');
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

class GitHubAPITest {
  constructor(token = null) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.baseURL = 'api.github.com';
  }

  async request(path) {
    return new Promise((resolve, reject) => {
      const url = `https://${this.baseURL}${path}`;
      const headers = {
        'User-Agent': 'MyBitcoinFuture-API-Test',
        'Accept': 'application/vnd.github.v3+json'
      };

      if (this.token) {
        headers['Authorization'] = `token ${this.token}`;
      }

      const req = https.request(url, { headers }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: json
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async testRepository(owner, repo) {
    console.log(`\n🔍 Testing access to ${owner}/${repo}...`);
    
    try {
      const result = await this.request(`/repos/${owner}/${repo}`);
      
      if (result.statusCode === 200) {
        console.log(`✅ Repository is accessible`);
        console.log(`   Name: ${result.data.name}`);
        console.log(`   Private: ${result.data.private}`);
        console.log(`   Description: ${result.data.description || 'No description'}`);
        return true;
      } else {
        console.log(`❌ Repository returned status: ${result.statusCode}`);
        console.log(`   Error: ${result.data.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error accessing repository: ${error.message}`);
      return false;
    }
  }

  async testWorkflows(owner, repo) {
    console.log(`\n🔍 Testing workflow access for ${owner}/${repo}...`);
    
    try {
      const result = await this.request(`/repos/${owner}/${repo}/actions/workflows`);
      
      if (result.statusCode === 200) {
        console.log(`✅ Workflows are accessible`);
        console.log(`   Total workflows: ${result.data.total_count}`);
        
        if (result.data.workflows && result.data.workflows.length > 0) {
          console.log(`   Available workflows:`);
          result.data.workflows.forEach(workflow => {
            console.log(`     - ${workflow.name} (${workflow.path})`);
          });
        }
        return true;
      } else {
        console.log(`❌ Workflows returned status: ${result.statusCode}`);
        console.log(`   Error: ${result.data.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error accessing workflows: ${error.message}`);
      return false;
    }
  }

  async testRateLimit() {
    console.log(`\n🔍 Testing rate limit...`);
    
    try {
      const result = await this.request('/rate_limit');
      
      if (result.statusCode === 200) {
        const core = result.data.resources.core;
        console.log(`✅ Rate limit info:`);
        console.log(`   Limit: ${core.limit}`);
        console.log(`   Remaining: ${core.remaining}`);
        console.log(`   Reset: ${new Date(core.reset * 1000).toLocaleString()}`);
        
        if (this.token) {
          console.log(`   ✅ Using authenticated access`);
        } else {
          console.log(`   ⚠️  Using unauthenticated access (limited)`);
        }
        
        return true;
      } else {
        console.log(`❌ Rate limit check failed: ${result.statusCode}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error checking rate limit: ${error.message}`);
      return false;
    }
  }

  async testUser() {
    if (!this.token) {
      console.log(`\n⚠️  No token provided, skipping user test`);
      return false;
    }
    
    console.log(`\n🔍 Testing user authentication...`);
    
    try {
      const result = await this.request('/user');
      
      if (result.statusCode === 200) {
        console.log(`✅ Authentication successful`);
        console.log(`   User: ${result.data.login}`);
        console.log(`   Name: ${result.data.name || 'Not set'}`);
        console.log(`   Email: ${result.data.email || 'Not public'}`);
        return true;
      } else {
        console.log(`❌ Authentication failed: ${result.statusCode}`);
        console.log(`   Error: ${result.data.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error testing authentication: ${error.message}`);
      return false;
    }
  }
}

async function main() {
  console.log(`🚀 GitHub API Access Test`);
  console.log(`========================`);
  
  const token = process.env.GITHUB_TOKEN;
  const test = new GitHubAPITest(token);
  
  if (token) {
    console.log(`✅ GITHUB_TOKEN is set`);
  } else {
    console.log(`⚠️  GITHUB_TOKEN is not set`);
    console.log(`   Set it with: export GITHUB_TOKEN=your_token`);
  }
  
  // Test rate limit
  await test.testRateLimit();
  
  // Test user authentication
  await test.testUser();
  
  // Test repositories
  const repos = [
    { owner: 'MyBitcoinFuture', repo: 'dashboard' },
    { owner: 'MyBitcoinFuture', repo: 'website' },
    { owner: 'MyBitcoinFuture', repo: 'plugins' },
    { owner: 'MyBitcoinFuture', repo: 'private-plugins' }
  ];
  
  for (const { owner, repo } of repos) {
    const accessible = await test.testRepository(owner, repo);
    if (accessible) {
      await test.testWorkflows(owner, repo);
    }
  }
  
  console.log(`\n📋 Summary:`);
  console.log(`===========`);
  if (token) {
    console.log(`✅ You have a GitHub token set`);
    console.log(`   This should allow access to private repositories`);
    console.log(`   Rate limit: 5000 requests/hour`);
  } else {
    console.log(`⚠️  No GitHub token set`);
    console.log(`   You can only access public repositories`);
    console.log(`   Rate limit: 60 requests/hour`);
    console.log(`   To set a token:`);
    console.log(`   1. Go to GitHub Settings → Developer settings → Personal access tokens`);
    console.log(`   2. Create a new token with 'repo' scope for private repos`);
    console.log(`   3. Export it: export GITHUB_TOKEN=your_token`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { GitHubAPITest };
