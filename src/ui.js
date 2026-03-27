import { MultiSelect } from './components/MultiSelect.js';
import { Button } from './components/Button.js';
import { Card } from './components/Card.js';
import { List } from './components/List.js';
import { Spinner } from './components/Spinner.js';

export function renderApp({
  state,
  onFilterChange,
  onSearch,
  onToggleRecord,
  onSelectAll,
  onClearAll,
  onGoToPage2,
}) {
  // Étape clé: structure globale page 1 (étape 1 + étape 2 seulement).
  const app = document.createElement('div');
  app.className = 'app';

  const header = document.createElement('header');
  header.className = 'header';

  const title = document.createElement('h1');
  title.textContent = 'Joconde IIIF Explorer — Page 1';

  const counter = document.createElement('span');
  counter.className = 'result-counter';
  counter.textContent = `${state.results.length} résultat(s)`;

  const leftHeader = document.createElement('div');
  leftHeader.className = 'header__left';
  leftHeader.append(title, counter);

  header.append(leftHeader);

  const layout = document.createElement('main');
  layout.className = 'layout layout--two-col';

  // Étape clé: panneau recherche (sans lieu de conservation).
  const searchPanel = document.createElement('section');
  searchPanel.className = 'panel';
  searchPanel.append(panelHeader('Étape 1 — Recherche'));

  const searchContent = document.createElement('div');
  searchContent.className = 'panel__content';
  searchContent.append(
    renderStepper(state.currentStep, [1, 2]),
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
    Button({ label: 'Lancer la recherche', disabled: state.isLoading, onClick: onSearch })
  );

  searchPanel.append(searchContent);

  // Étape clé: panneau résultats + sélection + navigation vers page 2.
  const resultPanel = document.createElement('section');
  resultPanel.className = 'panel';
  resultPanel.append(panelHeader('Étape 2 — Résultats API & Sélection'));

  const resultContent = document.createElement('div');
  resultContent.className = 'panel__content';

  if (state.isLoading || state.isAnimatingStep) {
    const txt = document.createElement('p');
    txt.className = 'empty';
    txt.textContent = 'Transition vers l’étape 2…';
    resultContent.append(Spinner(), txt);
  } else if (state.error) {
    const error = document.createElement('div');
    error.className = 'error';
    error.textContent = state.error;
    resultContent.append(error);
  } else if (state.currentStep < 2) {
    const hint = document.createElement('p');
    hint.className = 'empty';
    hint.textContent = 'Lancez une recherche pour afficher les œuvres.';
    resultContent.append(hint);
  } else {
    const actions = document.createElement('div');
    actions.className = 'result-actions';
    actions.append(
      Button({ label: 'Tout sélectionner', onClick: onSelectAll }),
      Button({ label: 'Tout désélectionner', onClick: onClearAll }),
      Button({
        label: 'Aller à la page 2 (étapes 3 & 4)',
        disabled: !state.selectedRecordIds.length,
        onClick: onGoToPage2,
      })
    );

    const selectedText = document.createElement('p');
    selectedText.className = 'empty';
    selectedText.textContent = `${state.selectedRecordIds.length} œuvre(s) sélectionnée(s)`;

    const cards = state.results.map((record) =>
      Card({
        record,
        selected: state.selectedRecordIds.includes(record.recordid),
        onToggle: onToggleRecord,
      })
    );

    resultContent.append(actions, selectedText, List(cards));
  }

  resultPanel.append(resultContent);

  layout.append(searchPanel, resultPanel);
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

function renderStepper(currentStep, steps) {
  const stepper = document.createElement('div');
  stepper.className = 'stepper';

  steps.forEach((step) => {
    const node = document.createElement('span');
    node.className = `stepper__item ${currentStep >= step ? 'is-active' : ''}`;
    node.textContent = `Étape ${step}`;
    stepper.append(node);
  });

  return stepper;
}
