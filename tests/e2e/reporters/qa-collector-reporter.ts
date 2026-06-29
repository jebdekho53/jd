import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { qaConfig } from '../test-config';
import {
  loadRunState,
  saveRunState,
  writeJsonArtifacts,
  type IssueSeverity,
  type QaIssue,
} from '../helpers/report-writer';

interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
}

function countBySeverity(issues: QaIssue[], severity: IssueSeverity): number {
  return issues.filter((i) => i.severity === severity).length;
}

function formatIssueSection(title: string, issues: QaIssue[]): string {
  if (issues.length === 0) return `## ${title}\n\nNone.\n`;
  return (
    `## ${title}\n\n` +
    issues
      .map(
        (i) =>
          `### ${i.title}\n` +
          `- **Severity:** ${i.severity}\n` +
          `- **App:** ${i.app}\n` +
          `- **URL:** ${i.url}\n` +
          `- **Role:** ${i.role}\n` +
          `- **Steps:** ${i.steps}\n` +
          `- **Expected:** ${i.expected}\n` +
          `- **Actual:** ${i.actual}\n` +
          (i.evidence ? `- **Evidence:** ${i.evidence}\n` : '') +
          (i.screenshotPath ? `- **Screenshot:** ${i.screenshotPath}\n` : '') +
          (i.suggestedFix ? `- **Suggested fix:** ${i.suggestedFix}\n` : ''),
      )
      .join('\n')
  );
}

class QaCollectorReporter implements Reporter {
  private summary: RunSummary = { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0 };

  onTestEnd(_test: TestCase, result: TestResult): void {
    this.summary.total += 1;
    if (result.status === 'passed') this.summary.passed += 1;
    else if (result.status === 'failed') this.summary.failed += 1;
    else if (result.status === 'flaky') this.summary.flaky += 1;
    else if (result.status === 'skipped') this.summary.skipped += 1;
  }

  onEnd(result: FullResult): void {
    const dir = path.resolve(process.cwd(), qaConfig.qaReportsDir);
    fs.mkdirSync(dir, { recursive: true });
    const runSummary = { ...this.summary, status: result.status, finishedAt: new Date().toISOString() };
    fs.writeFileSync(path.join(dir, 'run-summary.json'), JSON.stringify(runSummary, null, 2));

    const state = loadRunState();
    state.finishedAt = runSummary.finishedAt;
    saveRunState(state);
    writeJsonArtifacts();

    const critical = countBySeverity(state.issues, 'critical');
    const high = countBySeverity(state.issues, 'high');
    const medium = countBySeverity(state.issues, 'medium');
    const low = countBySeverity(state.issues, 'low');
    const readiness =
      critical > 0 || high > 3 || runSummary.failed > 5 ? 'No-Go' : 'Go (with caveats)';

    const md = `# JebDekho Playwright QA Report

## Executive Summary
- **Apps tested:** Buyer, Merchant, Admin, API
- **Total tests:** ${runSummary.total}
- **Passed:** ${runSummary.passed}
- **Failed:** ${runSummary.failed}
- **Flaky:** ${runSummary.flaky}
- **Skipped:** ${runSummary.skipped}
- **Critical issues:** ${critical}
- **High issues:** ${high}
- **Medium issues:** ${medium}
- **Low issues:** ${low}
- **Production readiness:** ${readiness}

## Environment
- **Buyer URL:** ${qaConfig.buyerUrl}
- **Merchant URL:** ${qaConfig.merchantUrl}
- **Admin URL:** ${qaConfig.adminUrl}
- **API URL:** ${qaConfig.apiUrl}
- **Browser:** Chromium, Firefox (homepage smoke), Mobile Chrome
- **Date/time:** ${state.finishedAt}

${formatIssueSection('Critical Issues', state.issues.filter((i) => i.severity === 'critical'))}
${formatIssueSection('High Issues', state.issues.filter((i) => i.severity === 'high'))}
${formatIssueSection('Medium Issues', state.issues.filter((i) => i.severity === 'medium'))}
${formatIssueSection('Low Issues', state.issues.filter((i) => i.severity === 'low'))}

## Failed API Calls
| App | Action | Method | Endpoint | Status | Error | UI behavior |
| --- | --- | --- | --- | --- | --- | --- |
${state.networkErrors
  .slice(0, 100)
  .map(
    (n) =>
      `| ${n.app} | ${n.action} | ${n.method} | ${n.endpoint.slice(0, 80)} | ${n.status} | ${n.error.slice(0, 60).replace(/\|/g, '/')} | ${n.uiBehavior ?? '—'} |`,
  )
  .join('\n')}

## Console Errors
| App | Page | Error | Severity |
| --- | --- | --- | --- |
${state.consoleErrors
  .slice(0, 80)
  .map(
    (c) =>
      `| ${c.app} | ${c.page.slice(0, 60)} | ${c.error.slice(0, 80).replace(/\|/g, '/')} | ${c.severity} |`,
  )
  .join('\n')}

## Broken Navigation
| App | Source page | Clicked item | Result |
| --- | --- | --- | --- |
${state.brokenNavigation
  .map(
    (b) =>
      `| ${b.app} | ${b.sourcePage.slice(0, 40)} | ${b.clickedItem} | ${b.result.slice(0, 60)} |`,
  )
  .join('\n')}

## RBAC Results
| Role | URL/action | Expected | Actual | Pass/Fail |
| --- | --- | --- | --- | --- |
${state.rbacResults
  .map((r) => `| ${r.role} | ${r.url} | ${r.expected} | ${r.actual.slice(0, 60)} | ${r.pass ? 'Pass' : 'Fail'} |`)
  .join('\n')}

## Checkout Findings
${state.findings.checkout.map((f) => `- ${f}`).join('\n') || '- No checkout findings recorded'}

## Merchant Findings
${state.findings.merchant.map((f) => `- ${f}`).join('\n') || '- See merchant test results'}

## Admin Findings
${state.findings.admin.map((f) => `- ${f}`).join('\n') || '- See admin test results'}

## Manual Verification Required
${state.manualVerification.map((m) => `- **${m.area}:** ${m.reason}`).join('\n') || 'None recorded.'}

## Top 20 Fixes Before Launch
${state.issues
  .sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  })
  .slice(0, 20)
  .map((i, idx) => `${idx + 1}. [${i.severity}] ${i.title} — ${i.suggestedFix ?? i.actual}`)
  .join('\n')}

---
Generated by JebDekho Playwright QA suite.
`;

    fs.writeFileSync(path.join(dir, 'jebdekho-qa-report.md'), md);
  }
}

export default QaCollectorReporter;
