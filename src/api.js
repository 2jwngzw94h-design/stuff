const API_BASE = 'https://data.culture.gouv.fr/api/records/1.0/search/';
const DATASET = 'base-joconde-extrait';
const MAX_ROWS = 50;

function buildQuery(filters) {
  // Étape clé: construire une requête refine.* avec des blocs distincts domaine et matériaux/techniques.
  const params = new URLSearchParams({
    dataset: DATASET,
    rows: String(MAX_ROWS),
  });

  (filters.lieu_conservation || []).forEach((value) => {
    params.append('refine.lieu_conservation', value);
  });

  (filters.domaine || []).forEach((value) => {
    params.append('refine.domaine', value);
  });

  (filters.materiaux_techniques || []).forEach((value) => {
    params.append('refine.materiaux_techniques', value);
  });

  return params;
}

export async function fetchFacetOptions() {
  // Étape clé: charger les 3 facettes nécessaires au formulaire de recherche étape 1.
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

  return {
    lieu_conservation:
      facets.find((f) => f.name === 'lieu_conservation')?.facets?.map((x) => x.name) || [],
    domaine: facets.find((f) => f.name === 'domaine')?.facets?.map((x) => x.name) || [],
    materiaux_techniques:
      facets.find((f) => f.name === 'materiaux_techniques')?.facets?.map((x) => x.name) || [],
  };
}

export async function searchWorks(filters) {
  // Étape clé: appeler l'API Joconde avec les refinements saisis à l'étape 1.
  const query = buildQuery(filters);
  const response = await fetch(`${API_BASE}?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`Erreur API Joconde (${response.status}).`);
  }

  const data = await response.json();
  return data.records || [];
}
