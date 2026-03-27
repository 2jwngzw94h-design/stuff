import { fetchFacetOptions, searchWorks } from './api.js';
import { state, setFilter, setState, subscribe } from './state.js';
import { buildCollectionManifest, extractValidManifestUrls } from './manifest.js';
import { renderMirador } from './mirador.js';
import { renderApp } from './ui.js';

const appRoot = document.getElementById('app');

function rerender() {
  const tree = renderApp({
    state,
    onFilterChange: handleFilterChange,
    onSearch: handleSearch,
    onExport: handleExport,
  });
  appRoot.innerHTML = '';
  appRoot.append(tree);

  // Étape clé: (re)charger Mirador uniquement lorsqu'un manifest de collection est disponible.
  if (state.collectionManifest) {
    renderMirador(state.collectionManifest);
  }
}

function handleFilterChange(name, values) {
  setFilter(name, values);
}

async function handleSearch() {
  // Étape clé: pipeline data flow complet depuis les filtres jusqu'au manifest de collection.
  setState({ isLoading: true, error: null, results: [], collectionManifest: null });

  try {
    const records = await searchWorks(state.filters);
    const validManifestUrls = await extractValidManifestUrls(records);
    const collectionManifest = buildCollectionManifest(validManifestUrls);

    setState({
      results: records,
      collectionManifest: validManifestUrls.length ? collectionManifest : null,
      isLoading: false,
      error:
        validManifestUrls.length === 0 && records.length > 0
          ? 'Résultats API chargés, mais aucun manifest IIIF valide détecté.'
          : null,
    });
  } catch (error) {
    setState({
      isLoading: false,
      error: error.message || 'Une erreur inattendue est survenue.',
      results: [],
      collectionManifest: null,
    });
  }
}

function handleExport() {
  // Étape clé: exporter le manifest de collection au format JSON depuis le navigateur.
  if (!state.collectionManifest) return;

  const blob = new Blob([JSON.stringify(state.collectionManifest, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'joconde-collection-manifest.json';
  link.click();

  URL.revokeObjectURL(url);
}

async function bootstrap() {
  // Étape clé: initialiser les options de filtres, puis précharger une première page de résultats API.
  setState({ isLoading: true, error: null });

  try {
    const options = await fetchFacetOptions();
    setState({ options });
  } catch {
    // Étape clé: fallback gracieux pour ne pas bloquer l'affichage des résultats si les facettes échouent.
    setState({
      options: {
        lieu_conservation: [],
        domaine_materiaux: [],
      },
    });
  }

  try {
    const records = await searchWorks(state.filters);
    setState({ isLoading: false, results: records, error: null });
  } catch (error) {
    setState({
      isLoading: false,
      error: error.message || 'Impossible de charger les résultats API.',
      results: [],
    });
  }
}

subscribe(rerender);
rerender();
bootstrap();
