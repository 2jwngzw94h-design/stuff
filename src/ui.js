import { MultiSelect } from './components/MultiSelect.js';
import { Button } from './components/Button.js';
import { Card } from './components/Card.js';
import { List } from './components/List.js';
import { Spinner } from './components/Spinner.js';

export function renderApp({
  state,
  onFilterChange,
  onSearch,
  onExport,
}) {
  // Étape clé: rendu global layout + zones (header, sidebar, résultats, viewer).
  const app = document.createElement('div');
  app.className = 'app';

  const header = document.createElement('header');
  header.className = 'header';

  const headerLeft = document.createElement('div');
  headerLeft.className = 'header__left';
  const title = document.createElement('h1');
  title.textContent = 'Joconde IIIF Explorer';

  const counter = document.createElement('span');
  counter.className = 'result-counter';
  counter.textContent = `${state.results.length} résultat(s)`;

  headerLeft.append(title, counter);

  const headerRight = document.createElement('div');
  headerRight.className = 'header__right';
  headerRight.append(
    Button({
      label: 'Exporter manifest',
      disabled: !state.collectionManifest,
      onClick: onExport,
    })
  );

  header.append(headerLeft, headerRight);

  const layout = document.createElement('main');
  layout.className = 'layout';

  const filterPanel = document.createElement('section');
  filterPanel.className = 'panel';
  filterPanel.append(panelHeader('Filtres'));

  const filterContent = document.createElement('div');
  filterContent.className = 'panel__content';

  filterContent.append(
    MultiSelect({
      label: 'Lieu de conservation',
      options: state.options.lieu_conservation,
      selectedValues: state.filters.lieu_conservation,
      onChange: (values) => onFilterChange('lieu_conservation', values),
    }),
    MultiSelect({
      label: 'Domaine',
      options: state.options.domaine,
      selectedValues: state.filters.domaine,
      onChange: (values) => onFilterChange('domaine', values),
    }),
    MultiSelect({
      label: 'Matériaux / techniques',
      options: state.options.materiaux_techniques,
      selectedValues: state.filters.materiaux_techniques,
      onChange: (values) => onFilterChange('materiaux_techniques', values),
    }),
    Button({ label: 'Rechercher', disabled: state.isLoading, onClick: onSearch })
  );

  filterPanel.append(filterContent);

  const resultsPanel = document.createElement('section');
  resultsPanel.className = 'panel';
  resultsPanel.append(panelHeader('Résultats'));

  const resultsContent = document.createElement('div');
  resultsContent.className = 'panel__content';

  // Étape clé: rendu conditionnel (loader, erreur, liste, état vide).
  if (state.isLoading) {
    resultsContent.append(Spinner());
  } else if (state.error) {
    const error = document.createElement('div');
    error.className = 'error';
    error.textContent = state.error;
    resultsContent.append(error);
  } else if (!state.results.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Aucun résultat. Sélectionnez des filtres puis lancez une recherche.';
    resultsContent.append(empty);
  } else {
    const cards = state.results.map((record) => Card(record));
    resultsContent.append(List(cards));
  }

  resultsPanel.append(resultsContent);

  const viewerPanel = document.createElement('section');
  viewerPanel.className = 'panel';
  viewerPanel.append(panelHeader('Mirador'));

  const viewerContent = document.createElement('div');
  viewerContent.className = 'panel__content';
  const viewer = document.createElement('div');
  viewer.id = 'mirador-viewer';
  viewer.className = 'viewer';
  viewerContent.append(viewer);
  viewerPanel.append(viewerContent);

  layout.append(filterPanel, resultsPanel, viewerPanel);
  app.append(header, layout);

  return app;
}

function panelHeader(text) {
  const header = document.createElement('div');
  header.className = 'panel__header';
  const title = document.createElement('h2');
  title.className = 'panel__title';
  title.textContent = text;
  header.append(title);
  return header;
}
