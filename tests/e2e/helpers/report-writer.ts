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

export interface ApiRequestEntry {
  app: string;
  page: string;
  method: string;
  url: string;
  status: number | null;
  responseTimeMs: number;
  requestPayloadShape?: string;
  errorBody?: string;
  timestamp: string;
}

export interface ConsoleErrorEntry {
  app: string;
  page: string;
  error: string;
  severity: 'error' | 'warning' | 'pageerror';
  timestamp: string;
}

export interface RouteAuditEntry {
  app: string;
  url: string;
  title: string;
  header: string;
  httpStatus: number | null;
  consoleErrors: string[];
  failedApiRequests: string[];
  uiBackButtonExists: boolean;
  browserBackWorks: boolean;
  routeGetsStuck: boolean;
  loadingSkeletonNeverResolves: boolean;
  emptyStateWithoutExplanation: boolean;
  timestamp: string;
}

export interface AppResultEntry {
  app: string;
  status: 'PASS' | 'FAIL';
  notes: string[];
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
  appResults: AppResultEntry[];
  apiRequests: ApiRequestEntry[];
  routeAudits: RouteAuditEntry[];
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
    return normalizeRunState(JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<QaRunState>);
  }
  const initial: QaRunState = {
    startedAt: new Date().toISOString(),
    issues: [],
    appResults: [],
    apiRequests: [],
    routeAudits: [],
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

function normalizeRunState(state: Partial<QaRunState>): QaRunState {
  return {
    startedAt: state.startedAt ?? new Date().toISOString(),
    finishedAt: state.finishedAt,
    issues: state.issues ?? [],
    appResults: state.appResults ?? [],
    apiRequests: state.apiRequests ?? [],
    routeAudits: state.routeAudits ?? [],
    networkErrors: state.networkErrors ?? [],
    consoleErrors: state.consoleErrors ?? [],
    brokenNavigation: state.brokenNavigation ?? [],
    rbacResults: state.rbacResults ?? [],
    manualVerification: state.manualVerification ?? [],
    findings: state.findings ?? { checkout: [], merchant: [], admin: [] },
  };
}

export function saveRunState(state: QaRunState): void {
  ensureReportsDir();
  fs.writeFileSync(statePath(), JSON.stringify(state, null, 2));
}

export function appendToRunState(patch: Partial<QaRunState>): void {
  const state = loadRunState();
  if (patch.issues) state.issues.push(...patch.issues);
  if (patch.appResults) state.appResults.push(...patch.appResults);
  if (patch.apiRequests) state.apiRequests.push(...patch.apiRequests);
  if (patch.routeAudits) state.routeAudits.push(...patch.routeAudits);
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
  state.finishedAt = new Date().toISOString();
  saveRunState(state);
  const dir = reportsDir();
  fs.writeFileSync(path.join(dir, 'playwright-production-audit.json'), JSON.stringify(state, null, 2));
  fs.writeFileSync(path.join(dir, 'playwright-production-audit.md'), renderMarkdownReport(state));
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

function renderMarkdownReport(state: QaRunState): string {
  const lines: string[] = [
    '# JebDekho Playwright Production Audit',
    '',
    `Started: ${state.startedAt}`,
    `Finished: ${state.finishedAt ?? new Date().toISOString()}`,
    '',
    '## App Results',
    '',
  ];

  if (state.appResults.length === 0) {
    lines.push('- No app result entries recorded.');
  } else {
    for (const result of state.appResults) {
      lines.push(`- ${result.app}: ${result.status}${result.notes.length ? ` - ${result.notes.join('; ')}` : ''}`);
    }
  }

  lines.push('', '## High Priority Issues', '');
  const priority = state.issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'high');
  if (priority.length === 0) {
    lines.push('- None recorded.');
  } else {
    for (const issue of priority) {
      lines.push(`- [${issue.severity}] ${issue.app} ${issue.title} (${issue.url})`);
      lines.push(`  - Repro: ${issue.steps}`);
      lines.push(`  - Actual: ${issue.actual}`);
    }
  }

  lines.push('', '## Failed API Endpoints', '');
  if (state.networkErrors.length === 0) {
    lines.push('- None recorded.');
  } else {
    for (const entry of state.networkErrors.slice(0, 100)) {
      lines.push(`- ${entry.app} ${entry.method} ${entry.endpoint} -> ${entry.status}: ${entry.error}`);
    }
  }

  lines.push('', '## Console And Page Errors', '');
  if (state.consoleErrors.length === 0) {
    lines.push('- None recorded.');
  } else {
    for (const entry of state.consoleErrors.slice(0, 100)) {
      lines.push(`- ${entry.app} ${entry.severity} on ${entry.page}: ${entry.error}`);
    }
  }

  lines.push('', '## Missing Back Buttons', '');
  const missingBack = state.routeAudits.filter((route) => !route.uiBackButtonExists && route.url.split('/').filter(Boolean).length > 3);
  if (missingBack.length === 0) {
    lines.push('- None recorded.');
  } else {
    for (const route of missingBack.slice(0, 100)) {
      lines.push(`- ${route.app}: ${route.url}`);
    }
  }

  lines.push('', '## Broken Navigation', '');
  if (state.brokenNavigation.length === 0) {
    lines.push('- None recorded.');
  } else {
    for (const nav of state.brokenNavigation.slice(0, 100)) {
      lines.push(`- ${nav.app}: ${nav.clickedItem} from ${nav.sourcePage} -> ${nav.result}`);
    }
  }

  return `${lines.join('\n')}\n`;
}
