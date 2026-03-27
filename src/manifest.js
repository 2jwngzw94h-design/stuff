function buildCandidateManifestUrls(record) {
  const fields = record.fields || {};
  const candidates = [];

  // Étape clé: récupérer les URLs IIIF existantes exposées par les champs Joconde lorsque disponibles.
  [fields.manifest, fields.manifest_url, fields.iiif_manifest, fields.iiif_url]
    .flat()
    .filter(Boolean)
    .forEach((value) => candidates.push(value));

  const rawIds = [
    fields.ref,
    fields.reference,
    fields.id,
    fields.identifiant,
    fields.cote,
    record.recordid,
  ]
    .flat()
    .filter(Boolean);

  // Étape clé: construire des URLs IIIF de secours à partir des identifiants Joconde détectés.
  rawIds.forEach((idValue) => {
    const cleaned = String(idValue).trim();
    if (!cleaned) return;
    candidates.push(`https://pop.culture.gouv.fr/notice/joconde/${encodeURIComponent(cleaned)}/manifest`);
  });

  return Array.from(new Set(candidates)).filter((url) => url.startsWith('http'));
}

async function isManifestValid(url) {
  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) return false;
    const json = await response.json();
    return json.type === 'Manifest' || json['@type'] === 'sc:Manifest';
  } catch {
    return false;
  }
}

export async function extractValidManifestUrls(records) {
  // Étape clé: vérifier les manifests un par un et ne garder que ceux valides pour le viewer.
  const candidates = records.flatMap(buildCandidateManifestUrls);
  const uniqueCandidates = Array.from(new Set(candidates));

  const checks = await Promise.allSettled(
    uniqueCandidates.map(async (url) => ((await isManifestValid(url)) ? url : null))
  );

  return checks
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => result.value);
}

export function buildCollectionManifest(manifestUrls) {
  // Étape clé: générer un manifest IIIF Presentation 3 de type Collection.
  return {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: `urn:uuid:joconde-collection-${Date.now()}`,
    type: 'Collection',
    label: {
      fr: ['Collection Joconde'],
      en: ['Joconde Collection'],
    },
    summary: {
      fr: ['Collection générée dynamiquement depuis l’API Joconde.'],
    },
    items: manifestUrls.map((url) => ({
      id: url,
      type: 'Manifest',
    })),
  };
}
