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

class BuildAnalyzer {
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
          'User-Agent': 'MyBitcoinFuture-Build-Analyzer',
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

  async getWorkflowRun(owner, repo, runId) {
    return this.request(`/repos/${owner}/${repo}/actions/runs/${runId}`);
  }

  async getWorkflowRunJobs(owner, repo, runId) {
    return this.request(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs`);
  }

  async analyzeRun(owner, repo, runId) {
    console.log(`🔍 Analyzing workflow run: ${runId}`);
    
    try {
      // Get the workflow run details
      const run = await this.getWorkflowRun(owner, repo, runId);
      
      console.log(`📋 Run Details:`);
      console.log(`  ID: ${run.id}`);
      console.log(`  Status: ${run.status}`);
      console.log(`  Conclusion: ${run.conclusion || 'pending'}`);
      console.log(`  Workflow: ${run.name}`);
      console.log(`  Branch: ${run.head_branch}`);
      console.log(`  Commit: ${run.head_sha.substring(0, 8)}`);
      console.log(`  Actor: ${run.actor?.login}`);
      console.log(`  Created: ${run.created_at}`);
      console.log(`  Updated: ${run.updated_at}`);
      console.log(`  Duration: ${run.updated_at ? Math.round((new Date(run.updated_at) - new Date(run.created_at)) / 1000) : 'N/A'}s`);
      console.log(`  URL: ${run.html_url}`);
      
      if (run.status === 'completed') {
        console.log(`\n📊 Analysis Results:`);
        console.log(`===================`);
        
        if (run.conclusion === 'success') {
          console.log(`✅ Build successful!`);
          console.log(`📋 Recommendation: No action needed`);
          
        } else if (run.conclusion === 'failure') {
          console.log(`❌ Build failed, analyzing job details...`);
          
          try {
            const jobs = await this.getWorkflowRunJobs(owner, repo, runId);
            
            console.log(`\n📋 Job Details:`);
            console.log(`===============`);
            
            jobs.jobs.forEach((job, index) => {
              const duration = job.completed_at ? Math.round((new Date(job.completed_at) - new Date(job.started_at)) / 1000) : 'N/A';
              const status = job.conclusion === 'success' ? '✅' : job.conclusion === 'failure' ? '❌' : '⏳';
              
              console.log(`${index + 1}. ${status} ${job.name}`);
              console.log(`   Status: ${job.status} (${job.conclusion || 'pending'})`);
              console.log(`   Duration: ${duration}s`);
              console.log(`   Started: ${job.started_at}`);
              console.log(`   Completed: ${job.completed_at || 'N/A'}`);
              console.log(``);
            });
            
            // Analyze failure patterns
            const failedJobs = jobs.jobs.filter(job => job.conclusion === 'failure');
            
            if (failedJobs.length > 0) {
              console.log(`🔍 Failure Analysis:`);
              console.log(`==================`);
              
              failedJobs.forEach(job => {
                const jobName = job.name.toLowerCase();
                
                if (jobName.includes('test')) {
                  console.log(`❌ Test failures in: ${job.name}`);
                  console.log(`   Action: Review and fix failing tests`);
                  console.log(`   Command: npm test`);
                }
                
                if (jobName.includes('build')) {
                  console.log(`❌ Build failures in: ${job.name}`);
                  console.log(`   Action: Check dependencies and build configuration`);
                  console.log(`   Command: npm run build`);
                }
                
                if (jobName.includes('lint')) {
                  console.log(`❌ Linting failures in: ${job.name}`);
                  console.log(`   Action: Fix code style issues`);
                  console.log(`   Command: npm run lint:fix`);
                }
                
                if (jobName.includes('deploy')) {
                  console.log(`❌ Deployment failures in: ${job.name}`);
                  console.log(`   Action: Check deployment configuration and credentials`);
                }
              });
              
              console.log(`\n🔄 Recommended Actions:`);
              console.log(`======================`);
              
              if (failedJobs.some(job => job.name.toLowerCase().includes('test'))) {
                console.log(`1. 🔧 Fix failing tests`);
                console.log(`   - Review test output in build logs`);
                console.log(`   - Update test code to match current implementation`);
                console.log(`   - Run tests locally: npm test`);
              }
              
              if (failedJobs.some(job => job.name.toLowerCase().includes('build'))) {
                console.log(`2. 🔧 Fix build issues`);
                console.log(`   - Check package.json dependencies`);
                console.log(`   - Verify build configuration`);
                console.log(`   - Run build locally: npm run build`);
              }
              
              if (failedJobs.some(job => job.name.toLowerCase().includes('lint'))) {
                console.log(`3. 🔧 Fix linting issues`);
                console.log(`   - Run linting locally: npm run lint`);
                console.log(`   - Fix code style issues automatically: npm run lint:fix`);
              }
              
              console.log(`\n📋 Next Steps:`);
              console.log(`==============`);
              console.log(`1. Check the build logs at: ${run.html_url}`);
              console.log(`2. Fix the issues identified above`);
              console.log(`3. Test locally before pushing changes`);
              console.log(`4. Push fixes and trigger a new build`);
              
            } else {
              console.log(`⚠️  No failed jobs found, but build marked as failed`);
              console.log(`   Check the build logs manually: ${run.html_url}`);
            }
            
          } catch (error) {
            console.log(`⚠️  Could not get job details: ${error.message}`);
            console.log(`   Check build logs manually: ${run.html_url}`);
          }
          
        } else if (run.conclusion === 'cancelled') {
          console.log(`⚠️  Build was cancelled`);
          console.log(`📋 Recommendation: Build was manually cancelled, no action needed`);
          
        } else {
          console.log(`❓ Unknown conclusion: ${run.conclusion}`);
          console.log(`📋 Recommendation: Check build logs manually`);
        }
        
      } else {
        console.log(`⏳ Build is still in progress`);
        console.log(`📋 Status: ${run.status}`);
        console.log(`📋 Check progress at: ${run.html_url}`);
      }
      
    } catch (error) {
      console.error(`❌ Error analyzing run: ${error.message}`);
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
Build Run Analyzer

Usage: node analyze-specific-run.js <repository> <run_id>

Examples:
  node analyze-specific-run.js dashboard 17192865535
  node analyze-specific-run.js website 12345678

This tool will:
1. Get detailed information about a specific workflow run
2. Analyze job results and failure patterns
3. Generate specific recommendations for fixing issues
    `);
    return;
  }

  const [repo, runId] = args;
  const owner = 'MyBitcoinFuture';
  
  try {
    const analyzer = new BuildAnalyzer();
    
    console.log(`🚀 Analyzing workflow run for ${owner}/${repo}`);
    console.log(`📋 Run ID: ${runId}`);
    console.log(`=====================================`);
    
    await analyzer.analyzeRun(owner, repo, runId);
    
    console.log(`\n🎉 Analysis complete!`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BuildAnalyzer };
