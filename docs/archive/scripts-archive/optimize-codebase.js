#!/usr/bin/env node

/**
 * Codebase Optimization Analysis Script
 *
 * Analyzes the MyBitcoinFuture codebase for remaining refactoring opportunities
 * and provides recommendations for further optimization.
 */

const fs = require('fs');
const path = require('path');

class CodebaseOptimizer {
  constructor() {
    this.analysisResults = {
      totalFiles: 0,
      totalLines: 0,
      potentialDuplications: [],
      refactoringOpportunities: [],
      baseClassUsage: {},
      recommendations: []
    };
  }

  /**
   * Main analysis function
   */
  async analyzeCodebase() {
    console.log('🔍 Analyzing MyBitcoinFuture Codebase for Optimization Opportunities...\n');

    try {
      // Analyze current state
      await this.analyzeCurrentState();

      // Find potential duplications
      await this.findPotentialDuplications();

      // Analyze base class usage
      await this.analyzeBaseClassUsage();

      // Generate recommendations
      await this.generateRecommendations();

      // Display results
      this.displayResults();

    } catch (error) {
      console.error('❌ Analysis failed:', error);
    }
  }

  /**
   * Analyze current codebase state
   */
  async analyzeCurrentState() {
    console.log('📊 Analyzing current codebase state...');

    const directories = [
      './api',
      './shared',
      './test',
      './src'
    ];

    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        const stats = this.getDirectoryStats(dir);
        this.analysisResults.totalFiles += stats.files;
        this.analysisResults.totalLines += stats.lines;
      }
    }

    console.log(`   Found ${this.analysisResults.totalFiles} files with ${this.analysisResults.totalLines} lines of code`);
  }

  /**
   * Get directory statistics
   */
  getDirectoryStats(dirPath) {
    let files = 0;
    let lines = 0;

    const processDirectory = (dir) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          processDirectory(fullPath);
        } else if (stat.isFile() && item.endsWith('.js')) {
          files++;
          const content = fs.readFileSync(fullPath, 'utf8');
          lines += content.split('\n').length;
        }
      }
    };

    processDirectory(dirPath);
    return { files, lines };
  }

  /**
   * Find potential code duplications
   */
  async findPotentialDuplications() {
    console.log('🔍 Searching for potential code duplications...');

    const patterns = [
      {
        name: 'Service Classes',
        pattern: /class\s+\w+Service\s*{/g,
        files: this.findFilesByPattern('./api/services', /Service\.js$/)
      },
      {
        name: 'Manager Classes',
        pattern: /class\s+\w+Manager\s*{/g,
        files: this.findFilesByPattern('./api', /Manager\.js$/)
      },
      {
        name: 'Handler Classes',
        pattern: /class\s+\w+Handler\s*{/g,
        files: this.findFilesByPattern('./api', /Handler\.js$/)
      },
      {
        name: 'Utility Functions',
        pattern: /function\s+\w+\(/g,
        files: this.findFilesByPattern('./api/utils', /\.js$/)
      }
    ];

    for (const pattern of patterns) {
      const duplications = this.findDuplications(pattern);
      if (duplications.length > 0) {
        this.analysisResults.potentialDuplications.push({
          type: pattern.name,
          duplications
        });
      }
    }
  }

  /**
   * Find files by pattern
   */
  findFilesByPattern(dirPath, filePattern) {
    const files = [];

    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const processDirectory = (dir) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          processDirectory(fullPath);
        } else if (stat.isFile() && filePattern.test(item)) {
          files.push(fullPath);
        }
      }
    };

    processDirectory(dirPath);
    return files;
  }

  /**
   * Find duplications in files
   */
  findDuplications(pattern) {
    const duplications = [];

    for (const file of pattern.files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const matches = content.match(pattern.pattern);

        if (matches && matches.length > 0) {
          duplications.push({
            file,
            matches: matches.length,
            className: this.extractClassName(content)
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not read file ${file}`);
      }
    }

    return duplications;
  }

  /**
   * Extract class name from file content
   */
  extractClassName(content) {
    const classMatch = content.match(/class\s+(\w+)/);
    return classMatch ? classMatch[1] : 'Unknown';
  }

  /**
   * Analyze base class usage
   */
  async analyzeBaseClassUsage() {
    console.log('📈 Analyzing base class usage...');

    const baseClasses = [
      'BaseNotificationService',
      'BasePluginInterface',
      'BaseServiceManager',
      'BaseDataAccessLayer',
      'BaseErrorHandler'
    ];

    for (const baseClass of baseClasses) {
      const usage = this.findBaseClassUsage(baseClass);
      this.analysisResults.baseClassUsage[baseClass] = usage;
    }
  }

  /**
   * Find base class usage
   */
  findBaseClassUsage(baseClassName) {
    const usage = {
      extends: [],
      imports: [],
      references: []
    };

    const searchDirectories = ['./api', './src', './test'];

    for (const dir of searchDirectories) {
      if (!fs.existsSync(dir)) {continue;}

      const files = this.findFilesByPattern(dir, /\.js$/);

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');

          // Check for extends
          if (content.includes(`extends ${baseClassName}`)) {
            usage.extends.push(file);
          }

          // Check for imports
          if (content.includes(`require.*${baseClassName}`) || content.includes(`import.*${baseClassName}`)) {
            usage.imports.push(file);
          }

          // Check for references
          if (content.includes(baseClassName)) {
            usage.references.push(file);
          }
        } catch (error) {
          console.warn(`Warning: Could not read file ${file}`);
        }
      }
    }

    return usage;
  }

  /**
   * Generate optimization recommendations
   */
  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');

    // Analyze potential for new base classes
    this.analyzeNewBaseClassOpportunities();

    // Analyze service consolidation opportunities
    this.analyzeServiceConsolidation();

    // Analyze utility consolidation
    this.analyzeUtilityConsolidation();

    // Analyze testing improvements
    this.analyzeTestingImprovements();
  }

  /**
   * Analyze opportunities for new base classes
   */
  analyzeNewBaseClassOpportunities() {
    const serviceCounts = {};

    for (const duplication of this.analysisResults.potentialDuplications) {
      if (duplication.type === 'Service Classes') {
        for (const dup of duplication.duplications) {
          const serviceType = this.categorizeService(dup.className);
          serviceCounts[serviceType] = (serviceCounts[serviceType] || 0) + 1;
        }
      }
    }

    for (const [serviceType, count] of Object.entries(serviceCounts)) {
      if (count >= 3) {
        this.analysisResults.recommendations.push({
          type: 'new_base_class',
          priority: 'high',
          title: `Create Base${serviceType}Service`,
          description: `Found ${count} ${serviceType} services that could benefit from a common base class`,
          impact: 'high',
          effort: 'medium'
        });
      }
    }
  }

  /**
   * Categorize service by name
   */
  categorizeService(className) {
    if (className.includes('Data') || className.includes('Repository')) {
      return 'DataAccess';
    } else if (className.includes('Manager') || className.includes('Coordinator')) {
      return 'Manager';
    } else if (className.includes('Validator') || className.includes('Validator')) {
      return 'Validator';
    } else if (className.includes('Processor') || className.includes('Handler')) {
      return 'Processor';
    } else {
      return 'Service';
    }
  }

  /**
   * Analyze service consolidation opportunities
   */
  analyzeServiceConsolidation() {
    const similarServices = this.findSimilarServices();

    for (const group of similarServices) {
      if (group.services.length >= 2) {
        this.analysisResults.recommendations.push({
          type: 'service_consolidation',
          priority: 'medium',
          title: `Consolidate ${group.type} Services`,
          description: `Found ${group.services.length} similar ${group.type} services that could be consolidated`,
          services: group.services,
          impact: 'medium',
          effort: 'high'
        });
      }
    }
  }

  /**
   * Find similar services
   */
  findSimilarServices() {
    const groups = [];

    for (const duplication of this.analysisResults.potentialDuplications) {
      if (duplication.type === 'Service Classes') {
        const serviceGroups = {};

        for (const dup of duplication.duplications) {
          const category = this.categorizeService(dup.className);
          if (!serviceGroups[category]) {
            serviceGroups[category] = [];
          }
          serviceGroups[category].push(dup);
        }

        for (const [category, services] of Object.entries(serviceGroups)) {
          groups.push({
            type: category,
            services
          });
        }
      }
    }

    return groups;
  }

  /**
   * Analyze utility consolidation
   */
  analyzeUtilityConsolidation() {
    const utilityFiles = this.findFilesByPattern('./api/utils', /\.js$/);

    if (utilityFiles.length > 5) {
      this.analysisResults.recommendations.push({
        type: 'utility_consolidation',
        priority: 'low',
        title: 'Consolidate Utility Functions',
        description: `Found ${utilityFiles.length} utility files that could be organized better`,
        impact: 'low',
        effort: 'low'
      });
    }
  }

  /**
   * Analyze testing improvements
   */
  analyzeTestingImprovements() {
    const testFiles = this.findFilesByPattern('./test', /\.test\.js$/);
    const sourceFiles = this.findFilesByPattern('./api', /\.js$/);

    const testCoverage = (testFiles.length / sourceFiles.length) * 100;

    if (testCoverage < 50) {
      this.analysisResults.recommendations.push({
        type: 'testing_improvement',
        priority: 'high',
        title: 'Improve Test Coverage',
        description: `Current test coverage is ${testCoverage.toFixed(1)}%. Aim for at least 80% coverage.`,
        impact: 'high',
        effort: 'high'
      });
    }
  }

  /**
   * Display analysis results
   */
  displayResults() {
    console.log('\n📊 CODEBASE OPTIMIZATION ANALYSIS RESULTS\n');
    console.log('=' .repeat(60));

    // Summary
    console.log('\n📈 SUMMARY');
    console.log(`Total Files: ${this.analysisResults.totalFiles}`);
    console.log(`Total Lines: ${this.analysisResults.totalLines.toLocaleString()}`);
    console.log(`Potential Duplications: ${this.analysisResults.potentialDuplications.length} categories`);
    console.log(`Recommendations: ${this.analysisResults.recommendations.length} items`);

    // Base Class Usage
    console.log('\n🏗️ BASE CLASS USAGE');
    for (const [baseClass, usage] of Object.entries(this.analysisResults.baseClassUsage)) {
      console.log(`${baseClass}:`);
      console.log(`  Extends: ${usage.extends.length}`);
      console.log(`  Imports: ${usage.imports.length}`);
      console.log(`  References: ${usage.references.length}`);
    }

    // Potential Duplications
    if (this.analysisResults.potentialDuplications.length > 0) {
      console.log('\n🔍 POTENTIAL DUPLICATIONS');
      for (const duplication of this.analysisResults.potentialDuplications) {
        console.log(`${duplication.type}: ${duplication.duplications.length} instances`);
        for (const dup of duplication.duplications.slice(0, 3)) {
          console.log(`  - ${path.basename(dup.file)} (${dup.className})`);
        }
        if (duplication.duplications.length > 3) {
          console.log(`  ... and ${duplication.duplications.length - 3} more`);
        }
      }
    }

    // Recommendations
    if (this.analysisResults.recommendations.length > 0) {
      console.log('\n💡 OPTIMIZATION RECOMMENDATIONS');

      const byPriority = {
        high: [],
        medium: [],
        low: []
      };

      for (const rec of this.analysisResults.recommendations) {
        byPriority[rec.priority].push(rec);
      }

      for (const priority of ['high', 'medium', 'low']) {
        if (byPriority[priority].length > 0) {
          console.log(`\n${priority.toUpperCase()} PRIORITY:`);
          for (const rec of byPriority[priority]) {
            console.log(`🔸 ${rec.title}`);
            console.log(`   ${rec.description}`);
            console.log(`   Impact: ${rec.impact} | Effort: ${rec.effort}`);
          }
        }
      }
    }

    // Next Steps
    console.log('\n🚀 NEXT STEPS');
    console.log('1. Review high-priority recommendations');
    console.log('2. Plan implementation for new base classes');
    console.log('3. Consider service consolidation opportunities');
    console.log('4. Improve test coverage');
    console.log('5. Continue using established migration patterns');

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Analysis complete! Use these insights to guide future refactoring efforts.');
  }
}

// Run the analysis
if (require.main === module) {
  const optimizer = new CodebaseOptimizer();
  optimizer.analyzeCodebase().catch(console.error);
}

module.exports = CodebaseOptimizer;




