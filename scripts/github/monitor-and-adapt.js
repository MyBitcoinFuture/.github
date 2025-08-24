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

class BuildMonitor {
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
          'Accept': 'application/vnd.github.v3+json'
        }
      };

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

      req.end();
    });
  }

  async getWorkflowRuns(owner, repo, workflow = null, branch = null, limit = 10) {
    let path = `/repos/${owner}/${repo}/actions/runs?per_page=${limit}`;
    
    if (workflow) {
      path += `&workflow_id=${encodeURIComponent(workflow)}`;
    }
    
    if (branch) {
      path += `&branch=${encodeURIComponent(branch)}`;
    }

    return this.request(path);
  }

  async getWorkflowRun(owner, repo, runId) {
    return this.request(`/repos/${owner}/${repo}/actions/runs/${runId}`);
  }

  async getWorkflowRunJobs(owner, repo, runId) {
    return this.request(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs`);
  }

  async waitForWorkflowCompletion(owner, repo, runId, timeout = 300000) { // 5 minutes default
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const run = await this.getWorkflowRun(owner, repo, runId);
        
        console.log(`⏳ Workflow run ${runId}: ${run.status} (${run.conclusion || 'pending'})`);
        
        if (run.status === 'completed') {
          console.log(`✅ Workflow completed with conclusion: ${run.conclusion}`);
          return run;
        }
        
        // Wait 15 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 15000));
        
      } catch (error) {
        console.error(`❌ Error checking workflow status: ${error.message}`);
        throw error;
      }
    }
    
    throw new Error(`Timeout waiting for workflow completion after ${timeout/1000} seconds`);
  }

  async analyzeBuildResults(owner, repo, workflow = 'ci.yml', branch = 'main') {
    console.log(`🔍 Analyzing build results for ${repo}/${workflow} on ${branch}...`);
    
    try {
      const runs = await this.getWorkflowRuns(owner, repo, workflow, branch, 5);
      
      if (!runs.workflow_runs || runs.workflow_runs.length === 0) {
        console.log(`📋 No workflow runs found for ${workflow}`);
        return { status: 'no_runs', message: 'No workflow runs found' };
      }

      const latestRun = runs.workflow_runs[0];
      console.log(`📋 Latest run ID: ${latestRun.id}`);
      console.log(`📋 Status: ${latestRun.status}`);
      console.log(`📋 Conclusion: ${latestRun.conclusion || 'pending'}`);
      console.log(`📋 Created: ${latestRun.created_at}`);
      console.log(`🔗 URL: ${latestRun.html_url}`);

      // If the latest run is still in progress, wait for it
      if (latestRun.status === 'in_progress' || latestRun.status === 'queued') {
        console.log(`⏳ Latest run is still in progress, waiting for completion...`);
        
        try {
          const completedRun = await this.waitForWorkflowCompletion(owner, repo, latestRun.id);
          return this.analyzeCompletedRun(completedRun);
        } catch (error) {
          console.log(`⚠️  Could not wait for completion: ${error.message}`);
          return { status: 'timeout', message: 'Build timed out' };
        }
      }

      // Analyze the completed run
      return this.analyzeCompletedRun(latestRun);

    } catch (error) {
      console.error(`❌ Error analyzing build results: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  async analyzeCompletedRun(run) {
    console.log(`📊 Analyzing completed run: ${run.id}`);
    
    const result = {
      runId: run.id,
      status: run.status,
      conclusion: run.conclusion,
      url: run.html_url,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      duration: run.updated_at ? new Date(run.updated_at) - new Date(run.created_at) : null,
      workflow: run.name,
      branch: run.head_branch,
      commit: run.head_sha,
      actor: run.actor?.login,
      analysis: {}
    };

    if (run.conclusion === 'success') {
      result.analysis.status = 'success';
      result.analysis.message = 'Build completed successfully';
      result.analysis.recommendation = 'No action needed';
      
      console.log(`✅ Build successful!`);
      console.log(`📊 Duration: ${Math.round(result.duration / 1000)}s`);
      console.log(`👤 Triggered by: ${result.actor}`);
      
    } else if (run.conclusion === 'failure') {
      console.log(`❌ Build failed, analyzing details...`);
      
      try {
        // Get detailed job information
        const jobs = await this.getWorkflowRunJobs('MyBitcoinFuture', 'dashboard', run.id);
        
        result.analysis.status = 'failure';
        result.analysis.message = 'Build failed';
        result.analysis.jobs = jobs.jobs.map(job => ({
          name: job.name,
          status: job.status,
          conclusion: job.conclusion,
          duration: job.completed_at ? new Date(job.completed_at) - new Date(job.started_at) : null
        }));

        // Analyze failure patterns
        const failedJobs = result.analysis.jobs.filter(job => job.conclusion === 'failure');
        console.log(`📋 Failed jobs: ${failedJobs.length}`);
        
        failedJobs.forEach(job => {
          console.log(`  ❌ ${job.name}: ${job.status} (${Math.round(job.duration / 1000)}s)`);
        });

        // Generate recommendations based on failure patterns
        result.analysis.recommendation = this.generateRecommendation(failedJobs);
        
      } catch (error) {
        console.log(`⚠️  Could not get detailed job information: ${error.message}`);
        result.analysis.recommendation = 'Check build logs manually for failure details';
      }
      
    } else if (run.conclusion === 'cancelled') {
      result.analysis.status = 'cancelled';
      result.analysis.message = 'Build was cancelled';
      result.analysis.recommendation = 'Build was manually cancelled';
      
    } else {
      result.analysis.status = 'unknown';
      result.analysis.message = `Unknown conclusion: ${run.conclusion}`;
      result.analysis.recommendation = 'Check build status manually';
    }

    return result;
  }

  generateRecommendation(failedJobs) {
    const jobNames = failedJobs.map(job => job.name.toLowerCase());
    
    if (jobNames.some(name => name.includes('test'))) {
      return 'Test failures detected - review test code and fix failing tests';
    }
    
    if (jobNames.some(name => name.includes('build'))) {
      return 'Build failures detected - check dependencies and build configuration';
    }
    
    if (jobNames.some(name => name.includes('lint'))) {
      return 'Linting failures detected - fix code style issues';
    }
    
    if (jobNames.some(name => name.includes('deploy'))) {
      return 'Deployment failures detected - check deployment configuration and credentials';
    }
    
    return 'Review build logs for specific failure details';
  }

  async adaptToBuildResult(analysis) {
    console.log(`🔄 Adapting to build result...`);
    
    if (analysis.analysis.status === 'success') {
      console.log(`✅ Build successful - no adaptation needed`);
      return { action: 'none', message: 'Build successful' };
      
    } else if (analysis.analysis.status === 'failure') {
      console.log(`❌ Build failed - generating adaptation plan`);
      
      const adaptation = {
        action: 'fix',
        message: analysis.analysis.recommendation,
        priority: 'high',
        steps: []
      };

      // Generate specific adaptation steps based on failure analysis
      if (analysis.analysis.jobs) {
        const failedJobs = analysis.analysis.jobs.filter(job => job.conclusion === 'failure');
        
        failedJobs.forEach(job => {
          if (job.name.toLowerCase().includes('test')) {
            adaptation.steps.push({
              action: 'fix_tests',
              description: `Fix failing tests in ${job.name}`,
              command: 'npm test',
              priority: 'high'
            });
          }
          
          if (job.name.toLowerCase().includes('build')) {
            adaptation.steps.push({
              action: 'fix_build',
              description: `Fix build issues in ${job.name}`,
              command: 'npm run build',
              priority: 'high'
            });
          }
          
          if (job.name.toLowerCase().includes('lint')) {
            adaptation.steps.push({
              action: 'fix_lint',
              description: `Fix linting issues in ${job.name}`,
              command: 'npm run lint:fix',
              priority: 'medium'
            });
          }
        });
      }

      return adaptation;
      
    } else {
      console.log(`⚠️  Unknown build status - manual review required`);
      return { action: 'review', message: 'Manual review required' };
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
Build Monitor and Adaptation Tool

Usage: node monitor-and-adapt.js <repository> [workflow] [branch]

Examples:
  node monitor-and-adapt.js dashboard
  node monitor-and-adapt.js dashboard ci.yml
  node monitor-and-adapt.js dashboard ci.yml main

This tool will:
1. Monitor the latest build for the specified workflow
2. Wait for completion if build is in progress
3. Analyze the build results
4. Generate adaptation recommendations
    `);
    return;
  }

  const [repo, workflow = 'ci.yml', branch = 'main'] = args;
  const owner = 'MyBitcoinFuture';
  
  try {
    const monitor = new BuildMonitor();
    
    console.log(`🚀 Starting build monitoring and adaptation for ${owner}/${repo}`);
    console.log(`📋 Workflow: ${workflow}`);
    console.log(`🌿 Branch: ${branch}`);
    console.log(`=====================================`);
    
    // Analyze build results
    const analysis = await monitor.analyzeBuildResults(owner, repo, workflow, branch);
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`===================`);
    console.log(`Status: ${analysis.analysis?.status || analysis.status}`);
    console.log(`Message: ${analysis.analysis?.message || analysis.message}`);
    
    if (analysis.analysis?.recommendation) {
      console.log(`Recommendation: ${analysis.analysis.recommendation}`);
    }
    
    // Adapt to the results
    console.log(`\n🔄 Adaptation Plan:`);
    console.log(`==================`);
    const adaptation = await monitor.adaptToBuildResult(analysis);
    
    console.log(`Action: ${adaptation.action}`);
    console.log(`Message: ${adaptation.message}`);
    
    if (adaptation.steps && adaptation.steps.length > 0) {
      console.log(`\n📋 Recommended Steps:`);
      adaptation.steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step.description}`);
        console.log(`   Command: ${step.command}`);
        console.log(`   Priority: ${step.priority}`);
        console.log(``);
      });
    }
    
    console.log(`\n🎉 Analysis complete!`);
    console.log(`🔗 Build URL: ${analysis.url || 'N/A'}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BuildMonitor };
