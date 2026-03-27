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
    onToggleRecord: handleToggleRecord,
    onSelectAll: handleSelectAll,
    onClearAll: handleClearAll,
    onGenerateManifest: handleGenerateManifest,
    onBackToSearch: handleBackToSearch,
    onExport: handleExport,
    onOpenMirador: handleOpenMirador,
  });

  appRoot.innerHTML = '';
  appRoot.append(tree);

  // Étape clé: afficher Mirador seulement à l'étape 3 quand la collection existe.
  if (state.currentStep === 3 && state.collectionManifest) {
    renderMirador(state.collectionManifest);
  }
}

function handleFilterChange(name, values) {
  setFilter(name, values);
}

async function handleSearch() {
  // Étape clé: étape 1 -> animation -> étape 2 avec résultats API.
  setState({
    isLoading: true,
    isAnimatingStep: true,
    error: null,
    results: [],
    selectedRecordIds: [],
    collectionManifest: null,
    currentStep: 1,
  });

  try {
    const records = await searchWorks(state.filters);

    await new Promise((resolve) => setTimeout(resolve, 600));

    setState({
      currentStep: 2,
      isLoading: false,
      isAnimatingStep: false,
      results: records,
      selectedRecordIds: records.map((r) => r.recordid),
    });
  } catch (error) {
    setState({
      isLoading: false,
      isAnimatingStep: false,
      error: error.message || 'Une erreur inattendue est survenue.',
    });
  }
}

function handleToggleRecord(recordId, checked) {
  // Étape clé: sélection fine œuvre par œuvre dans la liste étape 2.
  const next = checked
    ? Array.from(new Set([...state.selectedRecordIds, recordId]))
    : state.selectedRecordIds.filter((id) => id !== recordId);

  setState({ selectedRecordIds: next });
}

function handleSelectAll() {
  // Étape clé: action globale "tout sélectionner".
  setState({ selectedRecordIds: state.results.map((record) => record.recordid) });
}

function handleClearAll() {
  // Étape clé: action globale "tout désélectionner".
  setState({ selectedRecordIds: [] });
}

async function handleGenerateManifest() {
  // Étape clé: étape 2 -> étape 3, génération du manifest de collection depuis la sélection utilisateur.
  setState({ isLoading: true, error: null });

  try {
    const selectedRecords = state.results.filter((record) =>
      state.selectedRecordIds.includes(record.recordid)
    );

    const validManifestUrls = await extractValidManifestUrls(selectedRecords);
    const collectionManifest = buildCollectionManifest(validManifestUrls);

    setState({
      isLoading: false,
      currentStep: 3,
      collectionManifest: validManifestUrls.length ? collectionManifest : null,
      error:
        validManifestUrls.length === 0
          ? 'Aucun manifest IIIF valide trouvé dans la sélection.'
          : null,
    });
  } catch (error) {
    setState({
      isLoading: false,
      error: error.message || 'Impossible de générer le manifest de collection.',
    });
  }
}

function handleBackToSearch() {
  // Étape clé: revenir à l'étape 1 sans perdre les filtres choisis.
  setState({ currentStep: 1, collectionManifest: null });
}

function handleOpenMirador() {
  // Étape clé: forcer l'ouverture du viewer Mirador si la collection est prête.
  if (!state.collectionManifest) return;
  renderMirador(state.collectionManifest);
}

function handleExport() {
  // Étape clé: exporter le manifest de collection au format JSON.
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
  // Étape clé: initialiser les facettes de recherche au démarrage.
  setState({ isLoading: true, error: null });

  try {
    const options = await fetchFacetOptions();
    setState({ options, isLoading: false });
  } catch (error) {
    setState({
      isLoading: false,
      error: error.message || 'Impossible de charger les filtres.',
    });
  }
}

subscribe(rerender);
rerender();
bootstrap();
