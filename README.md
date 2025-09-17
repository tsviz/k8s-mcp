# Kubernetes Deployment MCP Server

![Build Status](https://github.com/tsviz/k8s-mcp/workflows/🚀%20Release%20Docker%20Images/badge.svg)
![License](https://img.shields.io/github/license/tsviz/k8s-mcp)
![Version](https://img.shields.io/github/v/release/tsviz/k8s-mcp)

A Model Context Protocol (MCP) server that provides AI-driven automation tools for managing Kubernetes deployments with integ### 📚 **Summary**

## 🔎 Tool Discoverability & Quick Start

Working through a chat interface and unsure what the server can do? Use the built-in meta discovery features:

1. Runtime enumeration: invoke the `list_tools` tool (no args) to get a categorized list with parameter hints and sample invocation objects.
2. Filter tools: `list_tools` accepts an optional `filter` argument to narrow by substring (e.g. `{"filter":"deploy"}`).
3. Static catalog: see [`TOOLS.md`](TOOLS.md) for an at-a-glance summary of categories, usage sequences, and best practices.

Recommended first interaction sequence:
```
list_tools → get_cluster_info → list_namespaces → list_deployments
```

From there branch into scaling, deployment, policy evaluation, or compliance reporting as needed.

### 🗣 Natural Language Interaction

You can issue plain English requests via the `natural_language_command` tool when using Copilot / an MCP-aware client.

Examples:
```
Scale deployment cart-api in namespace shop to 5 replicas
Deploy image ghcr.io/example/service:v1.4.0 to deployment checkout in namespace prod
Show me the status of deployment payments in ns prod
Generate a compliance report for namespace finance
Evaluate policies for deployment api-gateway in ns edge
```

What it does:
- Parses intent → identifies target MCP tool
- Extracts parameters (namespace, deployment, image, replicas, etc.)
- Returns a structured call suggestion (it does not automatically perform write actions to keep you in control)

If something’s missing you’ll get a list of required fields to supply. For unrecognized queries it suggests alternatives (e.g., `list_tools`).


The k8s MCP server is a **powerful diagnostic and emergency response tool** that enhances your DevOps capabilities. However, it should **complement**, not **replace**, your established CI/CD pipelines and change management processes.

**Think of it as:**
- 🔧 **A sophisticated wrench** - Great for specific tasks
- 🚨 **An emergency toolkit** - Essential when things go wrong  
- 👁️ **An observability lens** - Perfect for understanding system state

**NOT as:**
- 🏭 **A production assembly line** - That's what CI/CD is for
- 🤖 **An autonomous deployment system** - Human oversight is essential
- 🔓 **A way to bypass security** - Always follow the principle of least privilege

**Remember**: With great power comes great responsibility. Use wisely! 🦸‍♂️

## 🏛️ Policy as Code Configuration

### Built-in Policy Rules

The MCP server includes **13+ comprehensive policy rules** across 5 categories:

| Category | Rules | Description |
|----------|-------|-------------|
| 🔒 **Security** | 5 rules | Security contexts, image policies, network security |
| 🏢 **Compliance** | 3 rules | Required labels, data classification, audit trails |
| ⚡ **Performance** | 3 rules | Resource limits, health checks, availability |
| 💰 **Cost** | 2 rules | Resource efficiency, idle resource detection |
| 🔧 **Operations** | 3+ rules | Deployment strategies, configuration management |

### External Policy Configuration

**📁 Policy Storage Options:**
- **Built-in**: Default policies in `src/policy-engine.ts`
- **External**: JSON files in `config/policies/` directory
- **Organization-specific**: Custom policy files for your environment

**🔧 Configuration Methods:**

#### 1. Environment Variable Method
```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "POLICY_CONFIG_PATH": "/path/to/your/policies/production.json"
      }
    }
  }
}
```

#### 2. Automatic Environment Detection
```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "node", 
      "args": ["dist/index.js"],
      "env": {
        "NODE_ENV": "production"  // Auto-loads config/policies/production.json
      }
    }
  }
}
```

#### 3. Docker with Policy Volumes
```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/path/to/policies:/app/policies:ro",
        "-e", "POLICY_CONFIG_PATH=/app/policies/production.json",
        "ghcr.io/tsviz/k8s-mcp:latest"
      ]
    }
  }
}
```

### Policy Templates

**📋 Pre-built Templates:**
- `config/policies/production.json` - Production environment policies
- `config/policies/development.json` - Development environment policies  
- `config/policies/hipaa-compliant.json` - Healthcare compliance (HIPAA)
- `config/policies/schema.json` - JSON schema for validation

**🏢 Organization Examples:**
```json
{
  "organization": {
    "name": "ACME Corporation",
    "environment": "production",
    "compliance": ["SOC2", "ISO27001"]
  },
  "global": {
    "enforcement": "strict",
    "autoFix": false,
    "excludedNamespaces": ["kube-system"]
  },
  "customRules": [
    {
      "id": "acme-001",
      "name": "ACME Approved Images",
      "description": "Only approved registry images allowed",
      "severity": "high",
      "category": "compliance",
      "conditions": [
        {
          "field": "spec.template.spec.containers[*].image",
          "operator": "regex_match",
          "value": "^registry\\.acme\\.com/"
        }
      ]
    }
  ]
}
```

**📚 Detailed Documentation:**
- **Complete Guide**: [`docs/EXTERNAL_POLICY_CONFIG.md`](docs/EXTERNAL_POLICY_CONFIG.md)
- **Policy as Code**: [`docs/POLICY_AS_CODE.md`](docs/POLICY_AS_CODE.md)
- **JSON Schema**: [`config/policies/schema.json`](config/policies/schema.json)

### Auto-Remediation Capabilities

The policy engine can automatically fix common issues:

**🔧 Security Fixes:**
- Add missing security contexts (non-root user, read-only filesystem)
- Remove dangerous capabilities and privilege escalation
- Apply pod security standards automatically

**⚡ Performance Fixes:**
- Add missing resource limits and requests
- Configure liveness and readiness probes
- Apply anti-affinity rules for high availability

**🏢 Compliance Fixes:**
- Add required organizational labels
- Apply consistent naming conventions
- Configure audit logging and monitoringas Code** governance. This server exposes 13 powerful tools for deployment lifecycle management and compliance automation, allowing LLMs to interact with Kubernetes clusters in a secure, governed, and structured way.

## 🚀 Features

### Core Deployment Tools

1. **get_cluster_info** - Get cluster connection and basic information
2. **list_namespaces** - List all namespaces with deployment counts  
3. **list_deployments** - List all deployments with health status
4. **get_deployment_status** - Check deployment health, replica status, conditions, and recent events
5. **scale_deployment** - Horizontally scale deployments with wait-for-ready support  
6. **toggle_feature_flag** - Enable/disable feature flags via environment variables or ConfigMaps
7. **rollback_deployment** - Rollback to previous deployment versions with revision control
8. **deploy_version** - Deploy specific application versions with rollout tracking
9. **get_pod_logs** - Retrieve pod logs for debugging and monitoring

### 🏛️ Policy as Code & Governance Tools

10. **evaluate_deployment_policies** - Evaluate deployments against organizational policies
11. **generate_compliance_report** - Generate comprehensive compliance reports
12. **auto_fix_policy_violations** - Automatically fix policy violations where safe
13. **list_policy_rules** - List and manage policy rules

### 🎯 Policy Framework Features

- **🏛️ Comprehensive Policy Engine**: 13+ built-in rules across 5 categories (Security, Compliance, Performance, Cost, Operations)
- **🔒 Compliance Standards**: Pre-built support for SOC2, HIPAA, PCI-DSS, ISO27001 frameworks
- **🔧 Auto-Remediation**: Intelligent fixing of security contexts, resource limits, and configuration issues  
- **📊 Compliance Reporting**: Detailed audit reports with violation tracking and trend analysis
- **🎨 Custom Policies**: Create organization-specific rules with JSON configuration
- **🌍 External Configuration**: Store policies in external files for version control and environment separation
- **📋 Policy Templates**: Ready-to-use templates for different industries and compliance requirements
- **🔄 Real-time Evaluation**: Live policy checking during deployment operations
- **AI-Driven Automation**: Each tool provides rich, structured responses perfect for LLM interpretation
- **Kubernetes Native**: Built using the official Kubernetes JavaScript client
- **Comprehensive Monitoring**: Detailed status reporting with health checks, events, and metrics  
- **Safe Operations**: Built-in timeouts, error handling, and rollback capabilities
- **Production Ready**: Supports multiple deployment strategies and wait-for-completion patterns
- **🐳 Multi-Architecture**: Available for `linux/amd64` and `linux/arm64`
- **🔒 Security First**: Regular vulnerability scanning and automated dependency updates

## 🎯 Use Cases

<details>
<summary><strong>🏛️ Policy Compliance & Governance</strong></summary>

**Scenario:** You need to ensure all deployments meet organizational security and compliance standards.

**AI Interaction:**
```
User: "Check if my web-app deployment meets our security policies"

AI: "Let me evaluate your deployment against all policies..."
```

**MCP Tools Used:**
- `evaluate_deployment_policies()` - Check compliance against all rules
- `auto_fix_policy_violations()` - Fix security context and resource issues
- `generate_compliance_report()` - Generate audit reports

**Policy Categories & Rules:**

🔒 **Security Policies (5 rules)**
- Security contexts required (non-root users, read-only filesystems)
- Container image security (approved registries, no latest tags)
- Network policies and service account configurations
- Resource isolation and privilege escalation prevention

🏢 **Compliance Policies (3 rules)**  
- Required labels for governance (cost-center, team, component)
- Data classification and handling requirements
- Audit trail and change management compliance

⚡ **Performance Policies (3 rules)**
- Resource limits and requests defined  
- Health checks configured (liveness/readiness probes)
- Anti-affinity rules for high availability

💰 **Cost Optimization (2 rules)**
- Resource efficiency and right-sizing
- Idle resource detection and recommendations

🔧 **Operational Policies (3 rules)**
- Deployment strategy validation
- Configuration management best practices
- Monitoring and observability requirements

**Auto-Remediation Examples:**
- **Missing security context** → Add non-root user, read-only filesystem
- **No resource limits** → Apply recommended CPU/memory limits based on workload
- **Missing health checks** → Add liveness/readiness probes with sensible defaults
- **Incorrect labels** → Apply organization-standard labels automatically

**Compliance Standards Supported:**
- **HIPAA**: Healthcare data protection and privacy requirements
- **SOC2**: Security, availability, and confidentiality controls  
- **PCI-DSS**: Payment card industry data security standards
- **ISO27001**: Information security management systems
- **Custom**: Organization-specific governance frameworks

</details>

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

> ⚠️ **Production Note**: For production deployments, use this capability within your established CI/CD pipeline or during authorized emergency responses only. See [Security Disclaimers](#️-important-security--production-disclaimers) for guidelines.

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

> 🚨 **Emergency Use Only**: Rollback capabilities should only be used during declared production incidents with proper authorization. Follow your organization's incident response procedures.

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

## ⚠️ Important Security & Production Disclaimers

> **🚨 CRITICAL**: This MCP server is designed for **development, testing, and emergency scenarios** - NOT as a primary deployment tool for production environments.

### 🛡️ **Production Deployment Guidelines**

**✅ RECOMMENDED Usage:**
- **Development environments** - Testing and debugging applications
- **Staging/QA clusters** - Pre-production validation and troubleshooting  
- **Emergency response** - Critical production incidents requiring immediate intervention
- **Monitoring & observability** - Health checks and status monitoring
- **Learning & experimentation** - Understanding Kubernetes behavior

**❌ NOT RECOMMENDED for:**
- **Primary production deployments** - Use established CI/CD pipelines instead
- **Automated production changes** - Requires human oversight and approval
- **Unsupervised operations** - AI should not make autonomous production changes
- **Bypassing approval processes** - Always follow your organization's change management

### 🔐 **Security Best Practices**

#### **Principle of Least Privilege**
```yaml
# Example: Restricted RBAC for development use
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]  # Read-only in production
- apiGroups: [""]
  resources: ["pods", "events"]
  verbs: ["get", "list"]  # No write permissions
```

#### **Environment Separation**
- **Production clusters**: Read-only access or emergency-only permissions
- **Development clusters**: Full access for experimentation
- **Staging clusters**: Limited write access for testing
- **Namespace isolation**: Restrict access to specific namespaces

#### **Audit & Governance**
- **Audit logging**: Enable Kubernetes audit logs for all MCP operations
- **Change tracking**: Document all changes made through the MCP server
- **Approval workflows**: Require manual approval for production changes
- **Incident response**: Use only during declared incidents with proper authorization

### 🏗️ **DevOps Integration Guidelines**

#### **CI/CD Pipeline Integration**
```yaml
# Preferred: Use MCP server within CI/CD pipeline context
- name: "Deploy via CI/CD"
  run: |
    # Traditional CI/CD deployment
    kubectl apply -f manifests/
    # Use MCP server for post-deployment validation
    mcp-k8s-server get_deployment_status --deployment=myapp
```

#### **Proper Deployment Flow**
1. **Code Review** → **CI Pipeline** → **Automated Testing**
2. **Security Scanning** → **Build Artifacts** → **Staging Deployment**  
3. **QA Validation** → **Approval Process** → **Production Deployment**
4. **MCP Monitoring** → **Health Validation** → **Success Confirmation**

#### **Emergency Response Protocol**
```
ONLY use deployment/rollback tools in MCP server when:
✅ Declared production incident in progress
✅ Authorized personnel involved
✅ Standard CI/CD pipeline unavailable/too slow
✅ Proper incident documentation in place
✅ Post-incident review planned
```

### 📚 **Recommended Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging      │    │   Production    │
│    Cluster      │    │     Cluster      │    │    Cluster      │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ Full MCP Access │    │ Limited MCP      │    │ Read-Only MCP   │
│ - All tools     │    │ - No prod deploy │    │ - Monitoring    │
│ - Unrestricted  │    │ - Scale testing  │    │ - Emergency     │
│ - Learning      │    │ - Validation     │    │ - Audit only    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 🎯 **Summary**

The k8s MCP server is a **powerful diagnostic and emergency response tool** that enhances your DevOps capabilities. However, it should **complement**, not **replace**, your established CI/CD pipelines and change management processes.

**Think of it as:**
- 🔧 **A sophisticated wrench** - Great for specific tasks
- 🚨 **An emergency toolkit** - Essential when things go wrong  
- 👁️ **An observability lens** - Perfect for understanding system state

**NOT as:**
- 🏭 **A production assembly line** - That's what CI/CD is for
- 🤖 **An autonomous deployment system** - Human oversight is essential
- 🔓 **A way to bypass security** - Always follow the principle of least privilege

**Remember**: With great power comes great responsibility. Use wisely! 🦸‍♂️

## 📋 Prerequisites

- Node.js 18.0+ 
- Kubernetes cluster access with proper RBAC permissions
- Valid `kubeconfig` file configured for your cluster
- Basic understanding of Kubernetes deployments and the MCP protocol

## 🛠 Installation

### Using Docker (Recommended)

**Latest stable release:**
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

**With external policy configuration:**
```json
{
  "servers": {
    "k8s-deployment-server": {
      "command": "docker", 
      "args": [
        "run", "-i", "--rm",
        "-v", "/path/to/.kube:/home/mcp/.kube:ro",
        "-v", "/path/to/policies:/app/policies:ro",
        "-e", "POLICY_CONFIG_PATH=/app/policies/production.json",
        "ghcr.io/tsviz/k8s-mcp:latest"
      ],
      "type": "stdio"
    }
  }
}
```

**Specific version (recommended for production):**
```json
{
  "servers": {
    "k8s-deployment-server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/path/to/.kube:/home/mcp/.kube:ro",
        "ghcr.io/tsviz/k8s-mcp:v1.0.0"
      ],
      "type": "stdio"
    }
  }
}
```

**Multi-architecture support:**
- `linux/amd64` - Intel/AMD 64-bit
- `linux/arm64` - Apple Silicon (M1/M2) and ARM64 servers

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

### 7. evaluate_deployment_policies

Evaluate a deployment against organizational policies and compliance rules.

**Parameters:**
- `namespace` (string): Kubernetes namespace
- `deployment` (string): Deployment name
- `policyConfig` (string, optional): Path to external policy configuration

**Example Response:**
```
🏛️ Policy Evaluation Results for myapp in production:

📊 Overall Compliance: 85% (11/13 rules passed)

✅ PASSED (8 rules):
- sec-001: Security Context Defined
- sec-002: Non-Root User Required  
- perf-001: Resource Limits Set
- comp-001: Required Labels Present
- cost-001: Resource Efficiency
- ops-001: Health Checks Configured
- ops-002: Deployment Strategy Valid
- ops-003: Image Pull Policy Set

⚠️ FAILED (2 rules):
- sec-003: Read-Only Root Filesystem (MEDIUM)
  └ Containers should use read-only root filesystem
- comp-002: Cost Center Label Missing (LOW)  
  └ Required label 'cost-center' not found

🔧 Auto-Fix Available: 2 violations can be automatically remediated
💡 Recommendation: Run auto_fix_policy_violations to apply fixes
```

### 8. auto_fix_policy_violations

Automatically fix policy violations where safe to do so.

**Parameters:**
- `namespace` (string): Kubernetes namespace
- `deployment` (string): Deployment name
- `dryRun` (boolean, optional): Preview changes without applying
- `policyConfig` (string, optional): Path to external policy configuration

**Example Response:**
```
🔧 Auto-Fix Policy Violations for myapp in production:

📋 Fixes Applied (2 violations):

✅ Fixed: Read-Only Root Filesystem
- Added readOnlyRootFilesystem: true to all containers
- Impact: Enhanced security, prevents runtime file modifications

✅ Fixed: Cost Center Label Missing  
- Added label 'cost-center': 'engineering'
- Impact: Improved cost tracking and governance

🚀 Deployment Updated: Triggered rolling update
⏱️ Duration: 45000ms
📊 New Compliance Score: 100% (13/13 rules passed)

🛡️ Safety: Only safe, non-breaking changes were applied
💡 Manual Review Required: 0 violations need human intervention
```

### 9. generate_compliance_report

Generate comprehensive compliance reports for auditing and governance.

**Parameters:**
- `namespace` (string, optional): Specific namespace (default: all)
- `deployment` (string, optional): Specific deployment (default: all)
- `format` (enum, optional): "summary", "detailed", or "csv"
- `compliance` (string, optional): Compliance framework ("SOC2", "HIPAA", etc.)

**Example Response:**
```
📊 Compliance Report - Production Environment

🏢 Organization: ACME Corporation
📅 Generated: 2024-01-15T10:30:00Z
🎯 Scope: All deployments in production namespace
📋 Framework: SOC2 Type II

📈 Overall Compliance: 92% (156/170 total checks)

🔒 Security Compliance: 95% (38/40 checks)
├── Security contexts configured: 38/40 deployments
├── Non-root users enforced: 40/40 deployments  
├── Read-only filesystems: 35/40 deployments
└── Network policies applied: 38/40 deployments

🏢 Governance Compliance: 88% (35/40 checks)
├── Required labels present: 35/40 deployments
├── Cost center tracking: 35/40 deployments
├── Team ownership defined: 40/40 deployments
└── Environment classification: 35/40 deployments

⚠️ Top Violations:
1. Missing read-only filesystem (5 deployments)
2. Incomplete labeling strategy (5 deployments)
3. Resource limits not optimized (3 deployments)

🔧 Remediation Summary:
- Auto-fixable: 8 violations
- Manual review required: 6 violations
- Total estimated fix time: 2 hours

📊 Trend Analysis:
- Compliance improved 12% over last month
- Security score increased from 83% to 95%
- New violations decreased by 60%
```

### 10. list_policy_rules

List and manage available policy rules and their configurations.

**Parameters:**
- `category` (string, optional): Filter by category ("security", "compliance", etc.)
- `severity` (string, optional): Filter by severity ("low", "medium", "high", "critical")
- `enabled` (boolean, optional): Filter by enabled status
- `policyConfig` (string, optional): Path to external policy configuration

**Example Response:**
```
📋 Policy Rules Configuration (13 rules total)

🔒 Security Category (5 rules):
├── sec-001: Security Context Required [ENABLED] (HIGH)
│   └ Ensures all containers have security context defined
├── sec-002: Non-Root User Enforcement [ENABLED] (HIGH)  
│   └ Prevents containers from running as root user
├── sec-003: Read-Only Root Filesystem [ENABLED] (MEDIUM)
│   └ Requires read-only root filesystem for security
├── sec-004: Image Security Policies [ENABLED] (HIGH)
│   └ Validates container images from approved registries
└── sec-005: Network Security Controls [ENABLED] (MEDIUM)
    └ Ensures proper network policies and service accounts

🏢 Compliance Category (3 rules):
├── comp-001: Required Labels Present [ENABLED] (MEDIUM)
├── comp-002: Data Classification [ENABLED] (HIGH)
└── comp-003: Audit Trail Compliance [ENABLED] (LOW)

⚡ Performance Category (3 rules):
├── perf-001: Resource Limits Defined [ENABLED] (HIGH)
├── perf-002: Health Checks Configured [ENABLED] (MEDIUM)  
└── perf-003: Anti-Affinity Rules [ENABLED] (LOW)

💰 Cost Category (2 rules):
├── cost-001: Resource Efficiency [ENABLED] (MEDIUM)
└── cost-002: Idle Resource Detection [ENABLED] (LOW)

🔧 Operations Category (3 rules):
├── ops-001: Deployment Strategy [ENABLED] (MEDIUM)
├── ops-002: Configuration Management [ENABLED] (LOW)
└── ops-003: Monitoring Integration [ENABLED] (MEDIUM)

📊 Configuration Summary:
- Total Rules: 13
- Enabled: 13 (100%)
- Auto-Fix Capable: 8 rules
- Custom Rules: 0 (using built-in policies)

🔧 Policy Source: Built-in default policies
💡 Tip: Use POLICY_CONFIG_PATH to load external organization policies
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
- `POLICY_CONFIG_PATH`: Path to external policy configuration file

### Volume Mounts
- `~/.kube:/home/mcp/.kube:ro` - Kubeconfig access (read-only)
- `./config:/app/config:ro` - Built-in configuration files
- `./policies:/app/policies:ro` - External policy configuration files

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
# Core deployment management
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: [""]
  resources: ["pods", "events", "configmaps"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]

# Policy as Code requirements
- apiGroups: [""]
  resources: ["namespaces", "services", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["networking.k8s.io"]
  resources: ["networkpolicies"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["policy"]
  resources: ["podsecuritypolicies"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]
  verbs: ["get", "list", "watch"]

# For auto-remediation (optional - can be restricted in production)
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["update", "patch"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["create", "update", "patch"]
```

### 🔐 Production RBAC Considerations

**For Policy Evaluation Only (Read-Only):**
```yaml
# Restrict to read-only for production policy checking
rules:
- apiGroups: ["*"]
  resources: ["*"]  
  verbs: ["get", "list", "watch"]  # No write permissions
```

**For Development/Auto-Fix Environments:**
```yaml  
# Allow auto-remediation in development
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
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
