import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TraitAttribute, TraitToken } from './types.js';

export type LoadedTraitToken = TraitToken & { image?: string };
export type TraitDataset = Record<string, LoadedTraitToken>;
const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TRAITS_PATH = resolve(here, '../../traits.json');

type RootToken = { name: string; image?: string; attributes: TraitAttribute[] };
type LegacyToken = { tokenId: string | number; name: string; attributes: Record<string, string> };

/** Read root traits.json by default. Accepts root metadata objects and legacy sample arrays. */
export async function loadTraits(path = DEFAULT_TRAITS_PATH): Promise<TraitDataset> {
  const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (Array.isArray(parsed)) {
    const result: TraitDataset = {};
    for (const raw of parsed as LegacyToken[]) {
      result[String(raw.tokenId)] = {
        name: raw.name,
        attributes: Object.entries(raw.attributes).map(([trait_type, value]) => ({ trait_type, value })),
      };
    }
    return result;
  }
  if (!parsed || typeof parsed !== 'object') throw new Error(`Unsupported traits JSON shape at ${path}`);
  const result: TraitDataset = {};
  for (const [tokenId, raw] of Object.entries(parsed as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') throw new Error(`Invalid token record ${tokenId} in ${path}`);
    const token = raw as Partial<RootToken>;
    if (typeof token.name !== 'string' || !Array.isArray(token.attributes)) {
      throw new Error(`Token ${tokenId} must have name and attributes[] in ${path}`);
    }
    result[tokenId] = { name: token.name, image: token.image, attributes: token.attributes };
  }
  return result;
}
