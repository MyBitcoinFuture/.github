#!/usr/bin/env node

/**
 * GitHub Organization Manager
 * 
 * Comprehensive organization management for MyBitcoinFuture GitHub Teams optimization
 * 
 * Usage:
 *   node scripts/github-org-manager.js [operation] [options]
 * 
 * Operations:
 *   audit                    - Audit current organization state
 *   setup-teams             - Set up recommended team structure
 *   setup-repositories      - Configure repository settings
 *   setup-projects          - Create and configure project boards
 *   setup-automation        - Configure automated workflows
 *   setup-security          - Configure security settings
 *   validate                - Validate all configurations
 *   report                  - Generate comprehensive report
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

// Configuration
const ORGANIZATION = 'MyBitcoinFuture';
const TEAMS_CONFIG = {
  'core-development': {
    description: 'Core development team with full admin access',
    privacy: 'closed',
    repositories: ['dashboard', 'plugins', 'private-plugins', 'platform-manifests'],
    permissions: 'admin'
  },
  'partners': {
    description: 'Partners with limited access to specific repositories',
    privacy: 'closed',
    repositories: ['dashboard', 'plugins'],
    permissions: 'push'
  },
  'beta-testers': {
    description: 'Beta testers with read access to pre-release repositories',
    privacy: 'closed',
    repositories: ['dashboard'],
    permissions: 'pull'
  },
  'community-contributors': {
    description: 'Community contributors with PR access to open source repos',
    privacy: 'closed',
    repositories: ['website', 'plugins'],
    permissions: 'pull'
  },
  'advisory': {
    description: 'Advisory team with read access to strategic repositories',
    privacy: 'closed',
    repositories: ['dashboard', 'website'],
    permissions: 'pull'
  }
};

const REPOSITORIES_CONFIG = {
  'dashboard': {
    description: 'Main Bitcoin treasury management application',
    private: true,
    topics: ['bitcoin', 'treasury', 'management', 'dashboard'],
    default_branch: 'main',
    allow_squash_merge: true,
    allow_merge_commit: true,
    allow_rebase_merge: false,
    delete_branch_on_merge: true
  },
  'website': {
    description: 'Landing page and public documentation',
    private: false,
    topics: ['bitcoin', 'documentation', 'website'],
    default_branch: 'main',
    allow_squash_merge: true,
    allow_merge_commit: true,
    allow_rebase_merge: false,
    delete_branch_on_merge: true
  },
  'plugins': {
    description: 'Plugin ecosystem and extensions',
    private: true,
    topics: ['bitcoin', 'plugins', 'ecosystem'],
    default_branch: 'main',
    allow_squash_merge: true,
    allow_merge_commit: true,
    allow_rebase_merge: false,
    delete_branch_on_merge: true
  },
  'private-plugins': {
    description: 'Private plugin ecosystem and premium features',
    private: true,
    topics: ['bitcoin', 'plugins', 'premium'],
    default_branch: 'main',
    allow_squash_merge: true,
    allow_merge_commit: true,
    allow_rebase_merge: false,
    delete_branch_on_merge: true
  },
  'platform-manifests': {
    description: 'Platform deployment configurations',
    private: false,
    topics: ['bitcoin', 'deployment', 'docker', 'kubernetes'],
    default_branch: 'main',
    allow_squash_merge: true,
    allow_merge_commit: true,
    allow_rebase_merge: false,
    delete_branch_on_merge: true
  }
};

const PROJECTS_CONFIG = {
  'marketplace-launch-pipeline': {
    description: 'Marketplace launch pipeline for Umbrel/Start9 submissions',
    columns: ['Backlog', 'In Development', 'Testing', 'Marketplace Review', 'Published']
  },
  'plugin-development-roadmap': {
    description: 'Plugin development roadmap and progress tracking',
    columns: ['Planning', 'Development', 'Testing', 'Release']
  },
  'partnership-coordination': {
    description: 'Partnership coordination and integration tracking',
    columns: ['Discussion', 'Development', 'Testing', 'Integration', 'Launch']
  },
  'community-management': {
    description: 'Community management and engagement tracking',
    columns: ['New Issues', 'Triage', 'In Progress', 'Community Review', 'Resolved']
  }
};

// GitHub API helper
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
      const url = `https://${this.baseURL}${path}`;
      const headers = {
        'User-Agent': 'MyBitcoinFuture-Org-Manager',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${this.token}`
      };

      if (options.body) {
        headers['Content-Type'] = 'application/json';
      }

      const requestOptions = {
        method: options.method || 'GET',
        headers
      };

      if (options.body) {
        requestOptions.body = JSON.stringify(options.body);
      }

      const req = https.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              reject(new Error(`GitHub API error: ${res.statusCode} - ${json.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  // Organization methods
  async getOrganization() {
    return this.request(`/orgs/${ORGANIZATION}`);
  }

  async getTeams() {
    return this.request(`/orgs/${ORGANIZATION}/teams`);
  }

  async createTeam(teamConfig) {
    return this.request(`/orgs/${ORGANIZATION}/teams`, {
      method: 'POST',
      body: teamConfig
    });
  }

  async updateTeam(teamSlug, teamConfig) {
    return this.request(`/orgs/${ORGANIZATION}/teams/${teamSlug}`, {
      method: 'PATCH',
      body: teamConfig
    });
  }

  async addTeamToRepository(teamSlug, repo, permissions) {
    return this.request(`/orgs/${ORGANIZATION}/teams/${teamSlug}/repos/${ORGANIZATION}/${repo}`, {
      method: 'PUT',
      body: { permission: permissions }
    });
  }

  // Repository methods
  async getRepositories() {
    return this.request(`/orgs/${ORGANIZATION}/repos`);
  }

  async updateRepository(repo, config) {
    return this.request(`/repos/${ORGANIZATION}/${repo}`, {
      method: 'PATCH',
      body: config
    });
  }

  async setBranchProtection(repo, branch, config) {
    return this.request(`/repos/${ORGANIZATION}/${repo}/branches/${branch}/protection`, {
      method: 'PUT',
      body: config
    });
  }

  // Project methods
  async getProjects() {
    return this.request(`/orgs/${ORGANIZATION}/projects`);
  }

  async createProject(projectConfig) {
    return this.request(`/orgs/${ORGANIZATION}/projects`, {
      method: 'POST',
      body: projectConfig
    });
  }

  async createProjectColumn(projectId, columnConfig) {
    return this.request(`/projects/${projectId}/columns`, {
      method: 'POST',
      body: columnConfig
    });
  }
}

// Organization manager
class OrganizationManager {
  constructor() {
    this.github = new GitHubAPI();
  }

  async audit() {
    console.log('🔍 Auditing MyBitcoinFuture organization...\n');

    try {
      // Audit organization
      const org = await this.github.getOrganization();
      console.log('📊 Organization Information:');
      console.log(`   Name: ${org.name}`);
      console.log(`   Login: ${org.login}`);
      console.log(`   Description: ${org.description || 'No description'}`);
      console.log(`   Public Repos: ${org.public_repos}`);
      console.log(`   Private Repos: ${org.total_private_repos}`);
      console.log(`   Plan: ${org.plan?.name || 'Unknown'}\n`);

      // Audit teams
      const teams = await this.github.getTeams();
      console.log('👥 Teams:');
      teams.forEach(team => {
        console.log(`   - ${team.name} (${team.slug}) - ${team.privacy}`);
      });
      console.log('');

      // Audit repositories
      const repos = await this.github.getRepositories();
      console.log('📁 Repositories:');
      repos.forEach(repo => {
        console.log(`   - ${repo.name} (${repo.private ? 'private' : 'public'}) - ${repo.description || 'No description'}`);
      });
      console.log('');

      // Audit projects
      const projects = await this.github.getProjects();
      console.log('📋 Projects:');
      projects.forEach(project => {
        console.log(`   - ${project.name} - ${project.body || 'No description'}`);
      });

    } catch (error) {
      console.error('❌ Audit failed:', error.message);
    }
  }

  async setupTeams() {
    console.log('👥 Setting up teams...\n');

    try {
      const existingTeams = await this.github.getTeams();
      const existingTeamSlugs = existingTeams.map(team => team.slug);

      for (const [teamSlug, teamConfig] of Object.entries(TEAMS_CONFIG)) {
        if (existingTeamSlugs.includes(teamSlug)) {
          console.log(`✅ Team ${teamSlug} already exists, updating...`);
          await this.github.updateTeam(teamSlug, teamConfig);
        } else {
          console.log(`🆕 Creating team ${teamSlug}...`);
          await this.github.createTeam({
            name: teamSlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: teamConfig.description,
            privacy: teamConfig.privacy
          });
        }

        // Add repositories to team
        for (const repo of teamConfig.repositories) {
          try {
            await this.github.addTeamToRepository(teamSlug, repo, teamConfig.permissions);
            console.log(`   ✅ Added ${repo} to ${teamSlug} with ${teamConfig.permissions} permissions`);
          } catch (error) {
            console.log(`   ⚠️  Could not add ${repo} to ${teamSlug}: ${error.message}`);
          }
        }
      }

      console.log('\n✅ Team setup complete!');
    } catch (error) {
      console.error('❌ Team setup failed:', error.message);
    }
  }

  async setupRepositories() {
    console.log('📁 Setting up repositories...\n');

    try {
      const repos = await this.github.getRepositories();

      for (const [repoName, repoConfig] of Object.entries(REPOSITORIES_CONFIG)) {
        const repo = repos.find(r => r.name === repoName);
        if (repo) {
          console.log(`🔄 Updating repository ${repoName}...`);
          await this.github.updateRepository(repoName, repoConfig);
          console.log(`   ✅ Updated ${repoName}`);

          // Set up branch protection
          try {
            await this.github.setBranchProtection(repoName, repoConfig.default_branch, {
              required_status_checks: {
                strict: true,
                contexts: []
              },
              enforce_admins: true,
              required_pull_request_reviews: {
                required_approving_review_count: 1,
                dismiss_stale_reviews: true
              },
              restrictions: null
            });
            console.log(`   ✅ Set up branch protection for ${repoName}`);
          } catch (error) {
            console.log(`   ⚠️  Could not set up branch protection for ${repoName}: ${error.message}`);
          }
        } else {
          console.log(`⚠️  Repository ${repoName} not found`);
        }
      }

      console.log('\n✅ Repository setup complete!');
    } catch (error) {
      console.error('❌ Repository setup failed:', error.message);
    }
  }

  async setupProjects() {
    console.log('📋 Setting up projects...\n');

    try {
      const existingProjects = await this.github.getProjects();
      const existingProjectNames = existingProjects.map(project => project.name);

      for (const [projectName, projectConfig] of Object.entries(PROJECTS_CONFIG)) {
        if (existingProjectNames.includes(projectName)) {
          console.log(`✅ Project ${projectName} already exists`);
        } else {
          console.log(`🆕 Creating project ${projectName}...`);
          const project = await this.github.createProject({
            name: projectName,
            body: projectConfig.description
          });

          // Create columns
          for (const columnName of projectConfig.columns) {
            await this.github.createProjectColumn(project.id, {
              name: columnName
            });
            console.log(`   ✅ Created column: ${columnName}`);
          }
        }
      }

      console.log('\n✅ Project setup complete!');
    } catch (error) {
      console.error('❌ Project setup failed:', error.message);
    }
  }

  async setupAutomation() {
    console.log('🤖 Setting up automation...\n');

    // This would include setting up issue templates, automated workflows, etc.
    // Implementation depends on specific requirements
    console.log('⚠️  Automation setup requires manual configuration');
    console.log('   - Issue templates need to be created in .github/ISSUE_TEMPLATE/');
    console.log('   - Workflows need to be configured in .github/workflows/');
    console.log('   - Branch protection rules are set up in repository setup');
  }

  async setupSecurity() {
    console.log('🔒 Setting up security...\n');

    // This would include setting up security policies, dependency scanning, etc.
    console.log('⚠️  Security setup requires manual configuration');
    console.log('   - Security policies need to be created in SECURITY.md');
    console.log('   - Dependency scanning needs to be enabled in repository settings');
    console.log('   - Two-factor authentication should be enforced for organization members');
  }

  async validate() {
    console.log('✅ Validating configuration...\n');

    try {
      // Validate teams
      const teams = await this.github.getTeams();
      const expectedTeams = Object.keys(TEAMS_CONFIG);
      const actualTeams = teams.map(team => team.slug);

      console.log('👥 Team Validation:');
      for (const expectedTeam of expectedTeams) {
        if (actualTeams.includes(expectedTeam)) {
          console.log(`   ✅ ${expectedTeam} exists`);
        } else {
          console.log(`   ❌ ${expectedTeam} missing`);
        }
      }

      // Validate repositories
      const repos = await this.github.getRepositories();
      const expectedRepos = Object.keys(REPOSITORIES_CONFIG);
      const actualRepos = repos.map(repo => repo.name);

      console.log('\n📁 Repository Validation:');
      for (const expectedRepo of expectedRepos) {
        if (actualRepos.includes(expectedRepo)) {
          console.log(`   ✅ ${expectedRepo} exists`);
        } else {
          console.log(`   ❌ ${expectedRepo} missing`);
        }
      }

      // Validate projects
      const projects = await this.github.getProjects();
      const expectedProjects = Object.keys(PROJECTS_CONFIG);
      const actualProjects = projects.map(project => project.name);

      console.log('\n📋 Project Validation:');
      for (const expectedProject of expectedProjects) {
        if (actualProjects.includes(expectedProject)) {
          console.log(`   ✅ ${expectedProject} exists`);
        } else {
          console.log(`   ❌ ${expectedProject} missing`);
        }
      }

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    }
  }

  async report() {
    console.log('📊 Generating comprehensive report...\n');

    try {
      const org = await this.github.getOrganization();
      const teams = await this.github.getTeams();
      const repos = await this.github.getRepositories();
      const projects = await this.github.getProjects();

      const report = {
        timestamp: new Date().toISOString(),
        organization: {
          name: org.name,
          login: org.login,
          description: org.description,
          public_repos: org.public_repos,
          private_repos: org.total_private_repos,
          plan: org.plan?.name
        },
        teams: teams.map(team => ({
          name: team.name,
          slug: team.slug,
          privacy: team.privacy,
          description: team.description
        })),
        repositories: repos.map(repo => ({
          name: repo.name,
          private: repo.private,
          description: repo.description,
          topics: repo.topics,
          default_branch: repo.default_branch
        })),
        projects: projects.map(project => ({
          name: project.name,
          description: project.body,
          state: project.state
        })),
        recommendations: this.generateRecommendations(org, teams, repos, projects)
      };

      // Save report to file
      const reportPath = path.join(__dirname, '../reports/organization-report.json');
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      console.log('✅ Report generated and saved to reports/organization-report.json');
      console.log('\n📋 Summary:');
      console.log(`   Organization: ${org.name}`);
      console.log(`   Teams: ${teams.length}`);
      console.log(`   Repositories: ${repos.length}`);
      console.log(`   Projects: ${projects.length}`);

    } catch (error) {
      console.error('❌ Report generation failed:', error.message);
    }
  }

  generateRecommendations(org, teams, repos, projects) {
    const recommendations = [];

    // Check for missing teams
    const expectedTeams = Object.keys(TEAMS_CONFIG);
    const actualTeams = teams.map(team => team.slug);
    const missingTeams = expectedTeams.filter(team => !actualTeams.includes(team));
    if (missingTeams.length > 0) {
      recommendations.push(`Missing teams: ${missingTeams.join(', ')}`);
    }

    // Check for missing repositories
    const expectedRepos = Object.keys(REPOSITORIES_CONFIG);
    const actualRepos = repos.map(repo => repo.name);
    const missingRepos = expectedRepos.filter(repo => !actualRepos.includes(repo));
    if (missingRepos.length > 0) {
      recommendations.push(`Missing repositories: ${missingRepos.join(', ')}`);
    }

    // Check for missing projects
    const expectedProjects = Object.keys(PROJECTS_CONFIG);
    const actualProjects = projects.map(project => project.name);
    const missingProjects = expectedProjects.filter(project => !actualProjects.includes(project));
    if (missingProjects.length > 0) {
      recommendations.push(`Missing projects: ${missingProjects.join(', ')}`);
    }

    return recommendations;
  }
}

// Main execution
async function main() {
  const operation = process.argv[2];
  const manager = new OrganizationManager();

  if (!operation) {
    console.log(`
GitHub Organization Manager

Usage: node scripts/github-org-manager.js [operation]

Operations:
  audit                    - Audit current organization state
  setup-teams             - Set up recommended team structure
  setup-repositories      - Configure repository settings
  setup-projects          - Create and configure project boards
  setup-automation        - Configure automated workflows
  setup-security          - Configure security settings
  validate                - Validate all configurations
  report                  - Generate comprehensive report

Examples:
  node scripts/github-org-manager.js audit
  node scripts/github-org-manager.js setup-teams
  node scripts/github-org-manager.js report
    `);
    return;
  }

  try {
    switch (operation) {
      case 'audit':
        await manager.audit();
        break;
      case 'setup-teams':
        await manager.setupTeams();
        break;
      case 'setup-repositories':
        await manager.setupRepositories();
        break;
      case 'setup-projects':
        await manager.setupProjects();
        break;
      case 'setup-automation':
        await manager.setupAutomation();
        break;
      case 'setup-security':
        await manager.setupSecurity();
        break;
      case 'validate':
        await manager.validate();
        break;
      case 'report':
        await manager.report();
        break;
      default:
        console.error(`❌ Unknown operation: ${operation}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Operation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { OrganizationManager, GitHubAPI };
