const API_BASE = 'https://data.culture.gouv.fr/api/records/1.0/search/';
const DATASET = 'base-joconde-extrait';
const MAX_ROWS = 50;

function buildQuery(filters) {
  // Étape clé: construire une requête refine.* multi-valeurs compatible API tabulaire Joconde.
  const params = new URLSearchParams({
    dataset: DATASET,
    rows: String(MAX_ROWS),
    sort: '-datation',
  });

  Object.entries(filters).forEach(([field, values]) => {
    values.forEach((value) => params.append(`refine.${field}`, value));
  });

  return params;
}

export async function fetchFacetOptions() {
  // Étape clé: charger les valeurs de filtres via facettes pour alimenter les MultiSelect.
  const params = new URLSearchParams({
    dataset: DATASET,
    rows: '0',
  });

  ['lieu_conservation', 'domaine', 'materiaux_techniques'].forEach((field) => {
    params.append('facet', field);
    params.append(`facet.limit`, '100');
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
  // Étape clé: appeler l'API Joconde avec les filtres actifs et gérer proprement les erreurs réseau.
  const query = buildQuery(filters);
  const response = await fetch(`${API_BASE}?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`Erreur API Joconde (${response.status}).`);
  }

  const data = await response.json();
  return data.records || [];
}
