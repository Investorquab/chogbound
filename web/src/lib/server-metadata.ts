import metadata from '../../../traits.json';

type MetadataToken = { name: string; image?: string; attributes: { trait_type: string; value: string }[] };
export const metadataById = metadata as Record<string, MetadataToken>;
