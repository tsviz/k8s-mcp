#!/usr/bin/env node

/**
 * Policy CLI Tool - Test and validate Kubernetes policies
 * 
 * Usage:
 *   npm run policy:check <namespace> <deployment>
 *   npm run policy:report [namespace]
 *   npm run policy:fix <namespace> <deployment> [--dry-run]
 *   npm run policy:rules [category]
 */

import { KubernetesService } from '../dist/kubernetes-service.js';
import { PolicyEngine } from '../dist/policy-engine.js';
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

async function initializeServices() {
  const k8sService = new KubernetesService();
  await k8sService.initialize();
  const policyEngine = new PolicyEngine(k8sService.getKubeConfig());
  return { k8sService, policyEngine };
}

program
  .name('policy-cli')
  .description('Kubernetes Policy as Code CLI')
  .version('1.0.0');

program
  .command('check')
  .description('Check deployment against policies')
  .argument('<namespace>', 'Kubernetes namespace')
  .argument('<deployment>', 'Deployment name')
  .action(async (namespace, deployment) => {
    try {
      console.log(chalk.blue('🔍 Evaluating policies...\n'));
      
      const { policyEngine } = await initializeServices();
      const result = await policyEngine.evaluateDeployment(namespace, deployment);
      
      console.log(chalk.bold(`📋 Policy Evaluation for ${deployment} in ${namespace}\n`));
      
      if (result.passed) {
        console.log(chalk.green('✅ PASSED - All policies compliant\n'));
      } else {
        console.log(chalk.red('❌ FAILED - Policy violations found\n'));
      }
      
      console.log(chalk.bold('Summary:'));
      console.log(`  Total Rules: ${result.summary.totalRules}`);
      console.log(`  Passed: ${chalk.green(result.summary.passedRules)}`);
      console.log(`  Failed: ${chalk.red(result.summary.failedRules)}\n`);
      
      if (result.violations.length > 0) {
        console.log(chalk.red.bold('🚨 Critical Violations:'));
        result.violations.forEach(v => {
          console.log(chalk.red(`  • ${v.ruleName} (${v.severity})`));
          console.log(`    ${v.message}`);
          if (v.canAutoFix) {
            console.log(chalk.blue('    🔧 Auto-fix available'));
          }
        });
        console.log();
      }
      
      if (result.warnings.length > 0) {
        console.log(chalk.yellow.bold('⚠️  Warnings:'));
        result.warnings.forEach(w => {
          console.log(chalk.yellow(`  • ${w.ruleName} (${w.severity})`));
          console.log(`    ${w.message}`);
          if (w.canAutoFix) {
            console.log(chalk.blue('    🔧 Auto-fix available'));
          }
        });
        console.log();
      }
      
      const autoFixable = [...result.violations, ...result.warnings].filter(v => v.canAutoFix);
      if (autoFixable.length > 0) {
        console.log(chalk.blue(`💡 ${autoFixable.length} violations can be auto-fixed. Run:`));
        console.log(chalk.blue(`   policy-cli fix ${namespace} ${deployment}`));
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate compliance report')
  .argument('[namespace]', 'Optional namespace (default: entire cluster)')
  .action(async (namespace) => {
    try {
      console.log(chalk.blue('📊 Generating compliance report...\n'));
      
      const { policyEngine } = await initializeServices();
      const report = await policyEngine.generateComplianceReport(namespace);
      
      console.log(chalk.bold(`📊 Compliance Report for ${namespace || 'Entire Cluster'}\n`));
      console.log(`Generated: ${report.timestamp}`);
      console.log(`Cluster: ${report.cluster}`);
      
      const complianceColor = report.overallCompliance >= 90 ? 'green' : 
                             report.overallCompliance >= 70 ? 'yellow' : 'red';
      console.log(`Overall Compliance: ${chalk[complianceColor](report.overallCompliance + '%')}\n`);
      
      console.log(chalk.bold('Policy Evaluation Summary:'));
      console.log(`  Total Rules: ${report.results.summary.totalRules}`);
      console.log(`  Passed: ${chalk.green(report.results.summary.passedRules)}`);
      console.log(`  Failed: ${chalk.red(report.results.summary.failedRules)}\n`);
      
      if (Object.keys(report.results.summary.violationsBySeverity).length > 0) {
        console.log(chalk.bold('Violations by Severity:'));
        Object.entries(report.results.summary.violationsBySeverity).forEach(([severity, count]) => {
          const color = severity === 'critical' ? 'red' : 
                       severity === 'high' ? 'red' :
                       severity === 'medium' ? 'yellow' : 'blue';
          console.log(`  ${chalk[color](severity.toUpperCase())}: ${count}`);
        });
        console.log();
      }
      
      if (report.recommendations.length > 0) {
        console.log(chalk.bold('📋 Recommendations:'));
        report.recommendations.forEach(rec => {
          console.log(`  • ${rec}`);
        });
        console.log();
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('fix')
  .description('Auto-fix policy violations')
  .argument('<namespace>', 'Kubernetes namespace')
  .argument('<deployment>', 'Deployment name')
  .option('--dry-run', 'Preview changes without applying')
  .action(async (namespace, deployment, options) => {
    try {
      const dryRun = options.dryRun || false;
      
      console.log(chalk.blue(`🔧 ${dryRun ? 'Previewing' : 'Applying'} auto-fixes...\n`));
      
      const { policyEngine } = await initializeServices();
      
      // First evaluate to get violations
      const evaluation = await policyEngine.evaluateDeployment(namespace, deployment);
      const fixableViolations = [...evaluation.violations, ...evaluation.warnings].filter(v => v.canAutoFix);
      
      if (fixableViolations.length === 0) {
        console.log(chalk.green('✅ No auto-fixable violations found'));
        return;
      }
      
      if (dryRun) {
        console.log(chalk.bold(`🔍 Dry Run: Auto-Fix Preview for ${deployment} in ${namespace}\n`));
        console.log(`Fixable Violations Found: ${fixableViolations.length}\n`);
        
        console.log(chalk.bold('Planned Fixes:'));
        fixableViolations.forEach(v => {
          console.log(chalk.yellow(`  • ${v.ruleName} (${v.severity})`));
          console.log(`    Issue: ${v.message}`);
          console.log(`    Field: ${v.field}`);
          console.log(`    Current: ${v.currentValue}`);
          if (v.suggestedValue) {
            console.log(`    Will Set To: ${v.suggestedValue}`);
          }
        });
        
        console.log(chalk.blue('\n💡 Run without --dry-run to apply these fixes'));
        return;
      }
      
      // Apply fixes
      const fixResult = await policyEngine.autoFixViolations(namespace, deployment, fixableViolations);
      
      console.log(chalk.bold(`🔧 Auto-Fix Results for ${deployment} in ${namespace}\n`));
      console.log(`Total Violations: ${fixableViolations.length}`);
      console.log(`Successfully Fixed: ${chalk.green(fixResult.fixed)}`);
      console.log(`Failed to Fix: ${chalk.red(fixResult.failed)}\n`);
      
      if (fixResult.fixed > 0) {
        console.log(chalk.green('✅ Successfully Applied Fixes:'));
        fixableViolations.slice(0, fixResult.fixed).forEach(v => {
          console.log(chalk.green(`  • ${v.ruleName}: ${v.message}`));
        });
        console.log(chalk.blue('\n🔄 Deployment rollout triggered with policy fixes'));
      }
      
      if (fixResult.failed > 0) {
        console.log(chalk.red('\n❌ Failed Fixes:'));
        fixResult.errors.forEach(error => {
          console.log(chalk.red(`  • ${error}`));
        });
      }
      
      console.log(chalk.blue('\n📋 Next Steps:'));
      console.log('  1. Monitor the deployment rollout');
      console.log('  2. Re-run policy evaluation to confirm fixes');
      console.log('  3. Address any remaining manual violations');
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('rules')
  .description('List available policy rules')
  .argument('[category]', 'Optional category filter (security, compliance, performance, cost, operations)')
  .action(async (category) => {
    try {
      const { policyEngine } = await initializeServices();
      const rules = category ? policyEngine.getRulesByCategory(category) : policyEngine.getRules();
      
      if (rules.length === 0) {
        console.log(chalk.yellow(`No rules found${category ? ` in category "${category}"` : ''}`));
        return;
      }
      
      console.log(chalk.bold(`📋 Policy Rules${category ? ` - ${category.toUpperCase()}` : ''} (${rules.length} total)\n`));
      
      const enabledCount = rules.filter(r => r.enabled).length;
      console.log(`Enabled: ${chalk.green(enabledCount)} | Disabled: ${chalk.red(rules.length - enabledCount)}\n`);
      
      rules.forEach(rule => {
        const statusIcon = rule.enabled ? chalk.green('✅') : chalk.red('❌');
        const severityColor = rule.severity === 'critical' ? 'red' :
                             rule.severity === 'high' ? 'red' :
                             rule.severity === 'medium' ? 'yellow' : 'blue';
        
        console.log(`${statusIcon} ${chalk.bold(rule.id)}: ${rule.name}`);
        console.log(`   Category: ${rule.category} | Severity: ${chalk[severityColor](rule.severity)}`);
        console.log(`   Description: ${rule.description}`);
        console.log(`   Scope: ${rule.scope} | Auto-fix: ${rule.actions.some(a => a.autoFix) ? 'Yes' : 'No'}`);
        console.log();
      });
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();
