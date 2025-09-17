/**
 * Simple natural language intent parser for MCP server.
 * Lightweight (regex + heuristics) to avoid model round-trips.
 *
 * Responsibilities:
 *  - Classify user utterance into a known intent
 *  - Extract minimal parameters (namespace, deployment, image, replicas, flag, etc.)
 *  - Return structured object suitable for invoking existing MCP tools
 */

// Primitive value types we expect to extract from utterances
type ParamValue = string | number | boolean | undefined;
type Params = Record<string, ParamValue>;

export interface ParsedIntent<P extends Params = Params> {
  intent: string;              // canonical tool name or meta action
  confidence: number;          // 0..1 heuristic
  params: P;                   // extracted parameters
  missing?: string[];          // required params not found
  notes?: string;              // explanation for the mapping
  alternatives?: string[];     // suggested alternative intents when ambiguous
}

interface IntentPattern<P extends Params = Params> {
  name: string;
  tool: string; // underlying tool name
  description: string;
  required?: string[]; // required param keys
  regexes: RegExp[];   // matching patterns
  paramExtractors?: ((utterance: string) => Partial<P>)[];
  confidenceBoost?: number;
}

// Basic helpers
const toNumber = (s: string | undefined) => {
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return isNaN(n) ? undefined : n;
};

// Patterns definition
const patterns: IntentPattern[] = [
  {
    name: 'get_cluster_info',
    tool: 'get_cluster_info',
    description: 'Cluster status / info',
    regexes: [/^(what'?s|show|get).*(cluster|k8s).*info/i]
  },
  {
    name: 'list_namespaces',
    tool: 'list_namespaces',
    description: 'List namespaces',
    regexes: [/list namespaces/i, /(show|what).*(namespaces)/i]
  },
  {
    name: 'list_deployments',
    tool: 'list_deployments',
    description: 'List deployments',
    regexes: [/list (all )?deployments/i, /(show|what).*(deployments)/i],
    paramExtractors: [utter => {
      const nsMatch = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i);
      return nsMatch ? { namespace: nsMatch[2] } : {};
    }]
  },
  {
    name: 'get_deployment_status',
    tool: 'get_deployment_status',
    description: 'Deployment status',
    required: ['namespace', 'deployment'],
    regexes: [/(status|health|state).*(deployment)/i, /how.*(deployment).*(doing|health)/i],
    paramExtractors: [utter => {
      const dep = utter.match(/deployment ([a-z0-9-]+)/i)?.[1];
      const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
      return { deployment: dep, namespace: ns };
    }]
  },
  {
    name: 'scale_deployment',
    tool: 'scale_deployment',
    description: 'Scale a deployment',
    required: ['namespace', 'deployment', 'replicas'],
    regexes: [/(scale|set).*(deployment)/i, /(increase|decrease).*(replicas)/i],
    paramExtractors: [utter => {
      const dep = utter.match(/deployment ([a-z0-9-]+)/i)?.[1];
      const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
      const reps = toNumber(utter.match(/to (\d{1,3}) ?replica/i)?.[1] || utter.match(/to (\d{1,3})$/)?.[1]);
      return { deployment: dep, namespace: ns, replicas: reps };
    }]
  },
  {
    name: 'deploy_version',
    tool: 'deploy_version',
    description: 'Deploy image version',
    required: ['namespace', 'deployment', 'image'],
    regexes: [/deploy (version|image)/i, /(update|set).*(image)/i],
    paramExtractors: [utter => {
      const dep = utter.match(/deployment ([a-z0-9-]+)/i)?.[1];
      const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
      const image = utter.match(/image ([\w./:-]+:[\w.-]+)/i)?.[1] || utter.match(/to ([\w./:-]+:[\w.-]+)/i)?.[1];
      return { deployment: dep, namespace: ns, image };
    }]
  },
  {
    name: 'rollback_deployment',
    tool: 'rollback_deployment',
    description: 'Rollback deployment',
    required: ['namespace', 'deployment'],
    regexes: [/rollback.*deployment/i, /revert.*deployment/i],
    paramExtractors: [utter => {
      const dep = utter.match(/deployment ([a-z0-9-]+)/i)?.[1];
      const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
      const revision = toNumber(utter.match(/revision (\d{1,4})/i)?.[1]);
      return { deployment: dep, namespace: ns, revision };
    }]
  },
  {
    name: 'toggle_feature_flag',
    tool: 'toggle_feature_flag',
    description: 'Toggle feature flag',
    required: ['namespace', 'deployment', 'flagName', 'enabled'],
    regexes: [/(enable|disable|turn (on|off)).*(feature|flag)/i],
    paramExtractors: [utter => {
      const dep = utter.match(/deployment ([a-z0-9-]+)/i)?.[1];
      const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
      const flag = utter.match(/flag ([A-Z0-9_]+)/i)?.[1] || utter.match(/feature ([A-Z0-9_]+)/i)?.[1];
      const enable = /enable|turn on/i.test(utter) ? true : /disable|turn off/i.test(utter) ? false : undefined;
      return { deployment: dep, namespace: ns, flagName: flag, enabled: enable };
    }]
  },
  {
    name: 'get_pod_logs',
    tool: 'get_pod_logs',
    description: 'Fetch logs',
    required: ['namespace', 'deployment'],
    regexes: [/(logs|log).*(deployment|pods?)/i],
    paramExtractors: [utter => {
      const dep = utter.match(/deployment ([a-z0-9-]+)/i)?.[1];
      const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
      const lines = toNumber(utter.match(/last (\d{1,4}) lines?/i)?.[1]);
      return { deployment: dep, namespace: ns, lines };
    }]
  },
  {
    name: 'evaluate_deployment_policies',
    tool: 'evaluate_deployment_policies',
    description: 'Policy evaluation',
    required: ['namespace', 'deployment'],
    regexes: [/evaluate.*polic/i, /(policy|policies).*(check|evaluate)/i],
    paramExtractors: [utter => {
      const dep = utter.match(/deployment ([a-z0-9-]+)/i)?.[1];
      const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
      return { deployment: dep, namespace: ns };
    }]
  },
  {
    name: 'generate_compliance_report',
    tool: 'generate_compliance_report',
    description: 'Compliance report',
    regexes: [/(generate|create).*(compliance) report/i, /compliance.*report/i],
    paramExtractors: [utter => {
      const ns = utter.match(/namespace ([a-z0-9-]+)/i)?.[1];
      return { namespace: ns };
    }]
  },
  {
    name: 'auto_fix_policy_violations',
    tool: 'auto_fix_policy_violations',
    description: 'Auto fix violations',
    required: ['namespace', 'deployment'],
    regexes: [/auto.*fix.*(violations|polic)/i, /(apply|run).*(auto[- ]?fix)/i],
    paramExtractors: [utter => {
      const dep = utter.match(/deployment ([a-z0-9-]+)/i)?.[1];
      const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
      const dryRun = /dry run/i.test(utter) ? true : undefined;
      return { deployment: dep, namespace: ns, dryRun };
    }]
  }
];

export function parseIntent(utterance: string): ParsedIntent {
  const cleaned = utterance.trim();
  const matches: ParsedIntent[] = [];

  for (const p of patterns) {
    if (p.regexes.some(r => r.test(cleaned))) {
      let params: Params = {};
      if (p.paramExtractors) {
        for (const ex of p.paramExtractors) {
          params = { ...params, ...ex(cleaned) };
        }
      }
      const missing = (p.required || []).filter(req => params[req] === undefined || params[req] === null || params[req] === '');
      const confidenceBase = 0.6 + (p.confidenceBoost || 0);
      const completeness = p.required && p.required.length > 0 ? ( ( (p.required.length - missing.length) / p.required.length ) * 0.4) : 0.2;
      matches.push({
        intent: p.tool,
        confidence: Math.min(1, confidenceBase + completeness),
        params,
        missing: missing.length ? missing : undefined,
        notes: p.description
      });
    }
  }

  if (matches.length === 0) {
    return {
      intent: 'unknown',
      confidence: 0,
      params: {},
      notes: 'No matching intent patterns',
      alternatives: ['list_tools', 'get_cluster_info']
    };
  }

  // Select highest confidence; if close, mark alternatives
  matches.sort((a, b) => b.confidence - a.confidence);
  const top = matches[0];
  const alt = matches.slice(1).filter(m => top.confidence - m.confidence < 0.15).map(m => m.intent);
  if (alt.length) top.alternatives = alt;
  return top;
}
