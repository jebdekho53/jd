import { ensureReportsDir, loadRunState, saveRunState } from './helpers/report-writer';

export default async function globalSetup(): Promise<void> {
  ensureReportsDir();
  saveRunState({
    startedAt: new Date().toISOString(),
    issues: [],
    networkErrors: [],
    consoleErrors: [],
    brokenNavigation: [],
    rbacResults: [],
    manualVerification: [],
    findings: { checkout: [], merchant: [], admin: [] },
  });
  loadRunState();
}
