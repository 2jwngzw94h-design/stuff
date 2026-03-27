const API_BASE = 'https://data.culture.gouv.fr/api/records/1.0/search/';
const DATASET = 'base-joconde-extrait';
const MAX_ROWS = 50;

function buildBaseParams() {
  return new URLSearchParams({
    dataset: DATASET,
    rows: String(MAX_ROWS),
  });
}

function applyLieuFilters(params, filters) {
  (filters.lieu_conservation || []).forEach((value) => {
    params.append('refine.lieu_conservation', value);
  });
}

function mergeUniqueRecords(recordLists) {
  const byId = new Map();
  recordLists.flat().forEach((record) => {
    byId.set(record.recordid, record);
  });
  return Array.from(byId.values()).slice(0, MAX_ROWS);
}

async function fetchRecords(params) {
  const response = await fetch(`${API_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Erreur API Joconde (${response.status}).`);
  }
  const data = await response.json();
  return data.records || [];
}

export async function fetchFacetOptions() {
  // Étape clé: charger les facettes puis fusionner domaine + matériaux/techniques en une seule option UI.
  const params = new URLSearchParams({
    dataset: DATASET,
    rows: '0',
  });

  ['lieu_conservation', 'domaine', 'materiaux_techniques'].forEach((field) => {
    params.append('facet', field);
  });

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Impossible de charger les filtres Joconde.');
  }

  const data = await response.json();
  const facets = data.facet_groups || [];

  const domaines = facets.find((f) => f.name === 'domaine')?.facets?.map((x) => x.name) || [];
  const materiaux =
    facets.find((f) => f.name === 'materiaux_techniques')?.facets?.map((x) => x.name) || [];

  return {
    lieu_conservation:
      facets.find((f) => f.name === 'lieu_conservation')?.facets?.map((x) => x.name) || [],
    domaine_materiaux: Array.from(new Set([...domaines, ...materiaux])).sort((a, b) =>
      a.localeCompare(b, 'fr')
    ),
  };
}

export async function searchWorks(filters) {
  // Étape clé: rechercher dans les champs domaine ET matériaux/techniques via 2 requêtes puis fusion.
  const selectedCombined = filters.domaine_materiaux || [];

  if (!selectedCombined.length) {
    const params = buildBaseParams();
    applyLieuFilters(params, filters);
    return fetchRecords(params);
  }

  const domaineParams = buildBaseParams();
  applyLieuFilters(domaineParams, filters);
  selectedCombined.forEach((value) => domaineParams.append('refine.domaine', value));

  const materiauxParams = buildBaseParams();
  applyLieuFilters(materiauxParams, filters);
  selectedCombined.forEach((value) => materiauxParams.append('refine.materiaux_techniques', value));

  const [domainRecords, materiauxRecords] = await Promise.all([
    fetchRecords(domaineParams),
    fetchRecords(materiauxParams),
  ]);

  return mergeUniqueRecords([domainRecords, materiauxRecords]);
}
