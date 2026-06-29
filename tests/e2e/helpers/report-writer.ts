import * as fs from 'fs';
import * as path from 'path';
import { qaConfig } from '../test-config';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface QaIssue {
  id: string;
  title: string;
  severity: IssueSeverity;
  app: string;
  url: string;
  role: string;
  steps: string;
  expected: string;
  actual: string;
  evidence?: string;
  screenshotPath?: string;
  tracePath?: string;
  suggestedFix?: string;
}

export interface NetworkErrorEntry {
  app: string;
  action: string;
  method: string;
  endpoint: string;
  status: number;
  error: string;
  uiBehavior?: string;
  timestamp: string;
}

export interface ConsoleErrorEntry {
  app: string;
  page: string;
  error: string;
  severity: 'error' | 'warning' | 'pageerror';
  timestamp: string;
}

export interface BrokenNavEntry {
  app: string;
  sourcePage: string;
  clickedItem: string;
  result: string;
  timestamp: string;
}

export interface RbacResultEntry {
  role: string;
  url: string;
  action: string;
  expected: string;
  actual: string;
  pass: boolean;
  timestamp: string;
}

export interface ManualVerificationEntry {
  area: string;
  reason: string;
  timestamp: string;
}

export interface QaRunState {
  startedAt: string;
  finishedAt?: string;
  issues: QaIssue[];
  networkErrors: NetworkErrorEntry[];
  consoleErrors: ConsoleErrorEntry[];
  brokenNavigation: BrokenNavEntry[];
  rbacResults: RbacResultEntry[];
  manualVerification: ManualVerificationEntry[];
  findings: Record<string, string[]>;
}

const STATE_FILE = 'qa-run-state.json';

function reportsDir(): string {
  return path.resolve(process.cwd(), qaConfig.qaReportsDir);
}

function statePath(): string {
  return path.join(reportsDir(), STATE_FILE);
}

export function ensureReportsDir(): void {
  fs.mkdirSync(reportsDir(), { recursive: true });
  fs.mkdirSync(path.join(reportsDir(), 'screenshots'), { recursive: true });
}

export function loadRunState(): QaRunState {
  ensureReportsDir();
  const file = statePath();
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as QaRunState;
  }
  const initial: QaRunState = {
    startedAt: new Date().toISOString(),
    issues: [],
    networkErrors: [],
    consoleErrors: [],
    brokenNavigation: [],
    rbacResults: [],
    manualVerification: [],
    findings: {
      checkout: [],
      merchant: [],
      admin: [],
    },
  };
  saveRunState(initial);
  return initial;
}

export function saveRunState(state: QaRunState): void {
  ensureReportsDir();
  fs.writeFileSync(statePath(), JSON.stringify(state, null, 2));
}

export function appendToRunState(patch: Partial<QaRunState>): void {
  const state = loadRunState();
  if (patch.issues) state.issues.push(...patch.issues);
  if (patch.networkErrors) state.networkErrors.push(...patch.networkErrors);
  if (patch.consoleErrors) state.consoleErrors.push(...patch.consoleErrors);
  if (patch.brokenNavigation) state.brokenNavigation.push(...patch.brokenNavigation);
  if (patch.rbacResults) state.rbacResults.push(...patch.rbacResults);
  if (patch.manualVerification) state.manualVerification.push(...patch.manualVerification);
  if (patch.findings) {
    for (const [key, values] of Object.entries(patch.findings)) {
      state.findings[key] = [...(state.findings[key] ?? []), ...values];
    }
  }
  saveRunState(state);
}

export function writeJsonArtifacts(): void {
  const state = loadRunState();
  const dir = reportsDir();
  fs.writeFileSync(path.join(dir, 'network-errors.json'), JSON.stringify(state.networkErrors, null, 2));
  fs.writeFileSync(path.join(dir, 'console-errors.json'), JSON.stringify(state.consoleErrors, null, 2));
  fs.writeFileSync(path.join(dir, 'issues.json'), JSON.stringify(state.issues, null, 2));
}

export function addIssue(issue: Omit<QaIssue, 'id'>): void {
  appendToRunState({
    issues: [{ ...issue, id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }],
  });
}

export function recordManualVerification(area: string, reason: string): void {
  appendToRunState({
    manualVerification: [{ area, reason, timestamp: new Date().toISOString() }],
  });
}

export function addFinding(bucket: 'checkout' | 'merchant' | 'admin', message: string): void {
  appendToRunState({ findings: { [bucket]: [message] } });
}
