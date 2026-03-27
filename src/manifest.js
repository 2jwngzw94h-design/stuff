function getNoticeId(record) {
  const fields = record.fields || {};
  const candidates = [fields.ref, fields.reference, fields.id, fields.identifiant, record.recordid]
    .flat()
    .filter(Boolean)
    .map((value) => String(value).trim());

  return candidates.find((value) => value.length > 0) || null;
}

function getRecordLabel(record) {
  const fields = record.fields || {};
  return fields.titre || fields.denomination || `Notice Joconde ${getNoticeId(record) || ''}`.trim();
}

function buildManifestUrlFromNoticeId(noticeId) {
  // Étape clé: construire l'URL de manifest IIIF à partir de l'identifiant Joconde.
  return `https://api-popcorn.stg.cloud.culture.fr/notices/joconde/${encodeURIComponent(
    noticeId
  )}/iiif/manifest`;
}

export function buildCollectionItemsFromRecords(records) {
  // Étape clé: transformer chaque notice sélectionnée en item IIIF Manifest avec label FR.
  return records
    .map((record) => {
      const noticeId = getNoticeId(record);
      if (!noticeId) return null;

      return {
        id: buildManifestUrlFromNoticeId(noticeId),
        type: 'Manifest',
        label: {
          fr: [getRecordLabel(record)],
        },
      };
    })
    .filter(Boolean);
}

export function buildCollectionManifestFromRecords(records) {
  // Étape clé: générer un manifest IIIF Presentation 3 de type Collection avec items construits.
  const items = buildCollectionItemsFromRecords(records);

  return {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: `urn:uuid:joconde-collection-${Date.now()}`,
    type: 'Collection',
    label: {
      fr: ['Collection Joconde'],
      en: ['Joconde Collection'],
    },
    summary: {
      fr: ['Collection générée dynamiquement depuis une sélection de notices Joconde.'],
    },
    items,
  };
}
