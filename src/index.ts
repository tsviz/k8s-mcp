import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { KubernetesService } from "./kubernetes-service.js";

/**
 * Kubernetes Deployment MCP Server
 * 
 * This server provides AI-driven automation tools for managing Kubernetes deployments.
 * It exposes 6 core tools for deployment lifecycle management:
 * 
 * 1. get_deployment_status - Check deployment health and status
 * 2. scale_deployment - Horizontally scale deployments
 * 3. toggle_feature_flag - Enable/disable feature flags
 * 4. rollback_deployment - Rollback to previous deployment version
 * 5. deploy_version - Deploy a specific version
 * 6. get_pod_logs - Retrieve pod logs for debugging
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

  // Tool 1: Get Deployment Status
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

  // Tool 2: Scale Deployment
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

  // Tool 3: Toggle Feature Flag
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

  // Tool 4: Rollback Deployment
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

  // Tool 5: Deploy Version
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

  // Tool 6: Get Pod Logs
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

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("🚀 Kubernetes Deployment MCP Server is running...");
  console.error("📋 Available tools: get_deployment_status, scale_deployment, toggle_feature_flag, rollback_deployment, deploy_version, get_pod_logs");
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
