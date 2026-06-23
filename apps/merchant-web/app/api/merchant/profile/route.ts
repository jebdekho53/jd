import { NextRequest } from 'next/server';
import { proxyGet, proxyPost, proxyPatch } from '@/lib/auth/bff-proxy';

export const GET = () => proxyGet('/merchant/profile');
export const POST = (req: NextRequest) => proxyPost(req, '/merchant/profile', {}, 201);
export const PATCH = (req: NextRequest) => proxyPatch(req, '/merchant/profile');
