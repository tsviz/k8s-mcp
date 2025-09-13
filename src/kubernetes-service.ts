import * as k8s from '@kubernetes/client-node';

// Type definitions for our responses
export interface DeploymentStatus {
  replicas: number;
  readyReplicas: number;
  health: string;
  lastUpdateTime: string;
  rolloutStatus: string;
  currentImage: string;
  conditions: Array<{
    type: string;
    status: string;
    reason: string;
  }>;
  events?: Array<{
    type: string;
    reason: string;
    message: string;
  }>;
}

export interface ScaleResult {
  previousReplicas: number;
  currentReplicas: number;
  scaleDuration: number;
  warnings: string[];
}

export interface FeatureFlagResult {
  rolloutTriggered: boolean;
  timestamp: string;
  additionalInfo?: string;
}

export interface RollbackResult {
  fromRevision: number;
  toRevision: number;
  previousImage: string;
  rolledBackImage: string;
  rollbackDuration: number;
  rollbackReason: string;
  timestamp: string;
  targetReplicas: number;
  warnings: string[];
}

export interface DeployResult {
  previousImage: string;
  newImage: string;
  previousRevision: number;
  newRevision: number;
  deployDuration: number;
  targetReplicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  readyReplicas: number;
  deploymentEvents: Array<{
    type: string;
    message: string;
  }>;
  warnings: string[];
}

export interface LogOptions {
  lines?: number;
  container?: string;
  previous?: boolean;
  follow?: boolean;
}

export interface PodLogsResult {
  podLogs: Array<{
    podName: string;
    containerLogs: Array<{
      containerName: string;
      logs: string;
      truncated: boolean;
    }>;
  }>;
  warnings: string[];
  errors: string[];
}

export interface ClusterInfo {
  clusterName: string;
  currentContext: string;
  serverUrl: string;
  kubernetesVersion: string;
  nodeCount: number;
  namespaceCount: number;
  user: string;
}

export interface NamespaceInfo {
  name: string;
  status: string;
  creationTimestamp: string;
  deploymentCount: number;
}

export interface DeploymentSummary {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  currentImage: string;
  health: string;
  creationTimestamp: string;
}

/**
 * Kubernetes Service class that handles all Kubernetes operations
 * Uses the official Kubernetes JavaScript client
 */
export class KubernetesService {
  private kc: k8s.KubeConfig;
  private k8sApi!: k8s.AppsV1Api;
  private coreApi!: k8s.CoreV1Api;
  private eventsApi!: k8s.EventsV1Api;

  constructor() {
    this.kc = new k8s.KubeConfig();
  }

  // Expose kubeconfig for policy engine
  getKubeConfig(): k8s.KubeConfig {
    return this.kc;
  }

  async initialize(): Promise<void> {
    try {
      // Load kubeconfig from default locations
      this.kc.loadFromDefault();
      
      this.k8sApi = this.kc.makeApiClient(k8s.AppsV1Api);
      this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
      this.eventsApi = this.kc.makeApiClient(k8s.EventsV1Api);
      
      console.error('✅ Kubernetes client initialized successfully');
      
      // Log cluster connection info for debugging
      try {
        const clusterInfo = await this.getClusterInfo();
        console.error(`🔗 Connected to cluster: ${clusterInfo.clusterName} (${clusterInfo.serverUrl})`);
        console.error(`👤 User: ${clusterInfo.user}, Context: ${clusterInfo.currentContext}`);
        console.error(`🏗️ Kubernetes version: ${clusterInfo.kubernetesVersion}`);
        console.error(`📊 Resources: ${clusterInfo.nodeCount} nodes, ${clusterInfo.namespaceCount} namespaces`);
      } catch (error) {
        console.error('⚠️ Could not retrieve cluster info:', error);
      }
    } catch (error) {
      console.error('❌ Failed to initialize Kubernetes client:', error);
      throw error;
    }
  }

  async getDeploymentStatus(namespace: string, deploymentName: string, includeEvents: boolean = false): Promise<DeploymentStatus> {
    try {
      // Get deployment details
      const deploymentResponse = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
      const deployment = deploymentResponse.body;

      const replicas = deployment.spec?.replicas || 0;
      const readyReplicas = deployment.status?.readyReplicas || 0;
      const conditions = deployment.status?.conditions || [];
      
      // Determine health status
      let health = 'Unknown';
      const availableCondition = conditions.find(c => c.type === 'Available');
      const progressingCondition = conditions.find(c => c.type === 'Progressing');
      
      if (availableCondition?.status === 'True' && readyReplicas === replicas) {
        health = 'Healthy';
      } else if (progressingCondition?.status === 'True') {
        health = 'Progressing';
      } else {
        health = 'Unhealthy';
      }

      // Get current image from containers
      const currentImage = deployment.spec?.template?.spec?.containers?.[0]?.image || 'Unknown';

      // Get rollout status
      let rolloutStatus = 'Unknown';
      if (progressingCondition) {
        rolloutStatus = progressingCondition.reason || 'Unknown';
      }

      const status: DeploymentStatus = {
        replicas,
        readyReplicas,
        health,
        lastUpdateTime: deployment.metadata?.creationTimestamp?.toString() || new Date().toISOString(),
        rolloutStatus,
        currentImage,
        conditions: conditions.map(c => ({
          type: c.type || '',
          status: c.status || '',
          reason: c.reason || ''
        }))
      };

      // Optionally include events
      if (includeEvents) {
        try {
          const eventsResponse = await this.coreApi.listNamespacedEvent(namespace);
          const deploymentEvents = eventsResponse.body.items
            .filter(event => event.involvedObject?.name === deploymentName)
            .slice(0, 10) // Get last 10 events
            .map(event => ({
              type: event.type || '',
              reason: event.reason || '',
              message: event.message || ''
            }));
          status.events = deploymentEvents;
        } catch (error) {
          console.error('Warning: Could not fetch events:', error);
        }
      }

      return status;
    } catch (error) {
      throw new Error(`Failed to get deployment status: ${error}`);
    }
  }

  async scaleDeployment(namespace: string, deploymentName: string, replicas: number, waitForReady: boolean = true): Promise<ScaleResult> {
    const startTime = Date.now();
    
    try {
      // Get current replica count
      const currentDeployment = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
      const previousReplicas = currentDeployment.body.spec?.replicas || 0;

      // Update the deployment with new replica count
      const patch = [{
        op: 'replace',
        path: '/spec/replicas',
        value: replicas
      }];

      await this.k8sApi.patchNamespacedDeployment(
        deploymentName,
        namespace,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/json-patch+json' } }
      );

      let currentReplicas = previousReplicas;
      const warnings: string[] = [];

      // If waiting for ready, poll until all replicas are ready
      if (waitForReady && replicas > 0) {
        const maxWaitTime = 300000; // 5 minutes
        const pollInterval = 2000; // 2 seconds
        const startWaitTime = Date.now();

        while (Date.now() - startWaitTime < maxWaitTime) {
          const updatedDeployment = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
          currentReplicas = updatedDeployment.body.status?.readyReplicas || 0;

          if (currentReplicas >= replicas) {
            break;
          }

          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        if (currentReplicas < replicas) {
          warnings.push(`Timeout waiting for all replicas to be ready. ${currentReplicas}/${replicas} ready after ${maxWaitTime}ms`);
        }
      }

      return {
        previousReplicas,
        currentReplicas,
        scaleDuration: Date.now() - startTime,
        warnings
      };
    } catch (error) {
      throw new Error(`Failed to scale deployment: ${error}`);
    }
  }

  async toggleFeatureFlag(namespace: string, deploymentName: string, flagName: string, enabled: boolean, flagType: 'env_var' | 'configmap' = 'env_var'): Promise<FeatureFlagResult> {
    try {
      if (flagType === 'env_var') {
        // Update environment variable in deployment
        const deployment = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
        const containers = deployment.body.spec?.template?.spec?.containers || [];

        if (containers.length === 0) {
          throw new Error('No containers found in deployment');
        }

        // Update the first container's environment variables
        const container = containers[0];
        if (!container.env) {
          container.env = [];
        }

        // Find existing env var or create new one
        const existingEnvIndex = container.env.findIndex(env => env.name === flagName);
        if (existingEnvIndex >= 0) {
          container.env[existingEnvIndex].value = enabled.toString();
        } else {
          container.env.push({
            name: flagName,
            value: enabled.toString()
          });
        }

        // Apply the update
        await this.k8sApi.replaceNamespacedDeployment(deploymentName, namespace, deployment.body);

        return {
          rolloutTriggered: true,
          timestamp: new Date().toISOString(),
          additionalInfo: `Environment variable ${flagName} updated in container ${container.name}`
        };
      } else {
        // Handle ConfigMap update (simplified implementation)
        const configMapName = `${deploymentName}-config`;
        
        try {
          const configMap = await this.coreApi.readNamespacedConfigMap(configMapName, namespace);
          if (!configMap.body.data) {
            configMap.body.data = {};
          }
          
          configMap.body.data[flagName] = enabled.toString();
          await this.coreApi.replaceNamespacedConfigMap(configMapName, namespace, configMap.body);

          return {
            rolloutTriggered: false, // ConfigMap changes don't automatically trigger rollouts
            timestamp: new Date().toISOString(),
            additionalInfo: `ConfigMap ${configMapName} updated. Deployment restart may be needed.`
          };
        } catch (error) {
          throw new Error(`ConfigMap ${configMapName} not found or could not be updated: ${error}`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to toggle feature flag: ${error}`);
    }
  }

  async rollbackDeployment(namespace: string, deploymentName: string, revision?: number, waitForRollback: boolean = true): Promise<RollbackResult> {
    const startTime = Date.now();
    
    try {
      // Get current deployment info
      const currentDeployment = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
      const currentRevision = parseInt(currentDeployment.body.metadata?.annotations?.['deployment.kubernetes.io/revision'] || '1');
      const previousImage = currentDeployment.body.spec?.template?.spec?.containers?.[0]?.image || 'unknown';

      // Get replica sets to find the target revision
      const replicaSetsResponse = await this.k8sApi.listNamespacedReplicaSet(namespace, undefined, undefined, undefined, undefined, `app=${deploymentName}`);
      const replicaSets = replicaSetsResponse.body.items
        .filter(rs => rs.metadata?.ownerReferences?.some(ref => ref.name === deploymentName))
        .sort((a, b) => {
          const revA = parseInt(a.metadata?.annotations?.['deployment.kubernetes.io/revision'] || '0');
          const revB = parseInt(b.metadata?.annotations?.['deployment.kubernetes.io/revision'] || '0');
          return revB - revA;
        });

      let targetRevision = revision;
      if (!targetRevision) {
        // Find the previous revision (not current)
        const nonCurrentRS = replicaSets.find(rs => {
          const rsRevision = parseInt(rs.metadata?.annotations?.['deployment.kubernetes.io/revision'] || '0');
          return rsRevision < currentRevision;
        });
        targetRevision = parseInt(nonCurrentRS?.metadata?.annotations?.['deployment.kubernetes.io/revision'] || '1');
      }

      // Find the target replica set and get its template
      const targetRS = replicaSets.find(rs => {
        const rsRevision = parseInt(rs.metadata?.annotations?.['deployment.kubernetes.io/revision'] || '0');
        return rsRevision === targetRevision;
      });

      if (!targetRS) {
        throw new Error(`Revision ${targetRevision} not found`);
      }

      const rolledBackImage = targetRS.spec?.template?.spec?.containers?.[0]?.image || 'unknown';

      // Update deployment with the target template
      const updatedDeployment = { ...currentDeployment.body };
      if (updatedDeployment.spec?.template && targetRS.spec?.template) {
        updatedDeployment.spec.template = targetRS.spec.template;
      }

      await this.k8sApi.replaceNamespacedDeployment(deploymentName, namespace, updatedDeployment);

      const warnings: string[] = [];

      // Wait for rollback to complete if requested
      if (waitForRollback) {
        const maxWaitTime = 300000; // 5 minutes
        const pollInterval = 2000; // 2 seconds
        const startWaitTime = Date.now();

        while (Date.now() - startWaitTime < maxWaitTime) {
          const updatedDeployment = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
          const currentImage = updatedDeployment.body.spec?.template?.spec?.containers?.[0]?.image;
          
          if (currentImage === rolledBackImage) {
            const readyReplicas = updatedDeployment.body.status?.readyReplicas || 0;
            const totalReplicas = updatedDeployment.body.spec?.replicas || 0;
            
            if (readyReplicas >= totalReplicas) {
              break;
            }
          }

          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }

      return {
        fromRevision: currentRevision,
        toRevision: targetRevision,
        previousImage,
        rolledBackImage,
        rollbackDuration: Date.now() - startTime,
        rollbackReason: revision ? `Manual rollback to revision ${revision}` : 'Rollback to previous revision',
        timestamp: new Date().toISOString(),
        targetReplicas: currentDeployment.body.spec?.replicas || 0,
        warnings
      };
    } catch (error) {
      throw new Error(`Failed to rollback deployment: ${error}`);
    }
  }

  async deployVersion(namespace: string, deploymentName: string, image: string, strategy: 'RollingUpdate' | 'Recreate' = 'RollingUpdate', waitForDeployment: boolean = true): Promise<DeployResult> {
    const startTime = Date.now();
    
    try {
      // Get current deployment
      const currentDeployment = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
      const previousImage = currentDeployment.body.spec?.template?.spec?.containers?.[0]?.image || 'unknown';
      const previousRevision = parseInt(currentDeployment.body.metadata?.annotations?.['deployment.kubernetes.io/revision'] || '1');

      // Update deployment strategy
      if (currentDeployment.body.spec?.strategy) {
        currentDeployment.body.spec.strategy.type = strategy;
      }

      // Update container image
      if (currentDeployment.body.spec?.template?.spec?.containers?.[0]) {
        currentDeployment.body.spec.template.spec.containers[0].image = image;
      }

      // Apply the update
      await this.k8sApi.replaceNamespacedDeployment(deploymentName, namespace, currentDeployment.body);

      const deploymentEvents: Array<{ type: string; message: string }> = [];
      const warnings: string[] = [];
      let availableReplicas = 0;
      let updatedReplicas = 0;
      let readyReplicas = 0;

      // Wait for deployment to complete if requested
      if (waitForDeployment) {
        const maxWaitTime = 600000; // 10 minutes
        const pollInterval = 3000; // 3 seconds
        const startWaitTime = Date.now();

        while (Date.now() - startWaitTime < maxWaitTime) {
          const updatedDeployment = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
          const status = updatedDeployment.body.status;

          availableReplicas = status?.availableReplicas || 0;
          updatedReplicas = status?.updatedReplicas || 0;
          readyReplicas = status?.readyReplicas || 0;
          const totalReplicas = updatedDeployment.body.spec?.replicas || 0;

          // Check if deployment is complete
          const conditions = status?.conditions || [];
          const progressingCondition = conditions.find(c => c.type === 'Progressing');
          
          if (progressingCondition?.status === 'True' && 
              progressingCondition.reason === 'NewReplicaSetAvailable' &&
              readyReplicas >= totalReplicas) {
            deploymentEvents.push({
              type: 'Normal',
              message: 'Deployment completed successfully'
            });
            break;
          }

          // Check for failures
          if (progressingCondition?.status === 'False') {
            warnings.push(`Deployment failed: ${progressingCondition.message}`);
            break;
          }

          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        if (Date.now() - startWaitTime >= maxWaitTime) {
          warnings.push('Deployment timeout - deployment may still be progressing');
        }
      }

      // Get new revision
      const finalDeployment = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
      const newRevision = parseInt(finalDeployment.body.metadata?.annotations?.['deployment.kubernetes.io/revision'] || previousRevision.toString());

      return {
        previousImage,
        newImage: image,
        previousRevision,
        newRevision,
        deployDuration: Date.now() - startTime,
        targetReplicas: currentDeployment.body.spec?.replicas || 0,
        availableReplicas,
        updatedReplicas,
        readyReplicas,
        deploymentEvents,
        warnings
      };
    } catch (error) {
      throw new Error(`Failed to deploy version: ${error}`);
    }
  }

  async getPodLogs(namespace: string, deploymentName: string, options: LogOptions = {}): Promise<PodLogsResult> {
    const { lines = 100, container, previous = false, follow = false } = options;
    
    try {
      // First, get the deployment to find its selector
      const deploymentResponse = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
      const deployment = deploymentResponse.body;
      
      if (!deployment.spec?.selector?.matchLabels) {
        throw new Error(`Deployment ${deploymentName} has no selector labels`);
      }

      // Convert matchLabels to label selector string
      const labelSelector = Object.entries(deployment.spec.selector.matchLabels)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');

      // Get pods using the deployment's selector
      const podsResponse = await this.coreApi.listNamespacedPod(
        namespace, 
        undefined, // pretty
        undefined, // allowWatchBookmarks
        undefined, // _continue
        undefined, // fieldSelector
        labelSelector // labelSelector
      );
      
      const pods = podsResponse.body.items.filter(pod => 
        pod.status?.phase === 'Running' || pod.status?.phase === 'Pending'
      );

      if (pods.length === 0) {
        throw new Error(`No pods found for deployment ${deploymentName}`);
      }

      const podLogs: PodLogsResult['podLogs'] = [];
      const warnings: string[] = [];
      const errors: string[] = [];

      for (const pod of pods.slice(0, 5)) { // Limit to 5 pods to avoid overwhelming output
        const podName = pod.metadata?.name || 'unknown';
        const containers = pod.spec?.containers || [];
        const containerLogs: Array<{ containerName: string; logs: string; truncated: boolean }> = [];

        for (const containerSpec of containers) {
          const containerName = containerSpec.name;
          
          // Skip if specific container requested and this isn't it
          if (container && containerName !== container) {
            continue;
          }

          try {
            const logResponse = await this.coreApi.readNamespacedPodLog(
              podName,
              namespace,
              containerName,
              follow,
              undefined,
              undefined,
              undefined,
              previous,
              undefined,
              lines
            );

            const logs = logResponse.body;
            const truncated = logs.split('\n').length >= lines;

            containerLogs.push({
              containerName,
              logs: logs || '(no logs available)',
              truncated
            });
          } catch (error) {
            errors.push(`Failed to get logs for container ${containerName} in pod ${podName}: ${error}`);
            containerLogs.push({
              containerName,
              logs: `Error retrieving logs: ${error}`,
              truncated: false
            });
          }
        }

        if (containerLogs.length > 0) {
          podLogs.push({
            podName,
            containerLogs
          });
        }
      }

      if (pods.length > 5) {
        warnings.push(`Only showing logs from first 5 pods (${pods.length} total pods found)`);
      }

      return {
        podLogs,
        warnings,
        errors
      };
    } catch (error) {
      throw new Error(`Failed to get pod logs: ${error}`);
    }
  }

  /**
   * Get cluster information including connection details and basic stats
   */
  async getClusterInfo(): Promise<ClusterInfo> {
    try {
      const currentContext = this.kc.getCurrentContext();
      const cluster = this.kc.getCurrentCluster();
      const user = this.kc.getCurrentUser();

      // Get Kubernetes version
      const versionApi = this.kc.makeApiClient(k8s.VersionApi);
      const versionResponse = await versionApi.getCode();
      const kubernetesVersion = versionResponse.body.gitVersion || 'Unknown';

      // Get node count
      const nodesResponse = await this.coreApi.listNode();
      const nodeCount = nodesResponse.body.items.length;

      // Get namespace count
      const namespacesResponse = await this.coreApi.listNamespace();
      const namespaceCount = namespacesResponse.body.items.length;

      return {
        clusterName: cluster?.name || 'Unknown',
        currentContext: currentContext || 'Unknown',
        serverUrl: cluster?.server || 'Unknown',
        kubernetesVersion,
        nodeCount,
        namespaceCount,
        user: user?.name || 'Unknown'
      };
    } catch (error) {
      throw new Error(`Failed to get cluster info: ${error}`);
    }
  }

  /**
   * List all namespaces with basic information
   */
  async listNamespaces(): Promise<NamespaceInfo[]> {
    try {
      const namespacesResponse = await this.coreApi.listNamespace();
      const namespaces: NamespaceInfo[] = [];

      for (const ns of namespacesResponse.body.items) {
        const name = ns.metadata?.name || 'Unknown';
        const status = ns.status?.phase || 'Unknown';
        const creationTimestamp = ns.metadata?.creationTimestamp?.toString() || 'Unknown';

        // Get deployment count for this namespace
        let deploymentCount = 0;
        try {
          const deploymentsResponse = await this.k8sApi.listNamespacedDeployment(name);
          deploymentCount = deploymentsResponse.body.items.length;
        } catch (error) {
          // Ignore errors (might be permission issues)
        }

        namespaces.push({
          name,
          status,
          creationTimestamp,
          deploymentCount
        });
      }

      return namespaces;
    } catch (error) {
      throw new Error(`Failed to list namespaces: ${error}`);
    }
  }

  /**
   * List all deployments across all namespaces (or specific namespace)
   */
  async listDeployments(namespace?: string): Promise<DeploymentSummary[]> {
    try {
      const deployments: DeploymentSummary[] = [];

      if (namespace) {
        // List deployments in specific namespace
        const deploymentsResponse = await this.k8sApi.listNamespacedDeployment(namespace);
        
        for (const deployment of deploymentsResponse.body.items) {
          const summary = this.createDeploymentSummary(deployment, namespace);
          if (summary) deployments.push(summary);
        }
      } else {
        // List deployments across all namespaces
        const deploymentsResponse = await this.k8sApi.listDeploymentForAllNamespaces();
        
        for (const deployment of deploymentsResponse.body.items) {
          const deploymentNamespace = deployment.metadata?.namespace || 'default';
          const summary = this.createDeploymentSummary(deployment, deploymentNamespace);
          if (summary) deployments.push(summary);
        }
      }

      return deployments.sort((a, b) => a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`Failed to list deployments: ${error}`);
    }
  }

  /**
   * Helper method to create deployment summary from Kubernetes deployment object
   */
  private createDeploymentSummary(deployment: any, namespace: string): DeploymentSummary | null {
    try {
      const name = deployment.metadata?.name;
      if (!name) return null;

      const replicas = deployment.spec?.replicas || 0;
      const readyReplicas = deployment.status?.readyReplicas || 0;
      const currentImage = deployment.spec?.template?.spec?.containers?.[0]?.image || 'Unknown';
      const creationTimestamp = deployment.metadata?.creationTimestamp?.toString() || 'Unknown';

      // Determine health status
      let health = 'Unknown';
      const conditions = deployment.status?.conditions || [];
      const availableCondition = conditions.find((c: any) => c.type === 'Available');
      const progressingCondition = conditions.find((c: any) => c.type === 'Progressing');
      
      if (availableCondition?.status === 'True' && readyReplicas === replicas) {
        health = 'Healthy';
      } else if (progressingCondition?.status === 'True') {
        health = 'Progressing';
      } else {
        health = 'Unhealthy';
      }

      return {
        name,
        namespace,
        replicas,
        readyReplicas,
        currentImage,
        health,
        creationTimestamp
      };
    } catch (error) {
      return null;
    }
  }
}
