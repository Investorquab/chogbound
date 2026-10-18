import { chogSource, parseIds } from '../../../lib/chog-ids';

export const runtime = 'nodejs';

/** Traits for the Chogs a connected wallet owns. Only public name and trait data, never art. */
export async function GET(request: Request) {
  const ids = parseIds(new URL(request.url).searchParams.get('ids'));
  if (!ids) return Response.json({ error: 'Send ids as a comma separated list of up to 50 Chog numbers between 1 and 1969.' }, { status: 400 });
  return Response.json({ chogs: ids.map((id) => ({ id, metadata: { name: chogSource[String(id)].name, attributes: chogSource[String(id)].attributes } })) }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
