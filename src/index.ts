import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { KubernetesService } from "./kubernetes-service.js";
import { PolicyEngine } from "./policy-engine.js";
import * as fs from 'fs';
import * as path from 'path';

/**
 * Kubernetes Deployment MCP Server
 * 
 * This server provides AI-driven automation tools for managing Kubernetes deployments.
 * It exposes 9 core tools for deployment lifecycle management:
 * 
 * 1. get_cluster_info - Get cluster connection and basic information
 * 2. list_namespaces - List all namespaces with deployment counts
 * 3. list_deployments - List all deployments (optionally filtered by namespace)
 * 4. get_deployment_status - Check deployment health and status
 * 5. scale_deployment - Horizontally scale deployments
 * 6. toggle_feature_flag - Enable/disable feature flags
 * 7. rollback_deployment - Rollback to previous deployment version
 * 8. deploy_version - Deploy a specific version
 * 9. get_pod_logs - Retrieve pod logs for debugging
 */

async function main() {
  // Create MCP server instance
  const server = new McpServer({
    name: "k8s-deployment-server",
    version: "1.0.0"
  });

  // Initialize Kubernetes service
  const k8sService = new KubernetesService();
  await k8sService.initialize();

  // Initialize Policy Engine with optional configuration
  const policyConfigPath = process.env.POLICY_CONFIG_PATH || 
                           process.env.NODE_ENV === 'production' ? './config/policies/production.json' :
                           process.env.NODE_ENV === 'development' ? './config/policies/development.json' :
                           undefined;
  
  const policyEngine = new PolicyEngine(k8sService.getKubeConfig(), policyConfigPath);

  // Tool 1: Get Cluster Info
  server.registerTool(
    "get_cluster_info",
    {
      title: "Get Cluster Info",
      description: "Retrieves cluster connection information, version, and basic statistics",
      inputSchema: {}
    },
    async () => {
      try {
        const clusterInfo = await k8sService.getClusterInfo();
        
        return {
          content: [{
            type: "text",
            text: `🔗 **Kubernetes Cluster Information**

**Connection Details:**
- **Cluster Name**: ${clusterInfo.clusterName}
- **Server URL**: ${clusterInfo.serverUrl}
- **Current Context**: ${clusterInfo.currentContext}
- **User**: ${clusterInfo.user}

**Cluster Statistics:**
- **Kubernetes Version**: ${clusterInfo.kubernetesVersion}
- **Node Count**: ${clusterInfo.nodeCount}
- **Namespace Count**: ${clusterInfo.namespaceCount}

✅ **Status**: Connected and operational`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error getting cluster information: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 2: List Namespaces
  server.registerTool(
    "list_namespaces",
    {
      title: "List Namespaces",
      description: "Lists all namespaces in the cluster with deployment counts and basic information",
      inputSchema: {}
    },
    async () => {
      try {
        const namespaces = await k8sService.listNamespaces();
        
        return {
          content: [{
            type: "text",
            text: `📋 **Kubernetes Namespaces** (${namespaces.length} total)

${namespaces.map(ns => `**${ns.name}**
- Status: ${ns.status}
- Deployments: ${ns.deploymentCount}
- Created: ${ns.creationTimestamp}`).join('\n\n')}

💡 **Tip**: Use the namespace name with other tools to manage specific deployments.`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error listing namespaces: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 3: List Deployments
  server.registerTool(
    "list_deployments",
    {
      title: "List Deployments",
      description: "Lists all deployments in the cluster or a specific namespace with health status",
      inputSchema: {
        namespace: z.string().optional().describe("Optional: specific namespace to filter deployments")
      }
    },
    async ({ namespace }) => {
      try {
        const deployments = await k8sService.listDeployments(namespace);
        
        if (deployments.length === 0) {
          return {
            content: [{
              type: "text",
              text: `📝 No deployments found${namespace ? ` in namespace "${namespace}"` : ' in the cluster'}.`
            }]
          };
        }

        const healthyCount = deployments.filter(d => d.health === 'Healthy').length;
        const unhealthyCount = deployments.filter(d => d.health === 'Unhealthy').length;
        const progressingCount = deployments.filter(d => d.health === 'Progressing').length;
        
        return {
          content: [{
            type: "text",
            text: `🚀 **Kubernetes Deployments**${namespace ? ` in namespace "${namespace}"` : ''} (${deployments.length} total)

**Health Summary:**
- ✅ Healthy: ${healthyCount}
- ⚠️ Progressing: ${progressingCount}
- ❌ Unhealthy: ${unhealthyCount}

**Deployment Details:**
${deployments.map(d => `**${d.name}** (${d.namespace})
- Health: ${d.health === 'Healthy' ? '✅' : d.health === 'Progressing' ? '⚠️' : '❌'} ${d.health}
- Replicas: ${d.readyReplicas}/${d.replicas}
- Image: ${d.currentImage}
- Created: ${d.creationTimestamp}`).join('\n\n')}

💡 **Tip**: Use deployment name and namespace with other tools for management operations.`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error listing deployments: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 4: Get Deployment Status
  server.registerTool(
    "get_deployment_status",
    {
      title: "Get Deployment Status",
      description: "Retrieves the current status of a Kubernetes deployment including replicas, conditions, and health metrics",
      inputSchema: {
        namespace: z.string().describe("Kubernetes namespace where the deployment resides"),
        deployment: z.string().describe("Name of the deployment to check"),
        includeEvents: z.boolean().optional().describe("Include recent events in the response (default: false)")
      }
    },
    async ({ namespace, deployment, includeEvents = false }) => {
      try {
        const status = await k8sService.getDeploymentStatus(namespace, deployment, includeEvents);
        
        return {
          content: [{
            type: "text",
            text: `Deployment Status for ${deployment} in ${namespace}:
            
📊 **Replica Status**: ${status.readyReplicas}/${status.replicas} ready
🏥 **Health**: ${status.health}
📅 **Last Updated**: ${status.lastUpdateTime}
⚡ **Rollout Status**: ${status.rolloutStatus}
🏷️ **Current Image**: ${status.currentImage}

**Conditions:**
${status.conditions.map(c => `- ${c.type}: ${c.status} (${c.reason})`).join('\n')}

${includeEvents && status.events ? `
**Recent Events:**
${status.events.map(e => `- ${e.type}: ${e.reason} - ${e.message}`).join('\n')}
` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error getting deployment status: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 5: Scale Deployment
  server.registerTool(
    "scale_deployment",
    {
      title: "Scale Deployment",
      description: "Horizontally scales a Kubernetes deployment to the specified number of replicas",
      inputSchema: {
        namespace: z.string().describe("Kubernetes namespace where the deployment resides"),
        deployment: z.string().describe("Name of the deployment to scale"),
        replicas: z.number().min(0).describe("Target number of replicas"),
        waitForReady: z.boolean().optional().describe("Wait for all replicas to be ready before returning (default: true)")
      }
    },
    async ({ namespace, deployment, replicas, waitForReady = true }) => {
      try {
        const result = await k8sService.scaleDeployment(namespace, deployment, replicas, waitForReady);
        
        return {
          content: [{
            type: "text",
            text: `✅ Successfully scaled deployment ${deployment} in ${namespace}:

📈 **Scale Change**: ${result.previousReplicas} → ${replicas} replicas
⏱️ **Duration**: ${result.scaleDuration}ms
🎯 **Status**: ${waitForReady ? 'All replicas ready' : 'Scale initiated'}
📊 **Current State**: ${result.currentReplicas}/${replicas} ready

${result.warnings.length > 0 ? `
⚠️ **Warnings:**
${result.warnings.map(w => `- ${w}`).join('\n')}
` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error scaling deployment: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 6: Toggle Feature Flag
  server.registerTool(
    "toggle_feature_flag",
    {
      title: "Toggle Feature Flag",
      description: "Enables or disables a feature flag by updating deployment environment variables or ConfigMaps",
      inputSchema: {
        namespace: z.string().describe("Kubernetes namespace where the deployment resides"),
        deployment: z.string().describe("Name of the deployment to update"),
        flagName: z.string().describe("Name of the feature flag to toggle"),
        enabled: z.boolean().describe("Whether to enable (true) or disable (false) the feature flag"),
        flagType: z.enum(["env_var", "configmap"]).optional().describe("How the flag is stored: environment variable or ConfigMap (default: env_var)")
      }
    },
    async ({ namespace, deployment, flagName, enabled, flagType = "env_var" }) => {
      try {
        const result = await k8sService.toggleFeatureFlag(namespace, deployment, flagName, enabled, flagType);
        
        return {
          content: [{
            type: "text",
            text: `🚩 Feature flag ${flagName} has been ${enabled ? 'ENABLED' : 'DISABLED'}:

🎯 **Deployment**: ${deployment} (${namespace})
🏷️ **Flag Name**: ${flagName}
📝 **Flag Type**: ${flagType}
⚡ **New Value**: ${enabled}
🔄 **Rollout Status**: ${result.rolloutTriggered ? 'New rollout triggered' : 'No rollout needed'}
⏱️ **Applied At**: ${result.timestamp}

${result.additionalInfo ? `
📋 **Additional Info**: ${result.additionalInfo}
` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error toggling feature flag: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 7: Rollback Deployment
  server.registerTool(
    "rollback_deployment",
    {
      title: "Rollback Deployment",
      description: "Rolls back a Kubernetes deployment to a previous revision or specific version",
      inputSchema: {
        namespace: z.string().describe("Kubernetes namespace where the deployment resides"),
        deployment: z.string().describe("Name of the deployment to rollback"),
        revision: z.number().optional().describe("Specific revision number to rollback to (if not provided, rolls back to previous revision)"),
        waitForRollback: z.boolean().optional().describe("Wait for rollback to complete before returning (default: true)")
      }
    },
    async ({ namespace, deployment, revision, waitForRollback = true }) => {
      try {
        const result = await k8sService.rollbackDeployment(namespace, deployment, revision, waitForRollback);
        
        return {
          content: [{
            type: "text",
            text: `🔄 Deployment rollback completed for ${deployment} in ${namespace}:

📈 **Revision Change**: ${result.fromRevision} → ${result.toRevision}
🏷️ **Previous Image**: ${result.previousImage}
🎯 **Rolled Back To**: ${result.rolledBackImage}
⏱️ **Rollback Duration**: ${result.rollbackDuration}ms
✅ **Status**: ${waitForRollback ? 'Rollback completed successfully' : 'Rollback initiated'}

**Rollback Details:**
- **Reason**: ${result.rollbackReason}
- **Timestamp**: ${result.timestamp}
- **Replicas**: ${result.targetReplicas}

${result.warnings.length > 0 ? `
⚠️ **Warnings:**
${result.warnings.map(w => `- ${w}`).join('\n')}
` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error rolling back deployment: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 8: Deploy Version
  server.registerTool(
    "deploy_version",
    {
      title: "Deploy Version",
      description: "Deploys a specific version/image of an application to a Kubernetes deployment",
      inputSchema: {
        namespace: z.string().describe("Kubernetes namespace where the deployment resides"),
        deployment: z.string().describe("Name of the deployment to update"),
        image: z.string().describe("Docker image URL with tag (e.g., 'myapp:v1.2.3')"),
        strategy: z.enum(["RollingUpdate", "Recreate"]).optional().describe("Deployment strategy (default: RollingUpdate)"),
        waitForDeployment: z.boolean().optional().describe("Wait for deployment to complete before returning (default: true)")
      }
    },
    async ({ namespace, deployment, image, strategy = "RollingUpdate", waitForDeployment = true }) => {
      try {
        const result = await k8sService.deployVersion(namespace, deployment, image, strategy, waitForDeployment);
        
        return {
          content: [{
            type: "text",
            text: `🚀 Deployment ${deployment} updated successfully in ${namespace}:

🏷️ **Image Change**: 
  - **From**: ${result.previousImage}
  - **To**: ${result.newImage}

📈 **Revision**: ${result.previousRevision} → ${result.newRevision}
⚡ **Strategy**: ${strategy}
⏱️ **Deploy Duration**: ${result.deployDuration}ms
✅ **Status**: ${waitForDeployment ? 'Deployment completed successfully' : 'Deployment initiated'}

**Deployment Progress:**
- **Total Replicas**: ${result.targetReplicas}
- **Available Replicas**: ${result.availableReplicas}
- **Updated Replicas**: ${result.updatedReplicas}
- **Ready Replicas**: ${result.readyReplicas}

${result.deploymentEvents.length > 0 ? `
**Recent Deployment Events:**
${result.deploymentEvents.map(e => `- ${e.type}: ${e.message}`).join('\n')}
` : ''}

${result.warnings.length > 0 ? `
⚠️ **Warnings:**
${result.warnings.map(w => `- ${w}`).join('\n')}
` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error deploying version: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 9: Get Pod Logs
  server.registerTool(
    "get_pod_logs",
    {
      title: "Get Pod Logs",
      description: "Retrieves logs from pods in a deployment for debugging and monitoring purposes",
      inputSchema: {
        namespace: z.string().describe("Kubernetes namespace where the pods reside"),
        deployment: z.string().describe("Name of the deployment to get logs from"),
        lines: z.number().optional().describe("Number of recent log lines to retrieve (default: 100)"),
        container: z.string().optional().describe("Specific container name (if pod has multiple containers)"),
        previous: z.boolean().optional().describe("Get logs from previous container instance (default: false)"),
        follow: z.boolean().optional().describe("Follow log stream (default: false)")
      }
    },
    async ({ namespace, deployment, lines = 100, container, previous = false, follow = false }) => {
      try {
        const result = await k8sService.getPodLogs(namespace, deployment, {
          lines,
          container,
          previous,
          follow
        });
        
        return {
          content: [{
            type: "text",
            text: `📋 Logs for deployment ${deployment} in ${namespace}:

🔍 **Query Parameters:**
- **Lines**: ${lines}
- **Container**: ${container || 'default'}
- **Previous Instance**: ${previous}
- **Pods Found**: ${result.podLogs.length}

${result.podLogs.map(podLog => `
**Pod: ${podLog.podName}**
${podLog.containerLogs.map(containerLog => `
**Container: ${containerLog.containerName}**
\`\`\`
${containerLog.logs}
\`\`\`
${containerLog.truncated ? '... (logs truncated)' : ''}
`).join('\n')}
`).join('\n')}

${result.warnings.length > 0 ? `
⚠️ **Warnings:**
${result.warnings.map(w => `- ${w}`).join('\n')}
` : ''}

${result.errors.length > 0 ? `
❌ **Errors:**
${result.errors.map(e => `- ${e}`).join('\n')}
` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error getting pod logs: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 10: Evaluate Deployment Policies
  server.registerTool(
    "evaluate_deployment_policies",
    {
      title: "Evaluate Deployment Policies",
      description: "Evaluates a deployment against organizational policies and governance rules",
      inputSchema: {
        namespace: z.string().describe("Kubernetes namespace where the deployment resides"),
        deployment: z.string().describe("Name of the deployment to evaluate")
      }
    },
    async ({ namespace, deployment }) => {
      try {
        const result = await policyEngine.evaluateDeployment(namespace, deployment);
        
        const severityEmojis = {
          low: '🟡',
          medium: '🟠', 
          high: '🔴',
          critical: '🚨'
        };

        return {
          content: [{
            type: "text",
            text: `📋 **Policy Evaluation for ${deployment} in ${namespace}**

**Overall Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}

**Summary:**
- **Total Rules**: ${result.summary.totalRules}
- **Passed**: ${result.summary.passedRules} ✅
- **Failed**: ${result.summary.failedRules} ❌

**Violations by Severity:**
${Object.entries(result.summary.violationsBySeverity).map(([severity, count]) => 
  `- ${severityEmojis[severity as keyof typeof severityEmojis] || '⚪'} ${severity}: ${count}`
).join('\n')}

**Violations by Category:**
${Object.entries(result.summary.violationsByCategory).map(([category, count]) => 
  `- ${category}: ${count}`
).join('\n')}

${result.violations.length > 0 ? `
**🚨 Critical Violations (Action Required):**
${result.violations.map(v => `
**${v.ruleName}** (${v.severity})
- **Category**: ${v.category}
- **Field**: ${v.field}
- **Issue**: ${v.message}
- **Current**: ${v.currentValue}
${v.suggestedValue ? `- **Suggested**: ${v.suggestedValue}` : ''}
- **Auto-fix**: ${v.canAutoFix ? '✅ Available' : '❌ Manual fix required'}
`).join('\n')}
` : ''}

${result.warnings.length > 0 ? `
**⚠️ Warnings (Recommended Fixes):**
${result.warnings.map(v => `
**${v.ruleName}** (${v.severity})
- **Category**: ${v.category}
- **Issue**: ${v.message}
- **Auto-fix**: ${v.canAutoFix ? '✅ Available' : '❌ Manual fix required'}
`).join('\n')}
` : ''}

${result.violations.some(v => v.canAutoFix) || result.warnings.some(v => v.canAutoFix) ? `
💡 **Tip**: Use the \`auto_fix_policy_violations\` tool to automatically fix violations where possible.
` : ''}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error evaluating policies: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 11: Generate Compliance Report
  server.registerTool(
    "generate_compliance_report",
    {
      title: "Generate Compliance Report",
      description: "Generates a comprehensive compliance report for a namespace or entire cluster",
      inputSchema: {
        namespace: z.string().optional().describe("Optional: specific namespace to analyze (if not provided, analyzes entire cluster)")
      }
    },
    async ({ namespace }) => {
      try {
        const report = await policyEngine.generateComplianceReport(namespace);
        
        return {
          content: [{
            type: "text",
            text: `📊 **Compliance Report for ${namespace || 'Entire Cluster'}**

**Generated**: ${report.timestamp}
**Cluster**: ${report.cluster}
**Overall Compliance**: ${report.overallCompliance}% ${report.overallCompliance >= 90 ? '🟢' : report.overallCompliance >= 70 ? '🟡' : '🔴'}

**Policy Evaluation Summary:**
- **Total Rules Evaluated**: ${report.results.summary.totalRules}
- **Rules Passed**: ${report.results.summary.passedRules} ✅
- **Rules Failed**: ${report.results.summary.failedRules} ❌

**Violations by Severity:**
${Object.entries(report.results.summary.violationsBySeverity).map(([severity, count]) => {
  const emoji = severity === 'critical' ? '🚨' : severity === 'high' ? '🔴' : severity === 'medium' ? '🟠' : '🟡';
  return `- ${emoji} ${severity.toUpperCase()}: ${count}`;
}).join('\n')}

**Violations by Category:**
${Object.entries(report.results.summary.violationsByCategory).map(([category, count]) => 
  `- **${category.charAt(0).toUpperCase() + category.slice(1)}**: ${count}`
).join('\n')}

${report.results.violations.length > 0 ? `
**🚨 Critical Issues Requiring Immediate Attention:**
${report.results.violations.slice(0, 5).map(v => `
- **${v.resource.name}** (${v.resource.namespace || 'default'}): ${v.ruleName}
  ${v.message}
`).join('\n')}
${report.results.violations.length > 5 ? `... and ${report.results.violations.length - 5} more critical issues` : ''}
` : ''}

**📋 Recommendations:**
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

**Next Steps:**
1. 🔧 Address critical violations immediately
2. ⚠️ Review and fix warnings during next maintenance window
3. 📈 Implement continuous compliance monitoring
4. 🎯 Target ${Math.min(100, report.overallCompliance + 10)}% compliance in next review`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error generating compliance report: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 12: Auto-Fix Policy Violations
  server.registerTool(
    "auto_fix_policy_violations",
    {
      title: "Auto-Fix Policy Violations",
      description: "Automatically fixes policy violations where possible for a specific deployment",
      inputSchema: {
        namespace: z.string().describe("Kubernetes namespace where the deployment resides"),
        deployment: z.string().describe("Name of the deployment to fix"),
        dryRun: z.boolean().optional().describe("Preview changes without applying them (default: false)")
      }
    },
    async ({ namespace, deployment, dryRun = false }) => {
      try {
        // First evaluate to get violations
        const evaluation = await policyEngine.evaluateDeployment(namespace, deployment);
        const fixableViolations = [...evaluation.violations, ...evaluation.warnings].filter(v => v.canAutoFix);
        
        if (fixableViolations.length === 0) {
          return {
            content: [{
              type: "text",
              text: `ℹ️ **No Auto-Fixable Violations Found**

The deployment ${deployment} in ${namespace} has no violations that can be automatically fixed.

**Current Status:**
- Total violations: ${evaluation.violations.length + evaluation.warnings.length}
- Auto-fixable: 0
- Manual fixes required: ${evaluation.violations.length + evaluation.warnings.length}

${evaluation.violations.length + evaluation.warnings.length > 0 ? 
  'Please review the violations using the `evaluate_deployment_policies` tool and apply manual fixes.' : 
  '✅ All policies are compliant!'}`
            }]
          };
        }

        if (dryRun) {
          return {
            content: [{
              type: "text",
              text: `🔍 **Dry Run: Auto-Fix Preview for ${deployment} in ${namespace}**

**Fixable Violations Found**: ${fixableViolations.length}

**Planned Fixes:**
${fixableViolations.map(v => `
**${v.ruleName}** (${v.severity})
- **Issue**: ${v.message}
- **Field**: ${v.field}
- **Current Value**: ${v.currentValue}
${v.suggestedValue ? `- **Will Set To**: ${v.suggestedValue}` : ''}
- **Fix Action**: Auto-remediation available
`).join('\n')}

💡 **Note**: This is a preview. Run again with dryRun=false to apply these fixes.`
            }]
          };
        }

        // Apply fixes
        const fixResult = await policyEngine.autoFixViolations(namespace, deployment, fixableViolations);
        
        return {
          content: [{
            type: "text",
            text: `🔧 **Auto-Fix Results for ${deployment} in ${namespace}**

**Summary:**
- **Total Violations**: ${fixableViolations.length}
- **Successfully Fixed**: ${fixResult.fixed} ✅
- **Failed to Fix**: ${fixResult.failed} ❌

${fixResult.fixed > 0 ? `
✅ **Successfully Applied Fixes:**
${fixableViolations.slice(0, fixResult.fixed).map(v => `- ${v.ruleName}: ${v.message}`).join('\n')}

🔄 **Deployment Updated**: A new rollout has been triggered with the policy fixes.
` : ''}

${fixResult.failed > 0 ? `
❌ **Failed Fixes:**
${fixResult.errors.map(error => `- ${error}`).join('\n')}
` : ''}

**Next Steps:**
1. 🔍 Monitor the deployment rollout
2. ✅ Re-run policy evaluation to confirm fixes
3. 📋 Address any remaining manual violations`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error auto-fixing violations: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 13: List Policy Rules
  server.registerTool(
    "list_policy_rules",
    {
      title: "List Policy Rules",
      description: "Lists all available policy rules with their configuration and status",
      inputSchema: {
        category: z.string().optional().describe("Optional: filter by policy category (security, compliance, performance, cost, operations)")
      }
    },
    async ({ category }) => {
      try {
        const rules = category ? policyEngine.getRulesByCategory(category) : policyEngine.getRules();
        
        if (rules.length === 0) {
          return {
            content: [{
              type: "text",
              text: `📝 No policy rules found${category ? ` in category "${category}"` : ''}.`
            }]
          };
        }

        const enabledCount = rules.filter(r => r.enabled).length;
        const disabledCount = rules.filter(r => !r.enabled).length;
        
        const severityEmojis = {
          low: '🟡',
          medium: '🟠',
          high: '🔴', 
          critical: '🚨'
        };

        const categoryEmojis = {
          security: '🔒',
          compliance: '📋',
          performance: '📊',
          cost: '💰',
          operations: '⚙️'
        };

        return {
          content: [{
            type: "text",
            text: `📋 **Policy Rules${category ? ` - ${category.toUpperCase()} Category` : ''}** (${rules.length} total)

**Summary:**
- ✅ Enabled: ${enabledCount}
- ❌ Disabled: ${disabledCount}

**Rules:**
${rules.map(rule => `
**${rule.id}**: ${rule.name} ${rule.enabled ? '✅' : '❌'}
- ${categoryEmojis[rule.category as keyof typeof categoryEmojis] || '📝'} **Category**: ${rule.category}
- ${severityEmojis[rule.severity as keyof typeof severityEmojis] || '⚪'} **Severity**: ${rule.severity}
- 📝 **Description**: ${rule.description}
- 🎯 **Scope**: ${rule.scope}
- 🔧 **Auto-fix**: ${rule.actions.some(a => a.autoFix) ? 'Available' : 'Not available'}
${rule.metadata ? `- 📋 **Metadata**: ${Object.entries(rule.metadata).map(([k, v]) => `${k}=${v}`).join(', ')}` : ''}
`).join('\n')}

💡 **Tip**: Use \`evaluate_deployment_policies\` to check how these rules apply to your deployments.`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error listing policy rules: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 14: Generate Policy Configuration (natural language friendly)
  server.registerTool(
    "generate_policy_configuration",
    {
      title: "Generate Policy Configuration",
      description: "Creates a policy configuration JSON based on high-level organizational requirements",
      inputSchema: {
        organizationName: z.string().describe("Name of the organization"),
        environment: z.enum(["development","staging","production"]).describe("Target environment"),
        securityLevel: z.enum(["low","medium","high","strict"]).optional().describe("Desired security strictness (default: medium)"),
        enableCategories: z.array(z.enum(["security","compliance","performance","cost","operations"]).describe('Policy category')).optional().describe("Categories to enable (default: all except cost)"),
        complianceFramework: z.enum(["basic","hipaa","pci-dss","soc2","custom"]).optional().describe("Optional compliance framework baseline"),
        mixedEnforcement: z.boolean().optional().describe("If true, security strict + advisory others")
      }
    },
    async ({ organizationName, environment, securityLevel = 'medium', enableCategories, complianceFramework = 'basic', mixedEnforcement = true }) => {
      try {
        const categories = enableCategories && enableCategories.length > 0 ? enableCategories : ["security","compliance","performance","operations"]; // omit cost by default

        const base = {
          organization: { name: organizationName, environment },
          global: {
            enforcement: mixedEnforcement ? 'advisory' : (securityLevel === 'strict' ? 'strict' : 'advisory'),
            autoFix: environment === 'development',
            excludedNamespaces: ["kube-system","kube-public","kube-node-lease"]
          },
          categories: {} as any,
          ruleOverrides: {} as any
        };

        categories.forEach(c => {
          base.categories[c] = {
            enabled: true,
            enforcement: (c === 'security' && (securityLevel === 'high' || securityLevel === 'strict')) ? 'strict' : 'advisory',
            autoFix: environment !== 'production'
          };
        });

        // Compliance framework presets
        if (categories.includes('compliance')) {
          if (complianceFramework === 'hipaa') {
            base.ruleOverrides['sec-001'] = { enforcement: 'strict' };
            base.ruleOverrides['sec-002'] = { enforcement: 'strict' };
            base.ruleOverrides['comp-001'] = { enabled: true };
          } else if (complianceFramework === 'pci-dss') {
            base.ruleOverrides['sec-001'] = { enforcement: 'strict' };
            base.ruleOverrides['sec-003'] = { enforcement: 'strict' };
            base.ruleOverrides['comp-002'] = { enabled: true };
          } else if (complianceFramework === 'soc2') {
            base.ruleOverrides['ops-001'] = { enforcement: 'strict' };
          }
        }

        const json = JSON.stringify(base, null, 2);
        const summary = `Security Level: ${securityLevel}\nCompliance Framework: ${complianceFramework}\nCategories Enabled: ${categories.join(', ')}`;

        return {
          content: [{
            type: 'text',
            text: `🏗️ Generated Policy Configuration\n\n${'```json'}\n${json}\n${'```'}\n\n${summary}\n\nNext: Ask "Validate this config" or save to a file and run validation.`
          }]
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Error generating configuration: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }
  );

  // Tool 15: Validate Policy Configuration (path based)
  server.registerTool(
    "validate_policy_configuration",
    {
      title: "Validate Policy Configuration",
      description: "Validates a policy configuration file for structure and rule references",
      inputSchema: {
        configPath: z.string().describe('Path to policy configuration JSON file')
      }
    },
    async ({ configPath }) => {
      try {
        if (!fs.existsSync(configPath)) {
          return { content: [{ type: 'text', text: `❌ File not found: ${configPath}` }], isError: true };
        }
        const raw = fs.readFileSync(configPath, 'utf8');
        const parsed = JSON.parse(raw);
        const report = policyEngine.validateConfiguration(parsed);
        return {
          content: [{
            type: 'text',
            text: `🧪 Validation Report for ${configPath}\nStatus: ${report.isValid ? '✅ VALID' : '❌ INVALID'}\n${report.errors?.length ? '\nErrors:\n- ' + report.errors.join('\n- ') : ''}${report.warnings?.length ? '\nWarnings:\n- ' + report.warnings.join('\n- ') : ''}\n` 
          }]
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Error validating configuration: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }
  );

  // Tool 16: Preview Policy Impact (what-if)
  server.registerTool(
    "preview_policy_impact",
    {
      title: "Preview Policy Impact",
      description: "Simulates applying a policy config and compares compliance vs current configuration",
      inputSchema: {
        configPath: z.string().describe('Path to alternative policy configuration'),
        namespace: z.string().optional().describe('Optional namespace to scope preview')
      }
    },
    async ({ configPath, namespace }) => {
      try {
        if (!fs.existsSync(configPath)) {
          return { content: [{ type: 'text', text: `❌ File not found: ${configPath}` }], isError: true };
        }
        const altEngine = new PolicyEngine(k8sService.getKubeConfig(), configPath);
        const currentReport = await policyEngine.generateComplianceReport(namespace);
        const altReport = await altEngine.generateComplianceReport(namespace);
        const delta = (altReport.overallCompliance - currentReport.overallCompliance).toFixed(2);
        return {
          content: [{
            type: 'text',
            text: `🔍 Policy Impact Preview (${namespace || 'cluster'})\nCurrent Compliance: ${currentReport.overallCompliance}%\nProposed Compliance: ${altReport.overallCompliance}%\nChange: ${delta}% ${parseFloat(delta) >= 0 ? '📈' : '📉'}\nNew Failed Rules: ${altReport.results.summary.failedRules}\nPrior Failed Rules: ${currentReport.results.summary.failedRules}\nTop New Violations: ${altReport.results.violations.slice(0,3).map(v=>v.ruleId).join(', ') || 'None'}\nRecommendation: ${parseFloat(delta) > 5 ? 'Adopt configuration (significant improvement)' : parseFloat(delta) < -5 ? 'Reconsider (reduces compliance)' : 'Minor change – optional'}\n` 
          }]
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Error previewing impact: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }
  );

  // Tool 17: Suggest Rule Customizations (natural language helper)
  server.registerTool(
    "suggest_policy_customizations",
    {
      title: "Suggest Policy Customizations",
      description: "Analyzes violations to recommend rule overrides (enable/disable/strict/advisory)",
      inputSchema: {
        namespace: z.string().optional().describe('Namespace to analyze (defaults to all)'),
        minOccurrences: z.number().optional().describe('Minimum repeated violations per rule to include (default 2)')
      }
    },
    async ({ namespace, minOccurrences = 2 }) => {
      try {
        const report = await policyEngine.generateComplianceReport(namespace);
        const allIssues = [...report.results.violations, ...report.results.warnings];
        const byRule: Record<string, number> = {};
        allIssues.forEach(v => { byRule[v.ruleId] = (byRule[v.ruleId] || 0) + 1; });
        const suggestions = Object.entries(byRule)
          .filter(([_, count]) => count >= minOccurrences)
          .map(([ruleId, count]) => {
            const rule = policyEngine.getRules().find(r => r.id === ruleId);
            if (!rule) return null;
            const rec = rule.severity === 'critical' || rule.severity === 'high'
              ? `Keep enabled; consider strict enforcement if not already. Ensure auto-fix paths exist.`
              : `Consider switching to advisory or temporarily disabling during remediation.`;
            return { ruleId, count, severity: rule.severity, category: rule.category, recommendation: rec };
          })
          .filter(Boolean);

        if (suggestions.length === 0) {
          return { content: [{ type: 'text', text: `ℹ️ No repeated violations meeting threshold (${minOccurrences}).` }] };
        }

        const lines = suggestions.map(s => `- ${s!.ruleId} (${s!.severity}, ${s!.category}) – ${s!.count} occurrences\n  Recommendation: ${s!.recommendation}`);
        const overrideTemplate = suggestions.slice(0,5).map(s => `"${s!.ruleId}": { "enforcement": "advisory" }`).join(',\n  ');

        return {
          content: [{ type: 'text', text: `🎛️ Policy Customization Suggestions (${namespace || 'cluster'})\n\n${lines.join('\n')}\n\nExample ruleOverrides snippet:\n${'```json'}\n"ruleOverrides": {\n  ${overrideTemplate}\n}\n${'```'}\n` }]
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Error generating suggestions: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }
  );

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("🚀 Kubernetes Deployment MCP Server is running...");
  console.error("📋 Available tools: get_cluster_info, list_namespaces, list_deployments, get_deployment_status, scale_deployment, toggle_feature_flag, rollback_deployment, deploy_version, get_pod_logs, evaluate_deployment_policies, generate_compliance_report, auto_fix_policy_violations, list_policy_rules");
  console.error("🧩 Added tools: generate_policy_configuration, validate_policy_configuration, preview_policy_impact, suggest_policy_customizations");
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('🛑 Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('🛑 Server shutting down...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('💥 Server error:', error);
  process.exit(1);
});
