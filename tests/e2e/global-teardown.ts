import { writeJsonArtifacts } from './helpers/report-writer';

export default async function globalTeardown(): Promise<void> {
  writeJsonArtifacts();
}
