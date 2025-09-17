# MCP Server Tools Catalog

A concise, discoverable catalog of all MCP tools exposed by this server. Use the `list_tools` meta tool for an always up-to-date runtime view.

## 🔍 Quick Discovery

From a Copilot / MCP chat, run:

```
Tool: list_tools
Args: {}
```

Filter by substring:
```
Tool: list_tools
Args: { "filter": "deploy" }
```

## 🧰 Tool Categories

| Category | Tools |
|----------|-------|
| Cluster & Inventory | get_cluster_info, list_namespaces, list_deployments |
| Deployment Lifecycle | get_deployment_status, scale_deployment, deploy_version, rollback_deployment |
| Debug & Diagnostics | get_pod_logs |
| Feature Management | toggle_feature_flag |
| Policy Evaluation | evaluate_deployment_policies, list_policy_rules, auto_fix_policy_violations |
| Compliance & Reporting | generate_compliance_report, preview_policy_impact |
| Policy Generation & Tuning | generate_policy_configuration, validate_policy_configuration, suggest_policy_customizations |
| Meta / Discovery | list_tools, natural_language_command |

---

## 📦 Detailed Reference

### Cluster & Inventory
#### get_cluster_info
Returns cluster meta (name, server URL, version, counts). Use before other actions to verify connectivity.

#### list_namespaces
Lists namespaces with deployment counts and status.

#### list_deployments
Lists deployments optionally scoped by namespace with health summary.

### Deployment Lifecycle
#### get_deployment_status
Shows replica readiness, conditions, rollout state, optional events.

#### scale_deployment
Horizontally scale a deployment with optional wait for readiness.

#### deploy_version
Update deployment image with strategy (RollingUpdate/Recreate) and progress stats.

#### rollback_deployment
Rollback to previous or specific revision; reports images and timings.

### Debug & Diagnostics
#### get_pod_logs
Fetch recent pod logs for a deployment; supports container selection, previous instance and tail length.

### Feature Management
#### toggle_feature_flag
Enable/disable a feature flag via env var or ConfigMap injection.

### Policy Evaluation
#### evaluate_deployment_policies
Evaluate a single deployment; returns violations + warnings + summary.

#### list_policy_rules
List all rules (or by category) with severity and auto-fix info.

#### auto_fix_policy_violations
Apply safe remediation steps for fixable violations (dry-run supported via future enhancement).

### Compliance & Reporting
#### generate_compliance_report
Aggregate compliance for a namespace or whole cluster.

#### preview_policy_impact
What-if comparison between current and alternate config file.

### Policy Generation & Tuning
#### generate_policy_configuration
Produce baseline config JSON from high-level org inputs.

#### validate_policy_configuration
Check a config file structure and rule references.

#### suggest_policy_customizations
Analyze repeated violations to recommend overrides (strict/advisory, enable/disable).

### Meta
#### list_tools
Enumerate all registered tools, their parameters, and example invocation objects.

#### natural_language_command
Parses a free‑form English instruction and returns the inferred tool + structured parameters (does NOT automatically execute the underlying action to avoid unintended changes). Use when you want to explore or prototype without memorizing tool names.

Example queries:
```
"Scale deployment cart-api in namespace shop to 5 replicas"
"Show me the status of deployment payments in ns prod"
"Deploy image ghcr.io/acme/api:v2.3.1 to deployment api-gateway in namespace edge"
"Generate a compliance report for namespace finance"
```

If required parameters are missing you’ll get a prompt listing them. Ambiguous or unknown requests return suggested alternative tools.

---

## 🗺 Usage Patterns

| Goal | Recommended Sequence |
|------|----------------------|
| Onboard / explore | list_tools → get_cluster_info → list_namespaces → list_deployments |
| Scale app | get_deployment_status → scale_deployment → get_deployment_status |
| Deploy new version | deploy_version → get_deployment_status → rollback_deployment (if needed) |
| Investigate issue | get_deployment_status → get_pod_logs → evaluate_deployment_policies |
| Improve compliance | generate_compliance_report → suggest_policy_customizations → preview_policy_impact |
| Create new policy config | generate_policy_configuration → validate_policy_configuration → preview_policy_impact |
| Auto remediate | evaluate_deployment_policies → auto_fix_policy_violations → re-run evaluate |

---

## 💡 Best Practices
- Use `list_tools` periodically—future versions may add tools without code browsing.
- Always start with `get_cluster_info` to surface connectivity issues early.
- Run `generate_compliance_report` before large-scale changes to establish a baseline.
- Use `preview_policy_impact` before swapping configs in production.
- Prefer advisory enforcement first; escalate to strict once noise is reduced.

---

## 🔄 Keeping Docs Current
This file is static; the canonical runtime source of truth is the `list_tools` meta tool. Update this file when adding or renaming tools for external consumers.

