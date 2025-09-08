# Kubernetes Deployment MCP Server

![Build Status](https://github.com/tsviz/k8s-mcp/workflows/🚀%20Release%20Docker%20Images/badge.svg)
![License](https://img.shields.io/github/license/tsviz/k8s-mcp)
![Version](https://img.shields.io/github/v/release/tsviz/k8s-mcp)

A Model Context Protocol (MCP) server that provides AI-driven automation tools for managing Kubernetes deployments. This server exposes 6 powerful tools for deployment lifecycle management, allowing LLMs to interact with Kubernetes clusters in a secure and structured way.

## 🚀 Features

### Core Tools

1. **get_deployment_status** - Check deployment health, replica status, conditions, and recent events
2. **scale_deployment** - Horizontally scale deployments with wait-for-ready support  
3. **toggle_feature_flag** - Enable/disable feature flags via environment variables or ConfigMaps
4. **rollback_deployment** - Rollback to previous deployment versions with revision control
5. **deploy_version** - Deploy specific application versions with rollout tracking
6. **get_pod_logs** - Retrieve pod logs for debugging and monitoring

### Key Capabilities

- **AI-Driven Automation**: Each tool provides rich, structured responses perfect for LLM interpretation
- **Kubernetes Native**: Built using the official Kubernetes JavaScript client
- **Comprehensive Monitoring**: Detailed status reporting with health checks, events, and metrics  
- **Safe Operations**: Built-in timeouts, error handling, and rollback capabilities
- **Production Ready**: Supports multiple deployment strategies and wait-for-completion patterns
- **🐳 Multi-Architecture**: Available for `linux/amd64` and `linux/arm64`
- **🔒 Security First**: Regular vulnerability scanning and automated dependency updates

## 🎯 Use Cases

<details>
<summary><strong>🚨 Performance Troubleshooting & Diagnostics</strong></summary>

**Scenario:** Your application is running slow and you need to quickly diagnose the issue.

**AI Interaction:**
```
User: "My Spring Boot app seems slow, can you investigate?"

AI: "Let me check your deployment status and logs..."
```

**MCP Tools Used:**
- `get_deployment_status()` - Check replica health and recent events
- `get_pod_logs()` - Analyze startup times and error patterns
- `scale_deployment()` - Reduce replicas to eliminate resource contention

**Common Issues Resolved:**
- **Database lock contention** - "Waiting for changelog lock..." (20-30s delays)
- **Slow startup times** - 80-100s → 25-35s (60-70% improvement)
- **Resource competition** - Multiple pods competing for CPU/Memory
- **JPA performance** - Open-in-view anti-pattern causing N+1 queries

**Real Example:**
```
Found: Database lock contention in Liquibase migrations
Solution: Scaled v1 from 2→1 replicas, v2 from 3→2 replicas  
Result: Eliminated 30s startup delays, 50% faster response times
```

</details>

<details>
<summary><strong>🔄 Zero-Downtime Deployments</strong></summary>

**Scenario:** Deploy a new version of your application without service interruption.

**AI Interaction:**
```
User: "Deploy v2.1.0 of my API with zero downtime"

AI: "I'll deploy with rolling update strategy and monitor the rollout..."
```

**MCP Tools Used:**
- `deploy_version()` - Deploy new image with RollingUpdate strategy
- `get_deployment_status()` - Monitor rollout progress in real-time
- `rollback_deployment()` - Automatic rollback if issues detected

**Deployment Flow:**
1. **Pre-deployment checks** - Verify cluster resources and current state
2. **Rolling update** - Gradually replace pods with new version
3. **Health monitoring** - Watch for successful pod startup and readiness
4. **Validation** - Confirm new version is serving traffic correctly
5. **Completion** - Report successful deployment or trigger rollback

**Benefits:**
- **Zero downtime** - Users experience no service interruption
- **Automatic monitoring** - AI tracks deployment progress
- **Intelligent rollback** - Automatic revert if issues detected
- **Production safe** - Built-in safeguards and validation

</details>

<details>
<summary><strong>🎛️ Feature Flag Management</strong></summary>

**Scenario:** Enable/disable features in production without redeployment.

**AI Interaction:**
```
User: "Enable the new search feature for Black Friday traffic"

AI: "I'll enable the ENHANCED_SEARCH flag and monitor the rollout..."
```

**MCP Tools Used:**
- `toggle_feature_flag()` - Update environment variables or ConfigMaps
- `get_deployment_status()` - Monitor pod restart and health
- `get_pod_logs()` - Verify feature activation in application logs

**Feature Flag Strategies:**
- **Environment Variables** - Fast updates with pod restart
- **ConfigMaps** - Shared configuration across multiple services
- **Runtime Validation** - Confirm feature activation in logs
- **Gradual Rollout** - Enable for subset of replicas first

**Use Cases:**
- **A/B Testing** - Toggle experimental features
- **Emergency Disable** - Quickly disable problematic features  
- **Phased Rollouts** - Gradual feature activation
- **Configuration Updates** - Modify app behavior without code changes

</details>

<details>
<summary><strong>📈 Auto-Scaling & Load Management</strong></summary>

**Scenario:** Handle traffic spikes by automatically scaling your applications.

**AI Interaction:**
```
User: "We're expecting 10x traffic for our product launch"

AI: "I'll scale your API from 3 to 15 replicas and monitor performance..."
```

**MCP Tools Used:**
- `scale_deployment()` - Increase/decrease replica count
- `get_deployment_status()` - Monitor scaling progress and pod readiness
- `get_pod_logs()` - Watch for resource warnings or errors

**Scaling Scenarios:**
- **Traffic Spikes** - Black Friday, product launches, viral content
- **Cost Optimization** - Scale down during low-traffic periods
- **Resource Management** - Balance load across multiple services
- **Performance Tuning** - Find optimal replica counts

**Smart Scaling:**
- **Gradual scaling** - Avoid overwhelming cluster resources
- **Health validation** - Ensure new pods are healthy before continuing
- **Resource monitoring** - Watch for CPU/memory constraints
- **Load balancing** - Verify traffic distribution across replicas

</details>

<details>
<summary><strong>🚑 Emergency Response & Rollbacks</strong></summary>

**Scenario:** Critical bug deployed to production - need immediate rollback.

**AI Interaction:**
```
User: "URGENT: Users reporting errors after latest deployment!"

AI: "I'll immediately rollback to the previous stable version..."
```

**MCP Tools Used:**
- `rollback_deployment()` - Instant rollback to previous revision
- `get_deployment_status()` - Monitor rollback progress
- `get_pod_logs()` - Verify stability of rolled-back version

**Emergency Scenarios:**
- **Critical bugs** - Immediate revert to stable version
- **Performance degradation** - Rollback to known-good performance baseline
- **Configuration errors** - Undo problematic environment changes
- **Security issues** - Quick removal of vulnerable code

**Response Process:**
1. **Immediate rollback** - Start revert within seconds
2. **Health monitoring** - Verify rollback success
3. **Service validation** - Confirm application stability
4. **Incident reporting** - Document issue and resolution
5. **Prevention planning** - Identify improvements for future deployments

</details>

<details>
<summary><strong>🔍 Monitoring & Observability</strong></summary>

**Scenario:** Proactive monitoring and troubleshooting of deployment health.

**AI Interaction:**
```
User: "Give me a health report of all my microservices"

AI: "Checking all deployments... Found 2 issues that need attention..."
```

**MCP Tools Used:**
- `get_deployment_status()` - Health checks across all deployments
- `get_pod_logs()` - Error analysis and pattern detection
- `scale_deployment()` - Adjust resources based on monitoring data

**Monitoring Capabilities:**
- **Health dashboards** - Real-time status of all deployments
- **Error detection** - Automatic identification of issues in logs
- **Resource optimization** - Right-sizing based on actual usage
- **Trend analysis** - Performance patterns over time

**Proactive Alerts:**
- **Pod restart loops** - Detect and diagnose failing containers
- **Resource exhaustion** - Early warning for CPU/memory limits
- **Slow response times** - Performance degradation detection
- **Configuration drift** - Identify unauthorized changes

</details>

## 📋 Prerequisites

- Node.js 18.0+ 
- Kubernetes cluster access with proper RBAC permissions
- Valid `kubeconfig` file configured for your cluster
- Basic understanding of Kubernetes deployments and the MCP protocol

## 🛠 Installation

### Using Docker (Recommended)

```json
{
  "servers": {
    "k8s-deployment-server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/path/to/.kube:/home/mcp/.kube:ro",
        "ghcr.io/tsviz/k8s-mcp:latest"
      ],
      "type": "stdio"
    }
  }
}
```

### From Source

### Option 1: Local Development

1. **Clone and Setup**
```bash
git clone <repository-url>
cd k8s-deployment-mcp-server
npm install
```

2. **Build the Project**
```bash
npm run build
```

3. **Configure Kubernetes Access**
Ensure your `kubeconfig` is properly configured:
```bash
kubectl config current-context
kubectl get deployments --all-namespaces  # Test access
```

### Option 2: Docker Container

1. **Build Docker Image**
```bash
# Simple build
npm run docker:build

# Multi-stage build (recommended for production)
npm run docker:build-multi
```

2. **Run with Docker**
```bash
# Run with local kubeconfig
npm run docker:run

# Or run manually with custom options
docker run --rm \
  -v ~/.kube:/home/mcp/.kube:ro \
  -e NODE_ENV=production \
  k8s-mcp-server:latest
```

### Option 3: Docker Compose

1. **Start with Docker Compose**
```bash
# Start in background
npm run docker:compose

# Start with build and logs
npm run docker:compose-dev
```

2. **Stop Services**
```bash
npm run docker:compose-down
```

### Option 4: In-Cluster Deployment

1. **Apply RBAC Configuration**
```bash
kubectl apply -f examples/rbac.yaml
```

2. **Deploy to Kubernetes**
```bash
kubectl apply -f examples/k8s-deployment.yaml
```

3. **Check Deployment Status**
```bash
kubectl get pods -l app=k8s-mcp-server
kubectl logs -l app=k8s-mcp-server
```

## 🚀 Usage

### Local Execution
```bash
npm start
```

### Docker Execution
```bash
# Using Docker directly
docker run --rm -v ~/.kube:/home/mcp/.kube:ro k8s-mcp-server:latest

# Using Docker Compose
docker-compose up -d
```

### VS Code Integration
Add to your VS Code `settings.json`:
```json
{
  "mcp.servers": {
    "k8s-deployment-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/k8s-deployment-mcp-server"
    }
  }
}
```

### Docker-based VS Code Integration
```json
{
  "mcp.servers": {
    "k8s-deployment-server": {
      "command": "docker",
      "args": [
        "run", "--rm", 
        "-v", "~/.kube:/home/mcp/.kube:ro",
        "k8s-mcp-server:latest"
      ]
    }
  }
}
```

### Direct MCP Integration
Use the included `mcp.json` configuration file for MCP client integration.

## 🔧 Tool Reference

### 1. get_deployment_status

Check the current status and health of a Kubernetes deployment.

**Parameters:**
- `namespace` (string): Kubernetes namespace
- `deployment` (string): Deployment name
- `includeEvents` (boolean, optional): Include recent events

**Example Response:**
```
📊 Replica Status: 3/3 ready
🏥 Health: Healthy
📅 Last Updated: 2024-01-15T10:30:00Z
⚡ Rollout Status: NewReplicaSetAvailable
🏷️ Current Image: myapp:v1.2.3

Conditions:
- Available: True (MinimumReplicasAvailable)
- Progressing: True (NewReplicaSetAvailable)
```

### 2. scale_deployment

Horizontally scale a deployment to the specified number of replicas.

**Parameters:**
- `namespace` (string): Kubernetes namespace
- `deployment` (string): Deployment name  
- `replicas` (number): Target replica count
- `waitForReady` (boolean, optional): Wait for all replicas to be ready

**Example Response:**
```
✅ Successfully scaled deployment myapp in production:

📈 Scale Change: 2 → 5 replicas
⏱️ Duration: 45000ms
🎯 Status: All replicas ready
📊 Current State: 5/5 ready
```

### 3. toggle_feature_flag

Enable or disable feature flags by updating deployment configuration.

**Parameters:**
- `namespace` (string): Kubernetes namespace
- `deployment` (string): Deployment name
- `flagName` (string): Feature flag name
- `enabled` (boolean): Enable or disable flag
- `flagType` (enum, optional): "env_var" or "configmap"

**Example Response:**
```
🚩 Feature flag NEW_CHECKOUT_FLOW has been ENABLED:

🎯 Deployment: myapp (production)
🏷️ Flag Name: NEW_CHECKOUT_FLOW  
📝 Flag Type: env_var
⚡ New Value: true
🔄 Rollout Status: New rollout triggered
⏱️ Applied At: 2024-01-15T10:30:00Z
```

### 4. rollback_deployment

Rollback a deployment to a previous revision.

**Parameters:**
- `namespace` (string): Kubernetes namespace
- `deployment` (string): Deployment name
- `revision` (number, optional): Specific revision to rollback to
- `waitForRollback` (boolean, optional): Wait for rollback completion

**Example Response:**
```
🔄 Deployment rollback completed for myapp in production:

📈 Revision Change: 15 → 14
🏷️ Previous Image: myapp:v1.3.0
🎯 Rolled Back To: myapp:v1.2.9
⏱️ Rollback Duration: 60000ms
✅ Status: Rollback completed successfully
```

### 5. deploy_version

Deploy a specific version/image to a deployment.

**Parameters:**
- `namespace` (string): Kubernetes namespace
- `deployment` (string): Deployment name
- `image` (string): Docker image URL with tag
- `strategy` (enum, optional): "RollingUpdate" or "Recreate"  
- `waitForDeployment` (boolean, optional): Wait for completion

**Example Response:**
```
🚀 Deployment myapp updated successfully in production:

🏷️ Image Change:
  - From: myapp:v1.2.3
  - To: myapp:v1.3.0

📈 Revision: 14 → 15
⚡ Strategy: RollingUpdate
⏱️ Deploy Duration: 120000ms
✅ Status: Deployment completed successfully
```

### 6. get_pod_logs

Retrieve logs from pods in a deployment.

**Parameters:**
- `namespace` (string): Kubernetes namespace  
- `deployment` (string): Deployment name
- `lines` (number, optional): Number of recent log lines (default: 100)
- `container` (string, optional): Specific container name
- `previous` (boolean, optional): Get logs from previous instance
- `follow` (boolean, optional): Follow log stream

**Example Response:**
```
📋 Logs for deployment myapp in production:

🔍 Query Parameters:
- Lines: 100
- Container: default  
- Previous Instance: false
- Pods Found: 3

Pod: myapp-7d4b8c8f4d-abc12
Container: myapp
```
[2024-01-15T10:30:15.123Z] INFO: Starting application server
[2024-01-15T10:30:16.456Z] INFO: Connected to database  
[2024-01-15T10:30:17.789Z] INFO: Server listening on port 8080
```
```

## � Docker Deployment

### Available Images
- **Production Build**: Multi-stage Dockerfile optimized for size and security
- **Development Build**: Single-stage Dockerfile for development

### Docker Scripts
```bash
# Build production image
npm run docker:build-multi

# Run container with kubeconfig
npm run docker:run

# Start with docker-compose
npm run docker:compose

# Development mode with auto-rebuild
npm run docker:compose-dev
```

### Environment Variables
- `NODE_ENV`: Set to `production` for optimized performance
- `DEBUG`: Set to `1` for verbose logging
- `KUBECONFIG`: Path to kubeconfig file (when not using in-cluster auth)

### Volume Mounts
- `~/.kube:/home/mcp/.kube:ro` - Kubeconfig access (read-only)
- `./config:/app/config:ro` - Additional configuration files

### Security Considerations
- Runs as non-root user (`mcp:1001`)
- Read-only kubeconfig mount
- Minimal Alpine-based image
- Health checks enabled

## �🔒 Security & RBAC

This MCP server requires appropriate Kubernetes RBAC permissions:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: mcp-k8s-deployment-manager
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: [""]
  resources: ["pods", "events", "configmaps"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
```

## 🐛 Troubleshooting

### Common Issues

**1. "Cannot connect to Kubernetes cluster"**
- Verify `kubectl` works: `kubectl cluster-info`
- Check kubeconfig: `echo $KUBECONFIG` or `~/.kube/config`
- Validate cluster access: `kubectl auth can-i get deployments`

**2. "Deployment not found"**
- Verify namespace exists: `kubectl get ns`
- Check deployment name: `kubectl get deployments -n <namespace>`
- Ensure RBAC permissions are configured

**3. "Timeout waiting for replicas"**
- Check node resources: `kubectl describe nodes`
- Review pod events: `kubectl describe pod <pod-name>`
- Verify image availability and pull policies

### Debug Mode
Set `DEBUG=1` environment variable for verbose logging:
```bash
DEBUG=1 npm start
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

For manual testing, you can interact with the MCP server using any MCP-compatible client or the MCP Inspector tool.

## 📚 MCP Protocol Integration

This server implements the full MCP specification and can be integrated with:

- **Claude Desktop**: Add to your MCP configuration
- **VS Code**: Use the MCP extension
- **Custom Applications**: Any MCP-compatible client
- **AI Agents**: LLMs with MCP protocol support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the specification
- [Kubernetes JavaScript Client](https://github.com/kubernetes-client/javascript) for cluster integration
- The TypeScript and Node.js communities for excellent tooling

---

**Built with ❤️ for AI-driven DevOps automation**
