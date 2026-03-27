const API_BASE = 'https://data.culture.gouv.fr/api/records/1.0/search/';
const DATASET = 'base-joconde-extrait';
const MAX_ROWS = 100;

export function recordHasImage(record) {
  const fields = record?.fields || {};
  const presence = fields.presence_image;

  // Étape clé: détection tolérante de la présence d'image selon différentes formes de données.
  if (presence === true || presence === 'true' || presence === 1 || presence === '1') {
    return true;
  }

  return Boolean(fields.image || fields.images || fields.url_image || fields.representation);
}

function buildQuery(filters) {
  // Étape clé: construire une requête refine.* sans forcer présence_image pour retrouver le comportement initial.
  const params = new URLSearchParams({
    dataset: DATASET,
    rows: String(MAX_ROWS),
  });

  (filters.domaine || []).forEach((value) => {
    params.append('refine.domaine', value);
  });

  (filters.materiaux_techniques || []).forEach((value) => {
    params.append('refine.materiaux_techniques', value);
  });

  return params;
}

function extractOptionsFromRecords(records, fieldName) {
  const values = records
    .map((record) => record?.fields?.[fieldName])
    .flat()
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);

  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'fr'));
}

async function fetchRecordsForFallback() {
  // Étape clé: fallback si facettes vides, en lisant directement un échantillon de notices.
  const params = new URLSearchParams({
    dataset: DATASET,
    rows: String(MAX_ROWS),
  });

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  if (!response.ok) return [];

  const data = await response.json();
  return data.records || [];
}

export async function fetchFacetOptions() {
  // Étape clé: charger les facettes nécessaires à l'étape 1.
  const params = new URLSearchParams({
    dataset: DATASET,
    rows: '0',
  });

  ['domaine', 'materiaux_techniques'].forEach((field) => {
    params.append('facet', field);
    params.append('facet.limit', '200');
  });

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Impossible de charger les filtres Joconde.');
  }

  const data = await response.json();
  const facets = data.facet_groups || [];

  let domaine = facets.find((f) => f.name === 'domaine')?.facets?.map((x) => x.name) || [];
  let materiaux =
    facets.find((f) => f.name === 'materiaux_techniques')?.facets?.map((x) => x.name) || [];

  // Étape clé: fallback robuste si les facettes reviennent vides.
  if (!domaine.length || !materiaux.length) {
    const fallbackRecords = await fetchRecordsForFallback();
    if (!domaine.length) {
      domaine = extractOptionsFromRecords(fallbackRecords, 'domaine');
    }
    if (!materiaux.length) {
      materiaux = extractOptionsFromRecords(fallbackRecords, 'materiaux_techniques');
    }
  }

  return {
    domaine,
    materiaux_techniques: materiaux,
  };
}

export async function searchWorks(filters) {
  // Étape clé: appeler l'API Joconde puis appliquer option "uniquement avec image" côté client.
  const query = buildQuery(filters);
  const response = await fetch(`${API_BASE}?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`Erreur API Joconde (${response.status}).`);
  }

  const data = await response.json();
  const records = data.records || [];

  const filtered = filters.imageOnly ? records.filter(recordHasImage) : records;
  return filtered.slice(0, MAX_ROWS);
}
