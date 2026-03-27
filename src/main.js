import { fetchFacetOptions, searchWorks, recordHasImage } from './api.js';
import { state, setFilter, setState, subscribe } from './state.js';
import { renderApp } from './ui.js';

const appRoot = document.getElementById('app');

function rerender() {
  const tree = renderApp({
    state,
    onFilterChange: handleFilterChange,
    onToggleImageOnly: handleToggleImageOnly,
    onSearch: handleSearch,
    onToggleRecord: handleToggleRecord,
    onSelectAll: handleSelectAll,
    onClearAll: handleClearAll,
    onSelectOnlyWithImage: handleSelectOnlyWithImage,
    onGoToPage2: handleGoToPage2,
    onPrevPage: handlePrevPage,
    onNextPage: handleNextPage,
  });

  appRoot.innerHTML = '';
  appRoot.append(tree);
}

function handleFilterChange(name, values) {
  setFilter(name, values);
}

function handleToggleImageOnly(checked) {
  // Étape clé: activer/désactiver l'option de recherche "image uniquement".
  setFilter('imageOnly', checked);
}

async function handleSearch() {
  // Étape clé: recherche API (comportement initial retrouvé) puis affichage paginé 50/50.
  setState({
    isLoading: true,
    isAnimatingStep: true,
    error: null,
    results: [],
    selectedRecordIds: [],
    currentStep: 1,
    pagination: { ...state.pagination, page: 1 },
  });

  try {
    const records = await searchWorks(state.filters);

    await new Promise((resolve) => setTimeout(resolve, 400));

    setState({
      currentStep: 2,
      isLoading: false,
      isAnimatingStep: false,
      results: records,
      selectedRecordIds: records.map((r) => r.recordid),
      pagination: { ...state.pagination, page: 1 },
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
  // Étape clé: sélection fine œuvre par œuvre dans la liste.
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

function handleSelectOnlyWithImage() {
  // Étape clé: sélectionner uniquement les notices disposant d'une image.
  const ids = state.results.filter(recordHasImage).map((record) => record.recordid);
  setState({ selectedRecordIds: ids });
}

function handlePrevPage() {
  // Étape clé: pagination - page précédente.
  const nextPage = Math.max(1, state.pagination.page - 1);
  setState({ pagination: { ...state.pagination, page: nextPage } });
}

function handleNextPage() {
  // Étape clé: pagination - page suivante.
  const totalPages = Math.max(1, Math.ceil(state.results.length / state.pagination.pageSize));
  const nextPage = Math.min(totalPages, state.pagination.page + 1);
  setState({ pagination: { ...state.pagination, page: nextPage } });
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
