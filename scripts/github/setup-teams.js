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

loadEnvFile();

class TeamManager {
  constructor(token = null) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.baseURL = 'api.github.com';
    this.owner = 'MyBitcoinFuture';
    
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
          'User-Agent': 'MyBitcoinFuture-Team-Manager',
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

  async getTeams() {
    return this.request(`/orgs/${this.owner}/teams`);
  }

  async createTeam(name, description, privacy = 'closed', repos = []) {
    const body = JSON.stringify({
      name: name,
      description: description,
      privacy: privacy,
      repo_names: repos
    });

    console.log(`🏗️  Creating team: ${name}`);
    console.log(`📋 Description: ${description}`);
    console.log(`🔒 Privacy: ${privacy}`);
    if (repos.length > 0) {
      console.log(`📁 Repositories: ${repos.join(', ')}`);
    }

    return this.request(`/orgs/${this.owner}/teams`, {
      method: 'POST',
      body: body
    });
  }

  async addTeamToRepository(teamSlug, repo, permission = 'pull') {
    const body = JSON.stringify({
      permission: permission
    });

    console.log(`🔗 Adding team ${teamSlug} to ${repo} with ${permission} permission`);

    return this.request(`/orgs/${this.owner}/teams/${teamSlug}/repos/${this.owner}/${repo}`, {
      method: 'PUT',
      body: body
    });
  }

  async setupTeams() {
    console.log(`🚀 Setting up teams for ${this.owner} organization`);
    console.log(`==============================================`);

    // Define team structure
    const teams = [
      {
        name: 'core-developers',
        description: 'Core development team with full repository access and administrative privileges',
        privacy: 'closed',
        repos: ['dashboard', 'plugins', 'private-plugins', 'platform-manifests', 'website'],
        permissions: {
          'dashboard': 'admin',
          'plugins': 'admin', 
          'private-plugins': 'admin',
          'platform-manifests': 'admin',
          'website': 'admin'
        }
      },
      {
        name: 'partners',
        description: 'Strategic partners with limited access to specific repositories for collaboration',
        privacy: 'closed',
        repos: ['dashboard', 'plugins'],
        permissions: {
          'dashboard': 'pull',
          'plugins': 'pull'
        }
      },
      {
        name: 'beta-testers',
        description: 'Beta testing team for private plugins and early access features',
        privacy: 'closed',
        repos: ['private-plugins'],
        permissions: {
          'private-plugins': 'pull'
        }
      },
      {
        name: 'community-contributors',
        description: 'Community members contributing to open source components',
        privacy: 'closed',
        repos: ['plugins', 'website'],
        permissions: {
          'plugins': 'pull',
          'website': 'pull'
        }
      },
      {
        name: 'advisory-board',
        description: 'Strategic advisors with read-only access to all repositories',
        privacy: 'closed',
        repos: ['dashboard', 'plugins', 'private-plugins', 'platform-manifests', 'website'],
        permissions: {
          'dashboard': 'pull',
          'plugins': 'pull',
          'private-plugins': 'pull',
          'platform-manifests': 'pull',
          'website': 'pull'
        }
      }
    ];

    try {
      // Check existing teams
      const existingTeams = await this.getTeams();
      console.log(`📋 Found ${existingTeams.length} existing teams`);
      
      if (existingTeams.length > 0) {
        console.log(`⚠️  Teams already exist. Skipping team creation.`);
        console.log(`📋 Existing teams:`);
        existingTeams.forEach(team => {
          console.log(`   - ${team.name}: ${team.description || 'No description'}`);
        });
        return;
      }

      // Create teams
      for (const team of teams) {
        try {
          const createdTeam = await this.createTeam(
            team.name,
            team.description,
            team.privacy,
            team.repos
          );
          
          console.log(`✅ Created team: ${createdTeam.name} (ID: ${createdTeam.id})`);
          
          // Add repository permissions
          for (const [repo, permission] of Object.entries(team.permissions)) {
            try {
              await this.addTeamToRepository(createdTeam.slug, repo, permission);
              console.log(`✅ Added ${repo} to ${createdTeam.name} with ${permission} permission`);
            } catch (error) {
              console.log(`⚠️  Could not add ${repo} to ${createdTeam.name}: ${error.message}`);
            }
          }
          
        } catch (error) {
          console.log(`❌ Failed to create team ${team.name}: ${error.message}`);
        }
      }

      console.log(`\n🎉 Team setup complete!`);
      console.log(`📋 Created ${teams.length} teams:`);
      teams.forEach(team => {
        console.log(`   - ${team.name}: ${team.description}`);
      });

    } catch (error) {
      console.error(`❌ Error setting up teams: ${error.message}`);
      throw error;
    }
  }
}

async function main() {
  try {
    const manager = new TeamManager();
    await manager.setupTeams();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { TeamManager };




