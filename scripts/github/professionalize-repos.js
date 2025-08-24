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

class RepositoryProfessionalizer {
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
          'User-Agent': 'MyBitcoinFuture-Repo-Professionalizer',
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
            if (res.statusCode === 204) {
              resolve({ status: 'success' });
              return;
            }
            
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

  async updateOrganization(description) {
    const body = JSON.stringify({
      description: description
    });

    console.log(`🏢 Updating organization description: ${description}`);

    return this.request(`/orgs/${this.owner}`, {
      method: 'PATCH',
      body: body
    });
  }

  async updateRepository(repo, description, topics = []) {
    const body = JSON.stringify({
      description: description,
      topics: topics
    });

    console.log(`📁 Updating ${repo}:`);
    console.log(`   Description: ${description}`);
    console.log(`   Topics: ${topics.join(', ')}`);

    return this.request(`/repos/${this.owner}/${repo}`, {
      method: 'PATCH',
      body: body
    });
  }

  async professionalizeRepositories() {
    console.log(`🎨 Professionalizing ${this.owner} organization`);
    console.log(`============================================`);

    // Organization description
    const orgDescription = "Professional Bitcoin treasury management platform for organizations. Secure, scalable, and open-source solutions for enterprise Bitcoin adoption.";

    // Repository configurations
    const repositories = [
      {
        name: 'dashboard',
        description: 'Main Bitcoin treasury management application with xpub-only architecture and enterprise-grade security',
        topics: ['bitcoin', 'treasury', 'xpub', 'nodejs', 'react', 'electron', 'enterprise', 'security', 'open-source']
      },
      {
        name: 'website',
        description: 'Landing page and comprehensive documentation for the MyBitcoinFuture platform',
        topics: ['documentation', 'landing-page', 'bitcoin', 'open-source', 'docs', 'marketing']
      },
      {
        name: 'plugins',
        description: 'Open-source plugin ecosystem for extending MyBitcoinFuture platform functionality',
        topics: ['plugins', 'bitcoin', 'open-source', 'ecosystem', 'extensions', 'modular']
      },
      {
        name: 'private-plugins',
        description: 'Private plugin ecosystem and premium features for enterprise customers',
        topics: ['plugins', 'bitcoin', 'premium', 'private', 'enterprise', 'commercial']
      },
      {
        name: 'platform-manifests',
        description: 'Deployment configurations and manifests for various platforms and environments',
        topics: ['deployment', 'docker', 'kubernetes', 'platform', 'manifests', 'devops', 'infrastructure']
      },
      {
        name: '.github',
        description: 'Organization-wide templates, workflows, and community management tools',
        topics: ['templates', 'workflows', 'community', 'organization', 'automation', 'ci-cd']
      }
    ];

    try {
      // Update organization description
      console.log(`\n🏢 Updating organization...`);
      await this.updateOrganization(orgDescription);
      console.log(`✅ Organization description updated`);

      // Update repositories
      console.log(`\n📁 Updating repositories...`);
      for (const repo of repositories) {
        try {
          await this.updateRepository(repo.name, repo.description, repo.topics);
          console.log(`✅ ${repo.name} updated successfully`);
        } catch (error) {
          console.log(`⚠️  Could not update ${repo.name}: ${error.message}`);
        }
      }

      console.log(`\n🎉 Repository professionalization complete!`);
      console.log(`📋 Updated ${repositories.length} repositories with professional descriptions and topics`);

    } catch (error) {
      console.error(`❌ Error professionalizing repositories: ${error.message}`);
      throw error;
    }
  }

  async createProfessionalREADME() {
    console.log(`\n📝 Creating professional organization README...`);
    
    const readmeContent = `# MyBitcoinFuture Organization

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-MyBitcoinFuture-blue.svg)](https://github.com/MyBitcoinFuture)

## 🏢 About Us

**MyBitcoinFuture** is a professional Bitcoin treasury management platform designed for organizations seeking secure, scalable, and open-source solutions for enterprise Bitcoin adoption.

Our platform provides:
- 🔒 **xpub-only architecture** - Never handle private keys
- 🏢 **Enterprise-grade security** - Built for organizational use
- 🔌 **Extensible plugin ecosystem** - Modular and customizable
- 🌐 **Cross-platform support** - Web, desktop, and mobile
- 📊 **Comprehensive analytics** - Treasury management insights

## 📦 Repository Structure

### Core Applications
- **[dashboard](https://github.com/MyBitcoinFuture/dashboard)** - Main Bitcoin treasury management application
- **[website](https://github.com/MyBitcoinFuture/website)** - Landing page and documentation

### Plugin Ecosystem
- **[plugins](https://github.com/MyBitcoinFuture/plugins)** - Open-source plugin ecosystem
- **[private-plugins](https://github.com/MyBitcoinFuture/private-plugins)** - Private plugin ecosystem and premium features

### Infrastructure
- **[platform-manifests](https://github.com/MyBitcoinFuture/platform-manifests)** - Deployment configurations
- **[.github](https://github.com/MyBitcoinFuture/.github)** - Organization-wide templates and workflows

## 🚀 Getting Started

### For Organizations
1. Visit our [website](https://mybitcoinfuture.com) for documentation
2. Review our [security model](https://github.com/MyBitcoinFuture/dashboard/blob/main/SECURITY.md)
3. Explore our [plugin ecosystem](https://github.com/MyBitcoinFuture/plugins)

### For Developers
1. Check out our [contributing guidelines](https://github.com/MyBitcoinFuture/.github/blob/main/CONTRIBUTING.md)
2. Review our [code of conduct](https://github.com/MyBitcoinFuture/.github/blob/main/CODE_OF_CONDUCT.md)
3. Join our [community discussions](https://github.com/MyBitcoinFuture/.github/discussions)

### For Partners
1. Review our [partnership opportunities](https://github.com/MyBitcoinFuture/.github/discussions/categories/partnerships)
2. Contact us for collaboration opportunities
3. Explore our [enterprise features](https://github.com/MyBitcoinFuture/private-plugins)

## 🔒 Security

Security is our top priority. We follow industry best practices:
- **xpub-only architecture** - No private key handling
- **Regular security audits** - Continuous security monitoring
- **Open-source transparency** - All code is publicly auditable
- **Enterprise-grade encryption** - Military-grade security standards

For security issues, please email [security@mybitcoinfuture.com](mailto:security@mybitcoinfuture.com)

## 🤝 Contributing

We welcome contributions from the community! Please see our [contributing guidelines](https://github.com/MyBitcoinFuture/.github/blob/main/CONTRIBUTING.md) for details.

### Community Guidelines
- Follow our [code of conduct](https://github.com/MyBitcoinFuture/.github/blob/main/CODE_OF_CONDUCT.md)
- Respect our [security model](https://github.com/MyBitcoinFuture/dashboard/blob/main/SECURITY.md)
- Contribute to our [plugin ecosystem](https://github.com/MyBitcoinFuture/plugins)
- Help improve our [documentation](https://github.com/MyBitcoinFuture/website)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Links

- **Website**: [mybitcoinfuture.com](https://mybitcoinfuture.com)
- **Documentation**: [docs.mybitcoinfuture.com](https://docs.mybitcoinfuture.com)
- **Discussions**: [GitHub Discussions](https://github.com/MyBitcoinFuture/.github/discussions)
- **Security**: [security@mybitcoinfuture.com](mailto:security@mybitcoinfuture.com)

---

**Built with ❤️ by the MyBitcoinFuture team**

*Empowering organizations to manage their Bitcoin treasury with confidence and security.*
`;

    const readmePath = path.join(__dirname, '..', '..', 'README.md');
    
    try {
      fs.writeFileSync(readmePath, readmeContent);
      console.log(`✅ Created professional organization README`);
      console.log(`📁 Location: ${readmePath}`);
    } catch (error) {
      console.log(`⚠️  Could not create README: ${error.message}`);
    }
  }
}

async function main() {
  try {
    const professionalizer = new RepositoryProfessionalizer();
    
    // Professionalize repositories
    await professionalizer.professionalizeRepositories();
    
    // Create professional README
    await professionalizer.createProfessionalREADME();
    
    console.log(`\n🎉 Professionalization complete!`);
    console.log(`📋 Next steps:`);
    console.log(`   1. Review the changes on GitHub`);
    console.log(`   2. Add team members to appropriate teams`);
    console.log(`   3. Set up branch protection rules`);
    console.log(`   4. Configure issue templates`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { RepositoryProfessionalizer };
