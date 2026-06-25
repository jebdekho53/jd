'use client';

const GOOGLE_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
const APPLE_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_APPLE_CLIENT_ID);

export function SocialLogin() {
  return (
    <div className="space-y-3">
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-neutral-500">or continue with</span>
        </div>
      </div>

      <SocialButton provider="Google" configured={GOOGLE_CONFIGURED} />
      <SocialButton provider="Apple" configured={APPLE_CONFIGURED} />
    </div>
  );
}

function SocialButton({ provider, configured }: { provider: string; configured: boolean }) {
  return (
    <button
      type="button"
      disabled={!configured}
      className="relative flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
      onClick={() => {
        if (!configured) return;
      }}
    >
      Continue with {provider}
      {!configured && (
        <span className="absolute -right-1 -top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
          Coming Soon
        </span>
      )}
    </button>
  );
}
