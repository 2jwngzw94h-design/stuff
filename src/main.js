import { fetchFacetOptions, searchWorks } from './api.js';
import { state, setFilter, setState, subscribe } from './state.js';
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
    onGoToPage2: handleGoToPage2,
  });

  appRoot.innerHTML = '';
  appRoot.append(tree);
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

function handleGoToPage2() {
  // Étape clé: sérialiser la sélection et naviguer vers la seconde page (étapes 3 & 4).
  const selectedRecords = state.results.filter((record) =>
    state.selectedRecordIds.includes(record.recordid)
  );

  sessionStorage.setItem('jocondeSelectedRecords', JSON.stringify(selectedRecords));
  window.location.href = 'manifest.html';
}

async function bootstrap() {
  // Étape clé: initialiser les facettes de recherche au démarrage de la page 1.
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
