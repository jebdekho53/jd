import { AiCatalogConfigService, SETTING_KEYS } from './ai-catalog-config.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

function makeService(env: string | undefined, dbValue: boolean | null) {
  const config = { get: jest.fn((k: string) => (k === 'AI_CATALOG_V2_ENABLED' ? env : undefined)) } as unknown as ConfigService;
  const prisma = {
    aICatalogSetting: {
      findUnique: jest.fn((args: { where: { key: string } }) =>
        Promise.resolve(args.where.key === SETTING_KEYS.FEATURE_ENABLED && dbValue !== null ? { value: dbValue } : null),
      ),
    },
  } as unknown as PrismaService;
  return new AiCatalogConfigService(config, prisma);
}

describe('AiCatalogConfigService.isEnabled — kill switch precedence', () => {
  it('defaults to DISABLED when env unset and no DB row', async () => {
    expect(await makeService(undefined, null).isEnabled()).toBe(false);
  });

  it('env=false is a HARD kill switch — DB cannot override it', async () => {
    expect(await makeService('false', true).isEnabled()).toBe(false);
  });

  it('DB toggle enables when the kill switch is not engaged', async () => {
    expect(await makeService(undefined, true).isEnabled()).toBe(true);
    expect(await makeService('true', true).isEnabled()).toBe(true);
  });

  it('DB=false disables even if env=true', async () => {
    expect(await makeService('true', false).isEnabled()).toBe(false);
  });

  it('env=true with no DB row enables', async () => {
    expect(await makeService('true', null).isEnabled()).toBe(true);
  });
});
