# External Policy Configuration Guide

## 📁 **Policy Storage Locations**

### **Built-in Policies** (Default)
- **Location**: `src/policy-engine.ts` (hardcoded)
- **Usage**: Automatically loaded when no external config is provided
- **Categories**: Security, Compliance, Performance, Cost, Operations

### **External Policy Configurations**
- **Location**: `config/policies/` directory
- **Format**: JSON files following the policy schema
- **Examples**:
  - `config/policies/production.json` - Production environment
  - `config/policies/development.json` - Development environment  
  - `config/policies/hipaa-compliant.json` - Healthcare compliance
  - `config/policies/schema.json` - JSON schema for validation

## 🔧 **MCP Configuration Methods**

### **1. Environment Variable Method**

Set the `POLICY_CONFIG_PATH` environment variable to point to your policy file:

```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/k8s-mcp",
      "env": {
        "POLICY_CONFIG_PATH": "/path/to/your/policies/production.json",
        "NODE_ENV": "production",
        "KUBECONFIG": "/path/to/.kube/config"
      }
    }
  }
}
```

### **2. Automatic Environment Detection**

The server automatically selects policies based on `NODE_ENV`:

```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "NODE_ENV": "production"  // Loads config/policies/production.json
      }
    }
  }
}
```

**Environment Mapping**:
- `NODE_ENV=production` → `config/policies/production.json`
- `NODE_ENV=development` → `config/policies/development.json`
- No `NODE_ENV` → Uses built-in default policies

### **3. Docker Configuration**

#### **A. Volume Mount Method**
```json
{
  "mcpServers": {
    "k8s-deployment-server-docker": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/Users/you/.kube:/home/mcp/.kube:ro",
        "-v", "/path/to/your/policies:/app/policies:ro",
        "-e", "POLICY_CONFIG_PATH=/app/policies/production.json",
        "ghcr.io/tsviz/k8s-mcp:latest"
      ]
    }
  }
}
```

#### **B. Docker Compose Method**
```yaml
# docker-compose.yml
version: '3.8'
services:
  k8s-mcp-server:
    image: ghcr.io/tsviz/k8s-mcp:latest
    environment:
      - POLICY_CONFIG_PATH=/app/config/policies/production.json
      - NODE_ENV=production
    volumes:
      - ~/.kube:/home/mcp/.kube:ro
      - ./my-policies:/app/config/policies:ro
```

MCP Configuration:
```json
{
  "mcpServers": {
    "k8s-deployment-server": {
      "command": "docker-compose",
      "args": ["-f", "/path/to/docker-compose.yml", "run", "--rm", "k8s-mcp-server"]
    }
  }
}
```

## 📋 **Policy Configuration Structure**

### **Complete Example**
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
    "excludedNamespaces": ["kube-system", "kube-public"]
  },
  "categories": {
    "security": {
      "enabled": true,
      "enforcement": "strict",
      "autoFix": true
    },
    "compliance": {
      "enabled": true,
      "enforcement": "strict", 
      "autoFix": false
    }
  },
  "ruleOverrides": {
    "sec-001": {
      "enabled": true,
      "severity": "critical"
    }
  },
  "customRules": [
    {
      "id": "acme-001",
      "name": "ACME Approved Images",
      "description": "Only approved registry images allowed",
      "severity": "high",
      "category": "compliance",
      "enabled": true,
      "scope": "deployment",
      "conditions": [
        {
          "field": "spec.template.spec.containers[*].image",
          "operator": "regex_match",
          "value": "^registry\\.acme\\.com/"
        }
      ],
      "actions": [
        {
          "type": "deny",
          "message": "Only images from registry.acme.com are allowed"
        }
      ]
    }
  ]
}
```

## 🏢 **Organization-Specific Examples**

### **Enterprise Production** (`/etc/k8s-policies/production.json`)
```json
{
  "organization": {
    "name": "Enterprise Corp",
    "environment": "production",
    "compliance": ["SOC2", "ISO27001", "PCI-DSS"]
  },
  "global": {
    "enforcement": "strict",
    "autoFix": false
  },
  "notifications": {
    "slack": {
      "webhookUrl": "https://hooks.slack.com/...",
      "channel": "#platform-alerts",
      "severityLevels": ["high", "critical"]
    },
    "email": {
      "recipients": ["platform@enterprise.com"],
      "severityLevels": ["critical"]
    }
  }
}
```

MCP Config:
```json
{
  "mcpServers": {
    "k8s-enterprise": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "POLICY_CONFIG_PATH": "/etc/k8s-policies/production.json"
      }
    }
  }
}
```

### **Healthcare (HIPAA)** (`/opt/healthcare/k8s-policies.json`)
```json
{
  "organization": {
    "name": "HealthCorp",
    "environment": "production",
    "compliance": ["HIPAA", "SOC2"]
  },
  "customRules": [
    {
      "id": "hipaa-phi-encryption",
      "name": "PHI Data Encryption Required",
      "severity": "critical",
      "category": "compliance",
      "conditions": [
        {
          "field": "spec.template.spec.volumes[*].persistentVolumeClaim",
          "operator": "exists",
          "value": true
        }
      ],
      "actions": [
        {
          "type": "deny", 
          "message": "All PHI data volumes must be encrypted"
        }
      ]
    }
  ]
}
```

### **Development Team** (`./dev-policies.json`)
```json
{
  "organization": {
    "name": "Dev Team",
    "environment": "development"
  },
  "global": {
    "enforcement": "advisory",
    "autoFix": true
  },
  "categories": {
    "compliance": {
      "enabled": false
    },
    "cost": {
      "enabled": true,
      "enforcement": "advisory"
    }
  }
}
```

## 🔄 **Runtime Policy Updates**

### **Method 1: Environment Variable Update**
```bash
# Update the policy file
vim /path/to/policies/production.json

# Restart the MCP server to reload policies
# (No built-in hot reload currently)
```

### **Method 2: Docker Volume Update**
```bash
# Update mounted policy file
vim ./my-policies/production.json

# Restart container to reload
docker-compose restart k8s-mcp-server
```

### **Method 3: Multiple Configurations**
Set up different MCP servers for different policy sets:

```json
{
  "mcpServers": {
    "k8s-strict": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "POLICY_CONFIG_PATH": "/policies/strict-production.json"
      }
    },
    "k8s-relaxed": {
      "command": "node", 
      "args": ["dist/index.js"],
      "env": {
        "POLICY_CONFIG_PATH": "/policies/development.json"
      }
    }
  }
}
```

## 🔍 **Validation and Testing**

### **Schema Validation**
Use the provided JSON schema to validate your policy files:

```bash
# Install a JSON schema validator
npm install -g ajv-cli

# Validate your policy file
ajv validate -s config/policies/schema.json -d your-policy.json
```

### **Policy CLI Testing**
Test your policies before deployment:

```bash
# Build the server
npm run build

# Test with your policy file
POLICY_CONFIG_PATH=/path/to/your/policy.json npm run policy:check default my-app
```

### **Docker Testing**
```bash
# Test with Docker
docker run --rm \
  -v ~/.kube:/home/mcp/.kube:ro \
  -v ./your-policies:/app/policies:ro \
  -e POLICY_CONFIG_PATH=/app/policies/test.json \
  ghcr.io/tsviz/k8s-mcp:latest
```

## 📚 **Best Practices**

### **1. Version Control**
- Store policy files in version control
- Use separate repositories for sensitive policies
- Tag policy versions for rollback capability

### **2. Environment Separation**
- Use different policy files per environment
- Test policies in development before production
- Gradual rollout of new policies

### **3. Security**
- Restrict access to policy configuration files
- Use read-only mounts in Docker
- Audit policy changes

### **4. Monitoring**
- Monitor policy evaluation results
- Set up alerts for critical violations
- Regular compliance reporting

## 🔗 **Related Files**

- **Schema**: `config/policies/schema.json`
- **Examples**: `config/policies/*.json`
- **Documentation**: `docs/POLICY_AS_CODE.md`
- **MCP Configs**: `examples/mcp-*-config.json`
