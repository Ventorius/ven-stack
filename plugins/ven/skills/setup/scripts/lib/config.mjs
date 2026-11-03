import { homedir } from 'node:os';
import { join } from 'node:path';
import { readJson, writeJson } from './state.mjs';

// Model names are free text: each agent harness names its models differently. `inherit` means the
// harness default, which is the only value every harness understands.
export const CONFIG_DEFAULTS = { orchestrator_model: 'inherit', coder_model: 'inherit', swarm_model: 'inherit', budget_tier: 'standard' };
const BUDGET_TIERS = ['lean', 'standard', 'max'];

export function configPath() {
  return join(process.env.VEN_HOME ?? join(homedir(), '.ven'), 'config.json');
}

export function isConfigKey(key) {
  return Object.hasOwn(CONFIG_DEFAULTS, key);
}

// The repo profile may pin a budget tier for that repo; everything else is per user.
export function resolveConfig(profile) {
  const user = readJson(configPath(), {});
  const resolved = { ...CONFIG_DEFAULTS, ...user };
  if (profile?.budget_tier) resolved.budget_tier = profile.budget_tier;
  return resolved;
}

export function setConfig(key, value) {
  if (key === 'budget_tier' && !BUDGET_TIERS.includes(value)) throw new Error(`budget_tier must be one of ${BUDGET_TIERS.join(', ')}`);
  writeJson(configPath(), { ...readJson(configPath(), {}), [key]: value });
}
