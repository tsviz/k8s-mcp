# Kubernetes Management for GitHub Copilot Chat

![Build Status](https://github.com/tsviz/k8s-mcp/workflows/🚀%20Release%20Docker%20Images/badge.svg)
![License](https://img.shields.io/github/license/tsviz/k8s-mcp)
![Version](https://img.shields.io/github/v/release/tsviz/k8s-mcp)

**Transform your Kubernetes operations with AI-powered conversations.** This Model Context Protocol (MCP) server connects GitHub Copilot Chat to your Kubernetes clusters, enabling natural language management of deployments, security policies, and operational tasks.

## 🎯 What This Does

Imagine having a Kubernetes expert right inside GitHub Copilot Chat who can:

- **🔍 Diagnose Issues**: "Why is my Spring Boot app restarting frequently?"
- **⚡ Scale Applications**: "Scale my API to handle Black Friday traffic"
- **🛡️ Fix Security**: "Show me all security violations and auto-fix what you can"
- **📊 Generate Reports**: "Create a compliance report for my production namespace"
- **🚑 Emergency Response**: "URGENT: Rollback the latest deployment, users reporting errors!"

Instead of running multiple `kubectl` commands and manually analyzing YAML files, you just ask GitHub Copilot Chat what you need.

## ✨ Key Value Propositions

### 🗣️ **Natural Language Operations**
```
You: "Which deployments are over-provisioned and wasting resources?"

Copilot: Let me analyze your cluster resources...
┌─────────────────┬─────────────┬─────────────┬────────────┐
│ Deployment      │ CPU Usage   │ Memory Usage│ Waste Score│
├─────────────────┼─────────────┼─────────────┼────────────┤
│ api-gateway     │ 15% (2 cores)│ 23% (4GB)  │ High       │
│ user-service    │ 8% (1 core) │ 12% (2GB)  │ Very High  │
│ payment-service │ 45% (1 core)│ 67% (1GB)  │ Good       │
└─────────────────┴─────────────┴─────────────┴────────────┘

I can automatically optimize these resource allocations. Would you like me to:
1. Scale down over-provisioned deployments
2. Adjust resource limits to match actual usage
3. Generate cost savings report
```

### 🎯 **Expert-Level Analysis**
```
You: "Audit my cluster for GDPR compliance requirements"

Copilot: Running GDPR compliance analysis across your cluster...

🔍 GDPR Compliance Report:
┌─ 🛡️ Data Protection ─────────────────────┐
│ ✅ Encryption at rest: Enabled          │
│ ❌ Data retention policies: Missing      │
│ ⚠️  Personal data labels: Incomplete     │
└────────────────────────────────────────────┘

Critical Issues Found:
• user-service: Stores PII without data classification labels
• logs-collector: Retains logs beyond 90-day requirement
• auth-service: Missing data encryption in transit

Auto-fixable: 2/3 issues
Manual review needed: Data retention policy setup

Would you like me to apply the auto-fixes?
```

### � **Instant Emergency Response**
```
You: "My app is getting OOMKilled errors - help me fix this now!"

Copilot: Analyzing your memory issues...

🚨 Critical Memory Analysis for payment-service:
┌─ Current State ──────────────────────────┐
│ Memory Limit: 512MB                      │
│ Memory Usage: 487MB (95% utilization)    │
│ OOMKilled Events: 23 in last hour        │
│ Pod Restarts: 47 times                   │
└────────────────────────────────────────────┘

🔧 Immediate Fix:
I'll increase memory limit to 1GB and add monitoring alerts.
This should resolve the OOMKilled errors immediately.

Applied changes:
✅ Memory limit: 512MB → 1GB
✅ Added memory monitoring alerts
✅ Triggered rolling restart with new limits

Monitor: kubectl get pods -l app=payment-service
```

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

## 🚀 Real-World Scenarios

### 🛡️ **Security & Compliance Deep Dive**

<details>
<summary><strong>"Show me all security violations across my cluster and auto-fix what you can"</strong></summary>

```
You: Show me all security violations across my cluster and auto-fix what you can

Copilot: Running comprehensive security analysis across all namespaces...

🔒 Security Violation Report:
┌─ Critical Issues (3) ─────────────────────┐
│ • auth-service: Running as root user      │
│ • api-gateway: No security context        │
│ • user-db: Privileged container mode      │
└──────────────────────────────────────────────┘

┌─ High Issues (5) ─────────────────────────┐
│ • payment-service: Read-write filesystem  │
│ • logs-collector: No resource limits      │
│ • cache-redis: Missing network policies   │
│ • admin-panel: Dangerous capabilities     │
│ • webhook-handler: No pod security policy │
└──────────────────────────────────────────────┘

🔧 Auto-fixing 6/8 violations...

✅ Fixed: auth-service → Added non-root security context
✅ Fixed: api-gateway → Applied security context template  
✅ Fixed: payment-service → Set read-only root filesystem
✅ Fixed: logs-collector → Added resource limits
✅ Fixed: admin-panel → Removed dangerous capabilities
✅ Fixed: webhook-handler → Applied pod security standards

⚠️ Manual Review Required:
• user-db: Privileged mode - needs architecture review
• cache-redis: Network policy - requires network topology analysis

New Security Score: 94% (was 72%)
```

</details>

<details>
<summary><strong>"Which deployments are running as root and why is that dangerous?"</strong></summary>

```
You: Which deployments are running as root and why is that dangerous?

Copilot: Scanning all deployments for root user containers...

🚨 Deployments Running as Root:
┌─────────────────┬───────────┬─────────────────┐
│ Deployment      │ Namespace │ Risk Level      │
├─────────────────┼───────────┼─────────────────┤
│ legacy-app      │ production│ 🔴 Critical     │
│ admin-tools     │ ops       │ 🟡 High         │
│ debug-container │ dev       │ 🟠 Medium       │
└─────────────────┴───────────┴─────────────────┘

⚠️ Why Running as Root is Dangerous:

1. **Container Escape Risk**: Root processes can potentially break out of containers
2. **Host System Access**: If compromised, attackers gain root access to the host
3. **Privilege Escalation**: Easier path for attackers to escalate privileges
4. **File System Damage**: Can modify/delete critical system files
5. **Compliance Violations**: Fails SOC2, PCI-DSS, and HIPAA requirements

🔧 Remediation Plan:

For legacy-app (CRITICAL):
• Create non-root user in Dockerfile
• Set runAsUser: 1001 in security context
• Test with read-only filesystem
• Estimated effort: 2-3 hours

Would you like me to auto-fix the security contexts for medium/low risk deployments?
```

</details>

<details>
<summary><strong>"Generate a compliance report for my production namespace"</strong></summary>

```
You: Generate a compliance report for my production namespace

Copilot: Generating comprehensive compliance report for production namespace...

📊 Production Namespace Compliance Report
Generated: 2024-01-15 | Framework: SOC2 Type II + CIS Kubernetes

┌─ Overall Compliance Score ─────────────────┐
│           🎯 87% COMPLIANT                 │
│     (174 of 200 controls passed)          │
└──────────────────────────────────────────────┘

🔒 Security Controls: 92% (46/50)
├─ Identity & Access: ✅ 100% (15/15)
├─ Network Security: ✅ 95% (19/20)  
├─ Data Protection: ⚠️  80% (12/15)
└─ Runtime Security: ✅ 100% (0/0)

🏢 Governance Controls: 85% (42/50)
├─ Change Management: ✅ 90% (18/20)
├─ Asset Management: ⚠️  75% (15/20)
├─ Incident Response: ✅ 90% (9/10)

⚠️ Top Non-Compliance Issues:
1. Missing data classification labels (8 deployments)
2. Incomplete backup configurations (3 databases)
3. Missing disaster recovery procedures (5 services)

📈 30-Day Trend:
• Security compliance: 78% → 92% (+14%)
• Governance compliance: 71% → 85% (+14%)
• Zero critical violations introduced
• 23 previously identified issues resolved

🎯 Next Steps:
1. Address data classification gaps (Est. 4 hours)
2. Implement automated backup validation
3. Document disaster recovery procedures
```

</details>

</details>

### ⚡ **Resource Optimization & Performance**

<details>
<summary><strong>"Which deployments are over-provisioned and wasting resources?"</strong></summary>

```
You: Which deployments are over-provisioned and wasting resources?

Copilot: Analyzing resource utilization across all deployments...

💰 Resource Waste Analysis:
┌─────────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ Deployment      │ CPU Waste   │ Memory Waste│ Monthly Cost│ Savings     │
├─────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ user-service    │ 85% unused  │ 78% unused  │ $340        │ $280        │
│ api-gateway     │ 72% unused  │ 65% unused  │ $680        │ $450        │
│ search-engine   │ 45% unused  │ 80% unused  │ $920        │ $420        │
│ analytics-api   │ 90% unused  │ 88% unused  │ $450        │ $380        │
│ notification    │ 67% unused  │ 45% unused  │ $230        │ $140        │
└─────────────────┴─────────────┴─────────────┴─────────────┴─────────────┘

🎯 Total Monthly Savings Potential: $1,670

📊 Resource Optimization Recommendations:

user-service:
  Current: CPU: 2 cores, Memory: 4GB
  Optimal:  CPU: 0.3 cores, Memory: 1GB
  Savings:  $280/month (82% reduction)

api-gateway:
  Current: CPU: 4 cores, Memory: 8GB  
  Optimal:  CPU: 1.2 cores, Memory: 3GB
  Savings:  $450/month (66% reduction)

🔧 Auto-Optimization Available:
✅ Can safely optimize 4/5 deployments
⚠️  search-engine needs performance testing

Would you like me to apply these optimizations?
I'll do it gradually to ensure no performance impact.
```

</details>

<details>
<summary><strong>"Show me CPU and memory usage patterns across all my apps"</strong></summary>

```
You: Show me CPU and memory usage patterns across all my apps

Copilot: Analyzing 7-day resource usage patterns...

📈 CPU Usage Patterns:
┌─ Peak Hours (9AM-5PM EST) ─────────────────┐
│ api-gateway:     45-78% (heavy morning load)│
│ user-service:    23-45% (steady usage)     │
│ payment-service: 67-89% (lunch peak)       │
│ search-engine:   12-34% (evening spikes)   │
└──────────────────────────────────────────────┘

┌─ Off-Peak Hours (6PM-8AM EST) ─────────────┐
│ api-gateway:     8-15% (can scale down)    │
│ user-service:    5-12% (maintenance window)│
│ payment-service: 15-23% (minimal traffic)  │
│ search-engine:   3-8% (background indexing)│
└──────────────────────────────────────────────┘

🧠 Memory Usage Patterns:
• Most apps: Steady memory consumption
• payment-service: Memory leaks detected (grows 2MB/hour)
• search-engine: Spiky memory during index rebuilds

💡 Smart Scaling Opportunities:
1. Scale down api-gateway 60% during off-peak hours
2. Implement memory alerts for payment-service  
3. Add memory limits to prevent search-engine spikes

Estimated savings: $890/month with smart auto-scaling
```

</details>

</details>

### 🔧 **Operational Excellence**

<details>
<summary><strong>"Which deployments are missing health checks and how critical is that?"</strong></summary>

```
You: Which deployments are missing health checks and how critical is that?

Copilot: Analyzing health check configurations across all deployments...

🏥 Health Check Analysis:
┌─────────────────┬───────────────┬─────────────────┬─────────────────┐
│ Deployment      │ Liveness      │ Readiness       │ Risk Level      │
├─────────────────┼───────────────┼─────────────────┼─────────────────┤
│ payment-service │ ❌ Missing    │ ❌ Missing      │ 🔴 Critical     │
│ user-auth       │ ✅ Configured │ ❌ Missing      │ 🟡 High         │
│ notification    │ ❌ Missing    │ ✅ Configured   │ 🟠 Medium       │
│ logs-collector  │ ❌ Missing    │ ❌ Missing      │ 🟢 Low          │
└─────────────────┴───────────────┴─────────────────┴─────────────────┘

🚨 Critical Impact Analysis:

payment-service (CRITICAL RISK):
• No automatic failure detection
• Failed pods continue receiving traffic
• Manual intervention required for recovery
• Estimated downtime per incident: 15-45 minutes
• Business impact: Payment processing failures

💡 Real Consequences:
• Last month: 3 incidents of undetected failures
• Average recovery time: 28 minutes
• Lost revenue: ~$12,000 per incident

🔧 Auto-Fix Available:
I can add standard health checks for all missing deployments:

payment-service:
  Liveness:  HTTP GET /health every 30s
  Readiness: HTTP GET /ready every 10s
  
user-auth:
  Readiness: HTTP GET /status every 5s

Would you like me to apply these health checks now?
```

</details>

</details>

### 🚑 **Troubleshooting & Debugging**

<details>
<summary><strong>"Why is my Spring Boot app pod restarting frequently?"</strong></summary>

```
You: Why is my Spring Boot app pod restarting frequently?

Copilot: Analyzing restart patterns for your Spring Boot application...

🔍 Restart Analysis for spring-api:
┌─ Restart Statistics (Last 24h) ───────────┐
│ Total Restarts: 47                        │
│ Restart Frequency: Every 18 minutes       │
│ Longest Uptime: 2h 15m                    │
│ Average Uptime: 22 minutes                │
└──────────────────────────────────────────────┘

🚨 Root Cause Analysis:

1. **Memory Issues (Primary)**:
   • OOMKilled: 31 times (66% of restarts)
   • Memory limit: 512MB
   • Peak usage: 498MB (97% utilization)
   • Memory leak suspected in session management

2. **Database Connection Pool**:
   • Connection timeouts: 12 occurrences
   • Pool exhaustion every ~30 minutes
   • Max connections: 20 (too low for load)

3. **Startup Problems**:
   • Failed health checks: 4 times
   • Liquibase lock contention on startup
   • Average startup time: 89 seconds

🔧 Immediate Fixes Applied:
✅ Increased memory limit: 512MB → 1.5GB
✅ Expanded connection pool: 20 → 50 connections
✅ Added JVM heap dump on OOM
✅ Optimized startup health check timing

📊 Expected Results:
• 90% reduction in OOMKilled restarts
• Faster startup time (89s → ~35s)
• Stable uptime: 22min → 6+ hours

Monitor improvements: kubectl get pods -l app=spring-api --watch
```

</details>

<details>
<summary><strong>"What's causing high memory usage in my postgres deployment?"</strong></summary>

```
You: What's causing high memory usage in my postgres deployment?

Copilot: Analyzing PostgreSQL memory usage patterns...

🗄️ PostgreSQL Memory Analysis:
┌─ Current Memory State ─────────────────────┐
│ Total Allocated: 3.2GB / 4GB (80%)        │
│ Shared Buffers: 1.1GB (35%)               │
│ Work Memory: 890MB (28%)                   │
│ Connection Memory: 450MB (14%)             │
│ OS Cache: 760MB (23%)                      │
└──────────────────────────────────────────────┘

🔍 Memory Usage Breakdown:

1. **Shared Buffers (1.1GB)**:
   • Configuration: shared_buffers = 1GB
   • Usage: 95% full (near optimal)
   • Cache hit ratio: 99.2% (excellent)

2. **Work Memory Per Query (890MB)**:
   ⚠️  ISSUE: work_mem = 128MB × 7 concurrent sorts
   • Large sort operations from analytics queries
   • Temporary file usage: 2.3GB (inefficient)

3. **Connection Overhead (450MB)**:
   ⚠️  ISSUE: 85 active connections (too many)
   • Each connection: ~5MB overhead
   • Many idle connections from connection leaks

🔧 Optimization Recommendations:

Immediate Fixes:
1. Reduce work_mem: 128MB → 64MB (prevents memory spikes)
2. Implement connection pooling (pgbouncer)
3. Kill idle connections older than 30 minutes

Query Optimization:
• 3 slow queries consuming 60% of work memory
• Add missing indexes on analytics tables
• Optimize daily report generation

Expected Memory Reduction: 800MB (25% improvement)
```

</details>

</details>

### 🎯 **Advanced Analysis**

<details>
<summary><strong>"If my cluster was a restaurant, what would the health inspector say?"</strong></summary>

```
You: If my cluster was a restaurant, what would the health inspector say?

Copilot: 🍽️ Kubernetes Cluster Health Inspection Report

👨‍🍳 **RESTAURANT REVIEW: "Cluster Café"**
⭐⭐⭐⭐⭐ 4.2/5 stars | Grade: B+ | Some violations found

🧑‍⚖️ **HEALTH INSPECTOR'S FINDINGS:**

┌─ 🚨 CRITICAL VIOLATIONS ──────────────────┐
│ 🔴 Raw ingredients exposed (running as root)│
│ 🔴 No hand washing stations (no security ctx)│
│ 🔴 Unlabeled mystery containers (no labels) │
└──────────────────────────────────────────────┘

┌─ ⚠️  MAJOR VIOLATIONS ────────────────────┐
│ � Food sitting out too long (no health checks)│
│ 🟡 Overcrowded kitchen (resource limits)   │
│ 🟡 No fire suppression (missing monitoring)│
└──────────────────────────────────────────────┘

👨‍🍳 **WHAT THE CHEF (DevOps) SAYS:**
"We've been so busy serving customers, we forgot basic safety! 
The payment-service has been running as root since opening day,
and half our containers don't even have proper labels."

🛡️ **HEALTH INSPECTOR'S ORDERS:**
1. **Immediate shutdown** of payment-service until security fixed
2. **30-day improvement plan** for all root containers  
3. **Weekly health checks** must be implemented
4. **Full reinspection** in 2 weeks

📋 **IMPROVEMENT CHECKLIST:**
□ Install proper security contexts (hand washing stations)
□ Add resource limits (portion control)
□ Implement health checks (food temperature monitoring)
□ Label all containers (ingredient labeling)
□ Add monitoring alerts (smoke detectors)

**REINSPECTION PREDICTION:** ⭐⭐⭐⭐⭐ 4.8/5 stars
"With these fixes, Cluster Café will be a 5-star establishment!"

Would you like me to start implementing the health inspector's orders? 🧑‍🍳👮‍♂️
```

</details>

</details>

## 🚀 Quick Start

### Prerequisites
- Docker installed
- Kubernetes cluster access
- GitHub Copilot Chat enabled

### 1-Minute Setup
## 🚀 Quick Start

### Prerequisites
- Docker installed
- Kubernetes cluster access
- GitHub Copilot Chat enabled

### 1-Minute Setup

**Step 1**: Add to your GitHub Copilot Chat MCP configuration:

```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "~/.kube:/home/mcp/.kube:ro",
        "ghcr.io/tsviz/k8s-mcp:latest"
      ]
    }
  }
}
```

**Step 2**: Test the connection in GitHub Copilot Chat:

```
You: "Show me all deployments in my cluster"

Copilot: Let me check your Kubernetes deployments...
[Lists all deployments with health status]
```

**Step 3**: Start using natural language for Kubernetes operations!

### Configuration Options

#### Basic Configuration (Recommended)
```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "~/.kube:/home/mcp/.kube:ro",
        "ghcr.io/tsviz/k8s-mcp:latest"
      ]
    }
  }
}
```

#### With Custom Policies
```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "~/.kube:/home/mcp/.kube:ro",
        "-v", "/path/to/policies:/app/policies:ro",
        "-e", "POLICY_CONFIG_PATH=/app/policies/production.json",
        "ghcr.io/tsviz/k8s-mcp:latest"
      ]
    }
  }
}
```

#### Production Environment
```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "~/.kube:/home/mcp/.kube:ro",
        "-e", "NODE_ENV=production",
        "ghcr.io/tsviz/k8s-mcp:v1.0.0"
      ]
    }
  }
}
```

### Alternative Installation Methods

<details>
<summary><strong>From Source (Development)</strong></summary>

```bash
git clone https://github.com/tsviz/k8s-mcp.git
cd k8s-mcp
npm install
npm run build
npm start
```

Then configure GitHub Copilot Chat:
```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/k8s-mcp"
    }
  }
}
```

</details>

<details>
<summary><strong>In-Cluster Deployment</strong></summary>

```bash
kubectl apply -f examples/rbac.yaml
kubectl apply -f examples/k8s-deployment.yaml
```

Connect via port-forward:
```bash
kubectl port-forward svc/k8s-mcp-server 3000:3000
```

</details>

## 💬 How to Use with GitHub Copilot Chat

### Natural Language Commands

Instead of remembering complex `kubectl` commands, just tell GitHub Copilot Chat what you want:

```
✅ "Scale my API to handle more traffic"
✅ "Show me why my pods are failing"  
✅ "Fix all security issues automatically"
✅ "Generate a compliance report for auditors"
✅ "Deploy version 2.1.0 with zero downtime"
```

### Getting Started Conversation

```
You: What can you help me with for Kubernetes?

Copilot: I can help you manage your Kubernetes cluster! Here's what I can do:

🔍 **Diagnostics & Monitoring**
• Check deployment health and status
• Analyze resource usage patterns  
• Identify performance bottlenecks
• Review pod logs and error patterns

⚙️ **Operations & Management**  
• Scale deployments up/down
• Deploy new versions safely
• Rollback problematic deployments
• Toggle feature flags

🛡️ **Security & Compliance**
• Scan for security violations
• Auto-fix common security issues
• Generate compliance reports
• Enforce organizational policies

Try asking me: "Show me the status of all my deployments"
```

### Common Conversation Patterns

<details>
<summary><strong>Performance Troubleshooting</strong></summary>

```
You: My app seems slow, can you investigate?

Copilot: I'll check your deployment health and recent events...

[Runs diagnostic analysis]

Found the issue! Your app is experiencing:
• Memory pressure (95% utilization)
• Slow database connections (avg 2.3s)
• Missing readiness probes causing traffic to failing pods

Would you like me to:
1. Increase memory limits
2. Scale up database connections  
3. Add proper health checks
```

</details>

<details>
<summary><strong>Emergency Response</strong></summary>

```
You: URGENT: Users reporting 500 errors after latest deploy!

Copilot: 🚨 Emergency response initiated!

Analyzing recent deployments...
• payment-service v2.1.0 deployed 15 minutes ago
• Error rate spiked from 0.1% to 23%
• 347 users affected

Executing immediate rollback...
✅ Rolled back to v2.0.8 (last stable version)
✅ Error rate dropping: 23% → 3% → 0.2%
✅ All pods healthy

Incident resolved in 2m 34s. 
Root cause analysis: New version had database migration issue.
```

</details>

<details>
<summary><strong>Capacity Planning</strong></summary>

```
You: We're expecting 10x traffic for Black Friday. Are we ready?

Copilot: Let me analyze your current capacity and predict needs...

📊 Current Capacity Analysis:
• API Gateway: Can handle ~2,000 RPS (currently 200 RPS)  
• Database: 85% connection utilization (near limit)
• Payment Service: CPU at 45% (room to scale)

📈 Black Friday Projections (10x traffic):
• Need: 2,000 RPS → 20,000 RPS
• Bottlenecks identified:
  1. Database connections (immediate limit)
  2. Payment service CPU (will hit 450%)

🔧 Recommended Pre-scaling:
• API Gateway: 3 → 15 replicas  
• Payment Service: 5 → 25 replicas
• Database: Enable connection pooling + read replicas

Would you like me to implement these changes gradually?
```

</details>

## 🛡️ Security & Best Practices

### Production Usage Guidelines

✅ **Recommended for:**
- Development and testing environments
- Emergency troubleshooting in production
- Policy compliance monitoring  
- Capacity planning and optimization

⚠️ **Use with caution in production:**
- Always follow your organization's change management procedures
- Use read-only modes for production clusters when possible
- Implement proper RBAC restrictions
- Monitor all changes through audit logs

### Security Best Practices

```yaml
# Example: Production RBAC (Read-only)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: mcp-k8s-readonly
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["get", "list", "watch"]  # No write permissions
```

### Emergency Response Protocol

```
✅ Use MCP deployment tools when:
• Declared production incident in progress
• Standard CI/CD pipeline unavailable
• Immediate intervention required
• Proper authorization obtained

❌ Do NOT use for:
• Regular planned deployments
• Bypassing approval processes  
• Unsupervised automated changes
```

## 🔧 Core Capabilities

This MCP server provides 13 specialized tools for Kubernetes management:

### Deployment Management
- **get_deployment_status** - Health checks and diagnostics
- **scale_deployment** - Horizontal scaling with safety checks  
- **deploy_version** - Safe version deployments with rollout tracking
- **rollback_deployment** - Emergency rollbacks with revision control

### Operational Tools  
- **get_cluster_info** - Cluster overview and connection status
- **list_namespaces** - Namespace inventory with deployment counts
- **list_deployments** - Deployment catalog with health indicators
- **get_pod_logs** - Log analysis and debugging support
- **toggle_feature_flag** - Feature flag management via environment variables

### Policy & Compliance
- **evaluate_deployment_policies** - Security and compliance scanning
- **auto_fix_policy_violations** - Automated remediation of common issues
- **generate_compliance_report** - Audit reports for governance
- **list_policy_rules** - Policy configuration management

Each tool is designed to work seamlessly with GitHub Copilot Chat's natural language interface.

## 🏛️ Policy Engine Features

### Built-in Policy Categories

| Category | Rules | Examples |
|----------|-------|----------|
| 🔒 **Security** | 5 rules | Non-root users, security contexts, image policies |
| 🏢 **Compliance** | 3 rules | Required labels, data classification, audit trails |
| ⚡ **Performance** | 3 rules | Resource limits, health checks, availability |
| 💰 **Cost** | 2 rules | Resource efficiency, idle resource detection |
| 🔧 **Operations** | 3+ rules | Deployment strategies, configuration management |

### Auto-Remediation Capabilities

```
🔧 Can automatically fix:
✅ Missing security contexts
✅ Absent resource limits  
✅ Missing health checks
✅ Incorrect labels
✅ Privilege escalation issues

⚠️ Requires manual review:
• Privileged container configurations
• Network policy changes
• Database connection optimizations
```

## 🐳 Docker Multi-Architecture

Available for both Intel and ARM architectures:
- `linux/amd64` - Intel/AMD processors
- `linux/arm64` - Apple Silicon (M1/M2) and ARM servers

```bash
# Docker automatically selects the right architecture
docker pull ghcr.io/tsviz/k8s-mcp:latest
```

## 📚 Additional Resources

- **[Detailed Tool Reference](TOOLS.md)** - Complete API documentation
- **[Policy Configuration Guide](docs/POLICY_AS_CODE.md)** - Custom policy setup
- **[External Policy Examples](docs/EXTERNAL_POLICY_CONFIG.md)** - Organization templates
- **[Examples Directory](examples/)** - Sample configurations and YAML files

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🚀 Transform your Kubernetes operations with AI-powered conversations in GitHub Copilot Chat!**

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
