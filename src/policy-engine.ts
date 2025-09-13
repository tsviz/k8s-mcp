import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as path from 'path';

// Policy Types and Interfaces
export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'compliance' | 'performance' | 'cost' | 'operations';
  enabled: boolean;
  scope: 'cluster' | 'namespace' | 'deployment' | 'pod' | 'resource';
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  metadata?: Record<string, any>;
}

export interface PolicyCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'regex_match' | 'exists' | 'not_exists';
  value: any;
  description?: string;
}

export interface PolicyAction {
  type: 'deny' | 'warn' | 'modify' | 'audit' | 'notify';
  message: string;
  autoFix?: boolean;
  fixAction?: string;
  notificationChannels?: string[];
}

export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  severity: string;
  category: string;
  resource: {
    kind: string;
    name: string;
    namespace?: string;
  };
  message: string;
  field?: string;
  currentValue?: any;
  suggestedValue?: any;
  canAutoFix: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PolicyEvaluationResult {
  passed: boolean;
  violations: PolicyViolation[];
  warnings: PolicyViolation[];
  summary: {
    totalRules: number;
    passedRules: number;
    failedRules: number;
    violationsBySeverity: Record<string, number>;
    violationsByCategory: Record<string, number>;
  };
}

export interface PolicyConfiguration {
  organization: {
    name: string;
    environment: 'development' | 'staging' | 'production';
    compliance?: string[];
  };
  global: {
    enforcement: 'strict' | 'advisory' | 'disabled';
    autoFix: boolean;
    excludedNamespaces?: string[];
  };
  categories: {
    [key: string]: {
      enabled: boolean;
      enforcement: 'strict' | 'advisory' | 'disabled';
      autoFix: boolean;
    };
  };
  customRules?: PolicyRule[];
  ruleOverrides?: {
    [ruleId: string]: {
      enabled?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      enforcement?: 'strict' | 'advisory' | 'disabled';
    };
  };
  notifications?: {
    slack?: {
      webhookUrl: string;
      channel: string;
      severityLevels: string[];
    };
    email?: {
      recipients: string[];
      severityLevels: string[];
    };
  };
}

export interface ComplianceReport {
  timestamp: string;
  cluster: string;
  namespace?: string;
  overallCompliance: number; // percentage
  results: PolicyEvaluationResult;
  recommendations: string[];
  trends?: {
    complianceHistory: Array<{
      timestamp: string;
      compliance: number;
    }>;
  };
}

/**
 * Policy Engine for Kubernetes governance and compliance
 */
export class PolicyEngine {
  private rules: Map<string, PolicyRule> = new Map();
  private kc: k8s.KubeConfig;
  private k8sApi: k8s.AppsV1Api;
  private coreApi: k8s.CoreV1Api;
  private config?: PolicyConfiguration;

  constructor(kubeConfig: k8s.KubeConfig, configPath?: string) {
    this.kc = kubeConfig;
    this.k8sApi = this.kc.makeApiClient(k8s.AppsV1Api);
    this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    
    // Load configuration from file if provided
    if (configPath) {
      this.loadConfiguration(configPath);
    }
    
    this.loadDefaultPolicies();
    this.applyConfiguration();
  }

  /**
   * Validate a policy configuration object for structural and logical issues.
   * This does NOT throw; it returns a report that callers/tools can surface.
   */
  validateConfiguration(config: any): { isValid: boolean; errors?: string[]; warnings?: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Configuration root must be an object');
      return { isValid: false, errors };
    }

    // Organization
    if (!config.organization?.name) errors.push('organization.name is required');
    if (!config.organization?.environment) errors.push('organization.environment is required');

    // Global
    if (!config.global) errors.push('global section is required');
    if (config.global && !['strict','advisory','disabled'].includes(config.global.enforcement)) {
      errors.push(`global.enforcement must be one of strict|advisory|disabled (got ${config.global.enforcement})`);
    }

    // Categories
    if (config.categories && typeof config.categories === 'object') {
      Object.entries(config.categories).forEach(([cat, settings]: [string, any]) => {
        if (!['security','compliance','performance','cost','operations'].includes(cat)) {
          warnings.push(`Unknown category '${cat}' will be ignored`);
        }
        if (settings && settings.enforcement && !['strict','advisory','disabled'].includes(settings.enforcement)) {
          errors.push(`categories.${cat}.enforcement invalid (${settings.enforcement})`);
        }
      });
    }

    // Rule overrides
    if (config.ruleOverrides && typeof config.ruleOverrides === 'object') {
      Object.keys(config.ruleOverrides).forEach(ruleId => {
        const rule = this.rules.get(ruleId);
        if (!rule) warnings.push(`Rule override references unknown rule '${ruleId}'`);
      });
    }

    // Custom rules basic validation
    if (Array.isArray(config.customRules)) {
      config.customRules.forEach((r: any, idx: number) => {
        if (!r.id) errors.push(`customRules[${idx}].id is required`);
        if (!r.category) errors.push(`customRules[${idx}].category is required`);
        if (r.category && !['security','compliance','performance','cost','operations'].includes(r.category)) {
          errors.push(`customRules[${idx}].category '${r.category}' is invalid`);
        }
        if (!Array.isArray(r.conditions) || r.conditions.length === 0) {
          errors.push(`customRules[${idx}].conditions must be a non-empty array`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length ? errors : undefined,
      warnings: warnings.length ? warnings : undefined
    };
  }

  /**
   * Load configuration from external file
   */
  private loadConfiguration(configPath: string): void {
    try {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        this.config = JSON.parse(configData) as PolicyConfiguration;
        console.error(`✅ Loaded policy configuration from: ${configPath}`);
      } else {
        console.error(`⚠️ Policy configuration file not found: ${configPath}`);
      }
    } catch (error) {
      console.error(`❌ Error loading policy configuration: ${error}`);
    }
  }

  /**
   * Apply configuration settings to policies
   */
  private applyConfiguration(): void {
    if (!this.config) return;

    // Apply rule overrides
    if (this.config.ruleOverrides) {
      Object.entries(this.config.ruleOverrides).forEach(([ruleId, override]) => {
        const rule = this.rules.get(ruleId);
        if (rule) {
          if (override.enabled !== undefined) {
            rule.enabled = override.enabled;
          }
          if (override.severity) {
            rule.severity = override.severity;
          }
          // Note: enforcement level can be applied during evaluation
        }
      });
    }

    // Add custom rules
    if (this.config.customRules) {
      this.config.customRules.forEach(rule => {
        this.rules.set(rule.id, rule);
      });
    }

    // Apply global category settings
    if (this.config.categories) {
      Object.entries(this.config.categories).forEach(([category, settings]) => {
        const categoryRules = this.getRulesByCategory(category);
        categoryRules.forEach(rule => {
          if (!settings.enabled) {
            rule.enabled = false;
          }
          // Enforcement and autoFix are applied during evaluation
        });
      });
    }

    console.error(`🔧 Applied configuration for ${this.config.organization.name} (${this.config.organization.environment})`);
  }

  /**
   * Load default policy rules
   */
  private loadDefaultPolicies(): void {
    const defaultPolicies: PolicyRule[] = [
      // Security Policies
      {
        id: 'sec-001',
        name: 'Require Security Context',
        description: 'All containers must have a security context defined',
        severity: 'high',
        category: 'security',
        enabled: true,
        scope: 'deployment',
        conditions: [
          {
            field: 'spec.template.spec.containers[*].securityContext',
            operator: 'exists',
            value: true,
            description: 'Security context must be defined for all containers'
          }
        ],
        actions: [
          {
            type: 'warn',
            message: 'Container is missing security context. This is a security risk.',
            autoFix: true,
            fixAction: 'add_default_security_context'
          }
        ]
      },
      {
        id: 'sec-002',
        name: 'Prohibit Privileged Containers',
        description: 'Containers must not run in privileged mode',
        severity: 'critical',
        category: 'security',
        enabled: true,
        scope: 'deployment',
        conditions: [
          {
            field: 'spec.template.spec.containers[*].securityContext.privileged',
            operator: 'not_equals',
            value: true,
            description: 'Privileged containers are not allowed'
          }
        ],
        actions: [
          {
            type: 'deny',
            message: 'Privileged containers are prohibited for security reasons.',
            autoFix: true,
            fixAction: 'remove_privileged_flag'
          }
        ]
      },
      {
        id: 'sec-003',
        name: 'Require Non-Root User',
        description: 'Containers should not run as root user',
        severity: 'high',
        category: 'security',
        enabled: true,
        scope: 'deployment',
        conditions: [
          {
            field: 'spec.template.spec.containers[*].securityContext.runAsNonRoot',
            operator: 'equals',
            value: true,
            description: 'Containers must run as non-root user'
          }
        ],
        actions: [
          {
            type: 'warn',
            message: 'Container should run as non-root user for better security.',
            autoFix: true,
            fixAction: 'set_non_root_user'
          }
        ]
      },

      // Resource Management Policies
      {
        id: 'res-001',
        name: 'Require Resource Limits',
        description: 'All containers must have CPU and memory limits',
        severity: 'medium',
        category: 'performance',
        enabled: true,
        scope: 'deployment',
        conditions: [
          {
            field: 'spec.template.spec.containers[*].resources.limits.cpu',
            operator: 'exists',
            value: true,
            description: 'CPU limits must be defined'
          },
          {
            field: 'spec.template.spec.containers[*].resources.limits.memory',
            operator: 'exists',
            value: true,
            description: 'Memory limits must be defined'
          }
        ],
        actions: [
          {
            type: 'warn',
            message: 'Container is missing resource limits. This can lead to resource contention.',
            autoFix: true,
            fixAction: 'add_default_resource_limits'
          }
        ]
      },
      {
        id: 'res-002',
        name: 'Reasonable CPU Limits',
        description: 'CPU limits should be reasonable (not more than 2 cores for most workloads)',
        severity: 'medium',
        category: 'cost',
        enabled: true,
        scope: 'deployment',
        conditions: [
          {
            field: 'spec.template.spec.containers[*].resources.limits.cpu',
            operator: 'less_than',
            value: '2000m',
            description: 'CPU limits should typically be under 2 cores'
          }
        ],
        actions: [
          {
            type: 'warn',
            message: 'High CPU limits detected. Consider if this is necessary for cost optimization.'
          }
        ]
      },

      // Operational Policies
      {
        id: 'ops-001',
        name: 'Require Health Checks',
        description: 'Deployments should have readiness and liveness probes',
        severity: 'medium',
        category: 'operations',
        enabled: true,
        scope: 'deployment',
        conditions: [
          {
            field: 'spec.template.spec.containers[*].readinessProbe',
            operator: 'exists',
            value: true,
            description: 'Readiness probe should be defined'
          },
          {
            field: 'spec.template.spec.containers[*].livenessProbe',
            operator: 'exists',
            value: true,
            description: 'Liveness probe should be defined'
          }
        ],
        actions: [
          {
            type: 'warn',
            message: 'Missing health checks. This affects reliability and rolling updates.',
            autoFix: true,
            fixAction: 'add_default_health_checks'
          }
        ]
      },
      {
        id: 'ops-002',
        name: 'Require Labels',
        description: 'Deployments must have standard labels for observability',
        severity: 'low',
        category: 'operations',
        enabled: true,
        scope: 'deployment',
        conditions: [
          {
            field: 'metadata.labels.app',
            operator: 'exists',
            value: true,
            description: 'app label is required'
          },
          {
            field: 'metadata.labels.version',
            operator: 'exists',
            value: true,
            description: 'version label is required'
          },
          {
            field: 'metadata.labels.component',
            operator: 'exists',
            value: true,
            description: 'component label is required'
          }
        ],
        actions: [
          {
            type: 'warn',
            message: 'Missing required labels for proper resource management and observability.'
          }
        ]
      },

      // Compliance Policies
      {
        id: 'comp-001',
        name: 'Image Registry Compliance',
        description: 'Images must come from approved registries',
        severity: 'high',
        category: 'compliance',
        enabled: true,
        scope: 'deployment',
        conditions: [
          {
            field: 'spec.template.spec.containers[*].image',
            operator: 'regex_match',
            value: '^(ghcr\\.io|registry\\.company\\.com|docker\\.io/library)',
            description: 'Images must come from approved registries'
          }
        ],
        actions: [
          {
            type: 'deny',
            message: 'Image must come from an approved registry for security and compliance.'
          }
        ]
      },
      {
        id: 'comp-002',
        name: 'Prohibit Latest Tag',
        description: 'Images should not use latest tag for reproducibility',
        severity: 'medium',
        category: 'compliance',
        enabled: true,
        scope: 'deployment',
        conditions: [
          {
            field: 'spec.template.spec.containers[*].image',
            operator: 'not_contains',
            value: ':latest',
            description: 'latest tag should not be used'
          }
        ],
        actions: [
          {
            type: 'warn',
            message: 'Using latest tag reduces reproducibility. Use specific version tags instead.'
          }
        ]
      }
    ];

    defaultPolicies.forEach(policy => {
      this.rules.set(policy.id, policy);
    });
  }

  /**
   * Add or update a policy rule
   */
  addRule(rule: PolicyRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a policy rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Get all policy rules
   */
  getRules(): PolicyRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get policy rules by category
   */
  getRulesByCategory(category: string): PolicyRule[] {
    return this.getRules().filter(rule => rule.category === category);
  }

  /**
   * Enable/disable a policy rule
   */
  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Evaluate policies against a deployment
   */
  async evaluateDeployment(namespace: string, deploymentName: string): Promise<PolicyEvaluationResult> {
    try {
      const deploymentResponse = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
      const deployment = deploymentResponse.body;

      return this.evaluateResource(deployment, 'deployment');
    } catch (error) {
      throw new Error(`Failed to evaluate deployment: ${error}`);
    }
  }

  /**
   * Evaluate policies against a Kubernetes resource
   */
  evaluateResource(resource: any, resourceType: string): PolicyEvaluationResult {
    const violations: PolicyViolation[] = [];
    const warnings: PolicyViolation[] = [];
    const enabledRules = this.getRules().filter(rule => rule.enabled && rule.scope === resourceType);

    for (const rule of enabledRules) {
      const ruleViolations = this.evaluateRule(rule, resource);
      
      for (const violation of ruleViolations) {
        if (rule.actions.some(action => action.type === 'deny')) {
          violations.push(violation);
        } else {
          warnings.push(violation);
        }
      }
    }

    const totalRules = enabledRules.length;
    const failedRules = new Set([...violations, ...warnings].map(v => v.ruleId)).size;
    const passedRules = totalRules - failedRules;

    const violationsBySeverity = this.groupBy([...violations, ...warnings], 'severity');
    const violationsByCategory = this.groupBy([...violations, ...warnings], 'category');

    return {
      passed: violations.length === 0,
      violations,
      warnings,
      summary: {
        totalRules,
        passedRules,
        failedRules,
        violationsBySeverity,
        violationsByCategory
      }
    };
  }

  /**
   * Evaluate a single policy rule against a resource
   */
  private evaluateRule(rule: PolicyRule, resource: any): PolicyViolation[] {
    const violations: PolicyViolation[] = [];

    for (const condition of rule.conditions) {
      const result = this.evaluateCondition(condition, resource);
      
      if (!result.passed) {
        const canAutoFix = rule.actions.some(action => action.autoFix === true);
        
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          category: rule.category,
          resource: {
            kind: resource.kind || 'Deployment',
            name: resource.metadata?.name || 'Unknown',
            namespace: resource.metadata?.namespace
          },
          message: rule.actions[0]?.message || rule.description,
          field: condition.field,
          currentValue: result.currentValue,
          suggestedValue: result.suggestedValue,
          canAutoFix,
          timestamp: new Date().toISOString(),
          metadata: rule.metadata
        });
      }
    }

    return violations;
  }

  /**
   * Evaluate a single condition against a resource
   */
  private evaluateCondition(condition: PolicyCondition, resource: any): {
    passed: boolean;
    currentValue?: any;
    suggestedValue?: any;
  } {
    const fieldValue = this.getFieldValue(resource, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return { 
          passed: fieldValue === condition.value,
          currentValue: fieldValue,
          suggestedValue: condition.value
        };
      
      case 'not_equals':
        return { 
          passed: fieldValue !== condition.value,
          currentValue: fieldValue
        };
      
      case 'contains':
        return { 
          passed: String(fieldValue).includes(String(condition.value)),
          currentValue: fieldValue
        };
      
      case 'not_contains':
        return { 
          passed: !String(fieldValue).includes(String(condition.value)),
          currentValue: fieldValue
        };
      
      case 'greater_than':
        return { 
          passed: this.parseResourceValue(fieldValue) > this.parseResourceValue(condition.value),
          currentValue: fieldValue,
          suggestedValue: condition.value
        };
      
      case 'less_than':
        return { 
          passed: this.parseResourceValue(fieldValue) < this.parseResourceValue(condition.value),
          currentValue: fieldValue,
          suggestedValue: condition.value
        };
      
      case 'regex_match':
        {
          const regex = new RegExp(condition.value);
          return { 
            passed: regex.test(String(fieldValue)),
            currentValue: fieldValue
          };
        }
      
      case 'exists':
        return { 
          passed: fieldValue !== undefined && fieldValue !== null,
          currentValue: fieldValue
        };
      
      case 'not_exists':
        return { 
          passed: fieldValue === undefined || fieldValue === null,
          currentValue: fieldValue
        };
      
      default:
        return { passed: false, currentValue: fieldValue };
    }
  }

  /**
   * Get field value from resource using dot notation or array notation
   */
  private getFieldValue(obj: any, field: string): any {
    // Handle array notation like containers[*]
    if (field.includes('[*]')) {
      const parts = field.split('[*]');
      const arrayPath = parts[0];
      const remainingPath = parts[1];
      
      const arrayValue = this.getNestedValue(obj, arrayPath);
      if (Array.isArray(arrayValue)) {
        // Check if any array element has the remaining field
        return arrayValue.some(item => {
          const itemValue = remainingPath ? this.getNestedValue(item, remainingPath.substring(1)) : item;
          return itemValue !== undefined && itemValue !== null;
        });
      }
      return false;
    }
    
    return this.getNestedValue(obj, field);
  }

  /**
   * Get nested value using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Parse resource values (CPU, memory) for comparison
   */
  private parseResourceValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;

    // Handle CPU values (m suffix for millicores)
    if (value.endsWith('m')) {
      return parseInt(value.slice(0, -1));
    }

    // Handle memory values (Ki, Mi, Gi suffixes)
    if (value.endsWith('Ki')) {
      return parseInt(value.slice(0, -2)) * 1024;
    }
    if (value.endsWith('Mi')) {
      return parseInt(value.slice(0, -2)) * 1024 * 1024;
    }
    if (value.endsWith('Gi')) {
      return parseInt(value.slice(0, -2)) * 1024 * 1024 * 1024;
    }

    // Default to parsing as number
    return parseFloat(value) || 0;
  }

  /**
   * Group array items by a property
   */
  private groupBy(items: any[], property: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[property] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Generate compliance report for namespace or cluster
   */
  async generateComplianceReport(namespace?: string): Promise<ComplianceReport> {
    try {
      let deployments: any[] = [];
      
      if (namespace) {
        const response = await this.k8sApi.listNamespacedDeployment(namespace);
        deployments = response.body.items;
      } else {
        const response = await this.k8sApi.listDeploymentForAllNamespaces();
        deployments = response.body.items;
      }

      const allResults: PolicyEvaluationResult[] = [];
      
      for (const deployment of deployments) {
        const result = this.evaluateResource(deployment, 'deployment');
        allResults.push(result);
      }

      // Aggregate results
      const aggregatedResult: PolicyEvaluationResult = {
        passed: allResults.every(r => r.passed),
        violations: allResults.flatMap(r => r.violations),
        warnings: allResults.flatMap(r => r.warnings),
        summary: {
          totalRules: allResults.reduce((sum, r) => sum + r.summary.totalRules, 0),
          passedRules: allResults.reduce((sum, r) => sum + r.summary.passedRules, 0),
          failedRules: allResults.reduce((sum, r) => sum + r.summary.failedRules, 0),
          violationsBySeverity: this.mergeGroups(allResults.map(r => r.summary.violationsBySeverity)),
          violationsByCategory: this.mergeGroups(allResults.map(r => r.summary.violationsByCategory))
        }
      };

      const totalChecks = aggregatedResult.summary.totalRules;
      const passedChecks = aggregatedResult.summary.passedRules;
      const overallCompliance = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

      const recommendations = this.generateRecommendations(aggregatedResult);

      return {
        timestamp: new Date().toISOString(),
        cluster: this.kc.getCurrentCluster()?.name || 'Unknown',
        namespace,
        overallCompliance: Math.round(overallCompliance * 100) / 100,
        results: aggregatedResult,
        recommendations
      };
    } catch (error) {
      throw new Error(`Failed to generate compliance report: ${error}`);
    }
  }

  /**
   * Merge multiple grouped objects
   */
  private mergeGroups(groups: Record<string, number>[]): Record<string, number> {
    return groups.reduce((merged, group) => {
      Object.entries(group).forEach(([key, value]) => {
        merged[key] = (merged[key] || 0) + value;
      });
      return merged;
    }, {});
  }

  /**
   * Generate recommendations based on violations
   */
  private generateRecommendations(result: PolicyEvaluationResult): string[] {
    const recommendations: string[] = [];
    const { violations, warnings } = result;

    // Security recommendations
    const securityViolations = [...violations, ...warnings].filter(v => v.category === 'security');
    if (securityViolations.length > 0) {
      recommendations.push('🔒 Security: Review and implement security contexts, avoid privileged containers, and ensure non-root execution.');
    }

    // Resource management recommendations
    const resourceViolations = [...violations, ...warnings].filter(v => v.category === 'performance');
    if (resourceViolations.length > 0) {
      recommendations.push('📊 Resources: Define appropriate resource limits and requests for better cluster resource management.');
    }

    // Operational recommendations
    const opsViolations = [...violations, ...warnings].filter(v => v.category === 'operations');
    if (opsViolations.length > 0) {
      recommendations.push('⚙️ Operations: Add health checks and proper labeling for improved observability and reliability.');
    }

    // Compliance recommendations
    const complianceViolations = [...violations, ...warnings].filter(v => v.category === 'compliance');
    if (complianceViolations.length > 0) {
      recommendations.push('📋 Compliance: Use approved image registries and avoid latest tags for better governance.');
    }

    // Auto-fix recommendations
    const autoFixableViolations = [...violations, ...warnings].filter(v => v.canAutoFix);
    if (autoFixableViolations.length > 0) {
      recommendations.push(`🔧 Auto-fix: ${autoFixableViolations.length} violations can be automatically fixed. Consider using the auto-remediation feature.`);
    }

    return recommendations;
  }

  /**
   * Auto-fix violations where possible
   */
  async autoFixViolations(namespace: string, deploymentName: string, violations: PolicyViolation[]): Promise<{
    fixed: number;
    failed: number;
    errors: string[];
  }> {
    let fixed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      const deploymentResponse = await this.k8sApi.readNamespacedDeployment(deploymentName, namespace);
      const deployment = deploymentResponse.body;
      let modified = false;

      for (const violation of violations) {
        if (!violation.canAutoFix) continue;

        try {
          const rule = this.rules.get(violation.ruleId);
          if (!rule) continue;

          const fixAction = rule.actions.find(a => a.autoFix)?.fixAction;
          if (!fixAction) continue;

          const wasFixed = this.applyAutoFix(deployment, fixAction, violation);
          if (wasFixed) {
            fixed++;
            modified = true;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          errors.push(`Failed to fix violation ${violation.ruleId}: ${error}`);
        }
      }

      if (modified) {
        await this.k8sApi.replaceNamespacedDeployment(deploymentName, namespace, deployment);
      }

      return { fixed, failed, errors };
    } catch (error) {
      throw new Error(`Failed to auto-fix violations: ${error}`);
    }
  }

  /**
   * Apply specific auto-fix action
   */
  private applyAutoFix(deployment: any, fixAction: string, violation: PolicyViolation): boolean {
    switch (fixAction) {
      case 'add_default_security_context':
        return this.addDefaultSecurityContext(deployment);
      
      case 'remove_privileged_flag':
        return this.removePrivilegedFlag(deployment);
      
      case 'set_non_root_user':
        return this.setNonRootUser(deployment);
      
      case 'add_default_resource_limits':
        return this.addDefaultResourceLimits(deployment);
      
      case 'add_default_health_checks':
        return this.addDefaultHealthChecks(deployment);
      
      default:
        return false;
    }
  }

  private addDefaultSecurityContext(deployment: any): boolean {
    const containers = deployment.spec?.template?.spec?.containers || [];
    let modified = false;

    for (const container of containers) {
      if (!container.securityContext) {
        container.securityContext = {
          allowPrivilegeEscalation: false,
          runAsNonRoot: true,
          readOnlyRootFilesystem: true,
          capabilities: {
            drop: ['ALL']
          }
        };
        modified = true;
      }
    }

    return modified;
  }

  private removePrivilegedFlag(deployment: any): boolean {
    const containers = deployment.spec?.template?.spec?.containers || [];
    let modified = false;

    for (const container of containers) {
      if (container.securityContext?.privileged) {
        delete container.securityContext.privileged;
        modified = true;
      }
    }

    return modified;
  }

  private setNonRootUser(deployment: any): boolean {
    const containers = deployment.spec?.template?.spec?.containers || [];
    let modified = false;

    for (const container of containers) {
      if (!container.securityContext) {
        container.securityContext = {};
      }
      
      if (!container.securityContext.runAsNonRoot) {
        container.securityContext.runAsNonRoot = true;
        container.securityContext.runAsUser = 65534; // nobody user
        modified = true;
      }
    }

    return modified;
  }

  private addDefaultResourceLimits(deployment: any): boolean {
    const containers = deployment.spec?.template?.spec?.containers || [];
    let modified = false;

    for (const container of containers) {
      if (!container.resources) {
        container.resources = {};
      }
      
      if (!container.resources.limits) {
        container.resources.limits = {
          cpu: '500m',
          memory: '512Mi'
        };
        modified = true;
      }
      
      if (!container.resources.requests) {
        container.resources.requests = {
          cpu: '100m',
          memory: '128Mi'
        };
        modified = true;
      }
    }

    return modified;
  }

  private addDefaultHealthChecks(deployment: any): boolean {
    const containers = deployment.spec?.template?.spec?.containers || [];
    let modified = false;

    for (const container of containers) {
      if (!container.livenessProbe) {
        container.livenessProbe = {
          httpGet: {
            path: '/health',
            port: 8080
          },
          initialDelaySeconds: 30,
          periodSeconds: 10
        };
        modified = true;
      }
      
      if (!container.readinessProbe) {
        container.readinessProbe = {
          httpGet: {
            path: '/ready',
            port: 8080
          },
          initialDelaySeconds: 5,
          periodSeconds: 5
        };
        modified = true;
      }
    }

    return modified;
  }
}
