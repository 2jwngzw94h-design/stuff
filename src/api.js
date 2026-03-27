const API_BASE = 'https://data.culture.gouv.fr/api/records/1.0/search/';
const DATASET = 'base-joconde-extrait';
const MAX_ROWS = 100;

function hasPresenceImage(record) {
  const value = record?.fields?.presence_image;
  return value === true || value === 'true' || value === 1 || value === '1';
}

function buildQuery(filters) {
  // Étape clé: construire une requête refine.* avec présence_image=true et 100 résultats max.
  const params = new URLSearchParams({
    dataset: DATASET,
    rows: String(MAX_ROWS),
  });

  params.append('refine.presence_image', 'true');

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
  params.append('refine.presence_image', 'true');

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.records || []).filter(hasPresenceImage);
}

export async function fetchFacetOptions() {
  // Étape clé: charger les facettes nécessaires à l'étape 1.
  const params = new URLSearchParams({
    dataset: DATASET,
    rows: '0',
  });

  // On ne filtre pas ici sur presence_image pour éviter de vider les facettes selon les comportements API.
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
  // Étape clé: appeler l'API Joconde avec présence_image=true, puis filtrage de sécurité côté client.
  const query = buildQuery(filters);
  const response = await fetch(`${API_BASE}?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`Erreur API Joconde (${response.status}).`);
  }

  const data = await response.json();
  return (data.records || []).filter(hasPresenceImage).slice(0, MAX_ROWS);
}
