import * as fs from 'fs';
import * as path from 'path';

export type QaSeverity = 'P0' | 'P1' | 'P2';

export interface QaIssue {
  severity: QaSeverity;
  app: string;
  url: string;
  title: string;
  message: string;
  steps: string[];
  selector?: string;
  screenshotPath?: string;
  network?: { method?: string; url: string; status?: number; error?: string };
  timestamp: string;
}

export interface PageVisit {
  app: string;
  url: string;
  title: string;
  status: number | null;
  timestamp: string;
}

export interface SkippedAction {
  app: string;
  url: string;
  label: string;
  selector?: string;
  reason: string;
  timestamp: string;
}

export interface NetworkFailure {
  app: string;
  pageUrl: string;
  method: string;
  url: string;
  status?: number;
  error?: string;
  timestamp: string;
}

export interface QaAppInfo {
  name: string;
  label: string;
  url: string;
  maxPages: number;
  loginSupported: boolean;
}

export interface QaReportState {
  generatedAt: string;
  apps: QaAppInfo[];
  pagesVisited: PageVisit[];
  issues: QaIssue[];
  networkFailures: NetworkFailure[];
  skippedActions: SkippedAction[];
}

const reportDir = path.resolve(process.cwd(), 'qa-reports');
const seenIssues = new Set<string>();

export function createState(apps: QaAppInfo[]): QaReportState {
  return { generatedAt: new Date().toISOString(), apps, pagesVisited: [], issues: [], networkFailures: [], skippedActions: [] };
}

export function ensureQaDirs(): void {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.mkdirSync(path.join(reportDir, 'screenshots'), { recursive: true });
  fs.mkdirSync(path.join(reportDir, 'storage'), { recursive: true });
}

export function sanitizeFileName(value: string): string {
  return value.replace(/^https?:\/\//, '').replace(/[^a-z0-9.-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 150) || 'page';
}

export function addIssue(state: QaReportState, issue: Omit<QaIssue, 'timestamp'>): void {
  const key = [issue.severity, issue.app, issue.url.replace(/[#?].*$/, ''), issue.title, issue.selector, issue.network?.url].join('|');
  if (seenIssues.has(key)) return;
  seenIssues.add(key);
  state.issues.push({ ...issue, timestamp: new Date().toISOString() });
}

export function addNetworkFailure(state: QaReportState, failure: Omit<NetworkFailure, 'timestamp'>): void {
  state.networkFailures.push({ ...failure, timestamp: new Date().toISOString() });
}

export function addSkippedAction(state: QaReportState, skipped: Omit<SkippedAction, 'timestamp'>): void {
  state.skippedActions.push({ ...skipped, timestamp: new Date().toISOString() });
}

export function addPageVisit(state: QaReportState, visit: Omit<PageVisit, 'timestamp'>): void {
  state.pagesVisited.push({ ...visit, timestamp: new Date().toISOString() });
}

export function writeQaReports(state: QaReportState): void {
  ensureQaDirs();
  state.generatedAt = new Date().toISOString();
  const summary = buildSummary(state);
  const json = { summary, pagesVisited: state.pagesVisited, issues: state.issues, networkFailures: state.networkFailures, skippedActions: state.skippedActions, apps: state.apps };
  fs.writeFileSync(path.join(reportDir, 'qa-report.json'), JSON.stringify(json, null, 2));
  fs.writeFileSync(path.join(reportDir, 'qa-report.md'), renderMarkdown(state, summary));
}

function buildSummary(state: QaReportState) {
  const counts = { P0: 0, P1: 0, P2: 0 };
  for (const issue of state.issues) counts[issue.severity] += 1;
  return {
    generatedAt: state.generatedAt,
    totalPagesVisited: state.pagesVisited.length,
    totalIssues: state.issues.length,
    severity: counts,
    failedApiResponses: state.networkFailures.filter((f) => (f.status ?? 0) >= 400).length,
    skippedDestructiveActions: state.skippedActions.length,
  };
}

function renderMarkdown(state: QaReportState, summary: ReturnType<typeof buildSummary>): string {
  const lines: string[] = [
    '# JebDekho Production QA Report',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Target apps: ${state.apps.map((app) => `${app.label} (${app.url})`).join(', ')}`,
    `- Total pages visited: ${summary.totalPagesVisited}`,
    `- Total issues: ${summary.totalIssues}`,
    `- P0: ${summary.severity.P0}`,
    `- P1: ${summary.severity.P1}`,
    `- P2: ${summary.severity.P2}`,
    '',
    '## Issues by Severity',
  ];

  for (const severity of ['P0', 'P1', 'P2'] as const) {
    lines.push('', `### ${severity}`);
    const issues = state.issues.filter((issue) => issue.severity === severity);
    if (!issues.length) lines.push('- None');
    for (const issue of issues) pushIssue(lines, issue);
  }

  lines.push('', '## Issues by App');
  for (const app of state.apps) {
    lines.push('', `### ${app.label}`);
    const issues = state.issues.filter((issue) => issue.app === app.name);
    if (!issues.length) lines.push('- None');
    for (const issue of issues) lines.push(`- [${issue.severity}] ${issue.title} - ${issue.url}`);
  }

  lines.push('', '## Skipped Destructive Actions');
  if (!state.skippedActions.length) lines.push('- None');
  for (const skipped of state.skippedActions) {
    lines.push(`- ${skipped.app} ${skipped.label} at ${skipped.url}: ${skipped.reason}`);
  }

  lines.push('', '## Failed API Responses');
  const failed = state.networkFailures.filter((failure) => (failure.status ?? 0) >= 400 || failure.error);
  if (!failed.length) lines.push('- None');
  for (const failure of failed) lines.push(`- ${failure.app} ${failure.method} ${failure.url} ${failure.status ?? ''} ${failure.error ?? ''}`.trim());

  lines.push(
    '',
    '## Recommendations',
    '',
    '- Fix P0 JavaScript exceptions, 500 responses, and unavailable API checks before release.',
    '- Review P1 auth, 404, placeholder, disconnected route, and console error findings with product owners.',
    '- Use P2 accessibility, image, metadata, and no-op button findings as regression hardening work.',
    '- Re-run this suite with fresh role-specific test accounts before production deployments.',
  );
  return `${lines.join('\n')}\n`;
}

function pushIssue(lines: string[], issue: QaIssue): void {
  lines.push(`- **${issue.app}** ${issue.title}: ${issue.message}`);
  lines.push(`  - URL: ${issue.url}`);
  if (issue.selector) lines.push(`  - Selector: \`${issue.selector}\``);
  if (issue.screenshotPath) lines.push(`  - Screenshot: ${issue.screenshotPath}`);
  if (issue.network) lines.push(`  - Network: ${issue.network.method ?? 'GET'} ${issue.network.url} ${issue.network.status ?? ''}`);
  lines.push(`  - Reproduction: ${issue.steps.join(' -> ')}`);
}
