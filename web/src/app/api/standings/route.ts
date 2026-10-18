import { nightNumber } from '../../../lib/night';
import { seasonStandings } from '../../../lib/standings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/standings?night=9&limit=10&token=308  Season standings for all 1,969 Chogs through a night, plus one Chog's row. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const current = nightNumber();
  const night = params.get('night') === null ? current : Number(params.get('night'));
  const limit = params.get('limit') === null ? 10 : Number(params.get('limit'));
  const tokenParam = params.get('token');
  const token = tokenParam === null ? null : Number(tokenParam);
  const bad = (message: string) => Response.json({ error: message }, { status: 400 });
  if (!Number.isInteger(night) || night < 1 || night > current) return bad(`night must be a whole number from 1 to ${current}.`);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) return bad('limit must be a whole number from 1 to 50.');
  if (token !== null && (!Number.isInteger(token) || token < 1 || token > 1969)) return bad('token must be a whole number from 1 to 1969.');
  const rows = seasonStandings(night);
  return Response.json({ night, total: rows.length, top: rows.slice(0, limit), you: token === null ? null : rows.find((row) => row.id === token) ?? null }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } });
}
