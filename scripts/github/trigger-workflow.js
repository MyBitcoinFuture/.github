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

class GitHubAPI {
  constructor(token = null) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.baseURL = 'api.github.com';
    
    if (!this.token) {
      throw new Error('GITHUB_TOKEN environment variable required');
    }
  }

  async request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: this.baseURL,
        path: path,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'MyBitcoinFuture-Build-Monitor',
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      };

      if (options.body) {
        requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
      }

      const req = https.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(jsonData);
            } else {
              reject(new Error(`GitHub API error: ${res.statusCode} - ${jsonData.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  async triggerWorkflow(owner, repo, workflowId, ref = 'main', inputs = {}) {
    const path = `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;
    const body = JSON.stringify({
      ref: ref,
      inputs: inputs
    });

    console.log(`🚀 Triggering workflow: ${workflowId} on ${ref}`);
    console.log(`📋 Inputs:`, inputs);

    return this.request(path, {
      method: 'POST',
      body: body
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

  async waitForWorkflowCompletion(owner, repo, runId, timeout = 300000) { // 5 minutes default
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const run = await this.request(`/repos/${owner}/${repo}/actions/runs/${runId}`);
        
        console.log(`⏳ Workflow run ${runId}: ${run.status} (${run.conclusion || 'pending'})`);
        
        if (run.status === 'completed') {
          console.log(`✅ Workflow completed with conclusion: ${run.conclusion}`);
          return run;
        }
        
        // Wait 10 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 10000));
        
      } catch (error) {
        console.error(`❌ Error checking workflow status: ${error.message}`);
        throw error;
      }
    }
    
    throw new Error(`Timeout waiting for workflow completion after ${timeout/1000} seconds`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
GitHub Workflow Trigger

Usage: node trigger-workflow.js <repository> <workflow> [branch] [inputs]

Examples:
  node trigger-workflow.js dashboard ci.yml
  node trigger-workflow.js dashboard ci.yml main
  node trigger-workflow.js dashboard ci.yml feature/test '{"test_mode":"true"}'

Available workflows for dashboard:
  - ci.yml (CI/CD Pipeline)
  - branded-installer-ci.yml (Branded Installer & Affiliate Build CI)
  - release.yml (Coordinated Release)
  - npm-publish.yml (NPM Publish)
  - brk-cross-compile.yml (BRK Cross-Platform Release)
    `);
    return;
  }

  const [repo, workflow, branch = 'main', inputsStr = '{}'] = args;
  let inputs = {};
  
  try {
    inputs = JSON.parse(inputsStr);
  } catch (error) {
    console.error(`❌ Invalid JSON for inputs: ${inputsStr}`);
    return;
  }

  const owner = 'MyBitcoinFuture';
  
  try {
    const api = new GitHubAPI();
    
    // Trigger the workflow
    await api.triggerWorkflow(owner, repo, workflow, branch, inputs);
    console.log(`✅ Successfully triggered workflow: ${workflow}`);
    
    // Wait a moment for the workflow to start
    console.log(`⏳ Waiting for workflow to start...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the latest workflow runs
    const runs = await api.getWorkflowRuns(owner, repo, workflow, branch, 1);
    
    if (runs.workflow_runs && runs.workflow_runs.length > 0) {
      const latestRun = runs.workflow_runs[0];
      console.log(`📋 Latest run ID: ${latestRun.id}`);
      console.log(`📋 Status: ${latestRun.status}`);
      console.log(`📋 Created: ${latestRun.created_at}`);
      
      // Wait for completion
      try {
        const result = await api.waitForWorkflowCompletion(owner, repo, latestRun.id);
        console.log(`🎉 Workflow completed!`);
        console.log(`📊 Result: ${result.conclusion}`);
        console.log(`🔗 URL: ${result.html_url}`);
        
        if (result.conclusion === 'success') {
          console.log(`✅ Build successful!`);
        } else {
          console.log(`❌ Build failed: ${result.conclusion}`);
        }
        
      } catch (error) {
        console.log(`⚠️  Could not wait for completion: ${error.message}`);
        console.log(`🔗 Check status at: ${latestRun.html_url}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { GitHubAPI };




