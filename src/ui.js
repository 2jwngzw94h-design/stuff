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
  onGenerateManifest,
  onBackToSearch,
  onExport,
  onOpenMirador,
}) {
  // Étape clé: structure globale de l'application et header.
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

  // Étape clé: panneau gauche = étape 1 (recherche) avec blocs séparés domaine/matériaux.
  const left = document.createElement('section');
  left.className = 'panel';
  left.append(panelHeader('Étape 1 — Rechercher'));
  const leftContent = document.createElement('div');
  leftContent.className = 'panel__content';
  leftContent.append(
    renderStepper(state.currentStep),
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
    Button({ label: 'Lancer la recherche', disabled: state.isLoading, onClick: onSearch })
  );
  left.append(leftContent);

  // Étape clé: panneau central = étape 2 avec animation puis résultats + sélection.
  const center = document.createElement('section');
  center.className = 'panel';
  center.append(panelHeader('Étape 2 — Résultats API'));
  const centerContent = document.createElement('div');
  centerContent.className = 'panel__content';

  if (state.isLoading || state.isAnimatingStep) {
    const txt = document.createElement('p');
    txt.className = 'empty';
    txt.textContent = 'Transition vers l’étape 2…';
    centerContent.append(Spinner(), txt);
  } else if (state.error) {
    const error = document.createElement('div');
    error.className = 'error';
    error.textContent = state.error;
    centerContent.append(error);
  } else if (state.currentStep < 2) {
    const hint = document.createElement('p');
    hint.className = 'empty';
    hint.textContent = 'Lancez une recherche pour afficher les œuvres.';
    centerContent.append(hint);
  } else {
    const actions = document.createElement('div');
    actions.className = 'result-actions';
    actions.append(
      Button({ label: 'Tout sélectionner', onClick: onSelectAll }),
      Button({ label: 'Tout désélectionner', onClick: onClearAll }),
      Button({
        label: 'Étape 3: Générer la collection',
        disabled: !state.selectedRecordIds.length,
        onClick: onGenerateManifest,
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

    centerContent.append(actions, selectedText, List(cards));
  }

  center.append(centerContent);

  // Étape clé: panneau droit = étape 3 génération + ouverture Mirador.
  const right = document.createElement('section');
  right.className = 'panel';
  right.append(panelHeader('Étape 3 — Manifest & Mirador'));
  const rightContent = document.createElement('div');
  rightContent.className = 'panel__content';

  const stepHint = document.createElement('p');
  stepHint.className = 'empty';
  stepHint.textContent =
    state.currentStep < 3
      ? 'Sélectionnez des œuvres puis générez la collection IIIF.'
      : 'Collection générée. Ouvrez-la dans Mirador.';

  const row = document.createElement('div');
  row.className = 'result-actions';
  row.append(
    Button({ label: 'Retour à l’étape 1', onClick: onBackToSearch }),
    Button({
      label: 'Ouvrir dans Mirador',
      disabled: !state.collectionManifest,
      onClick: onOpenMirador,
    })
  );

  const viewer = document.createElement('div');
  viewer.id = 'mirador-viewer';
  viewer.className = 'viewer';

  rightContent.append(renderStepper(state.currentStep), stepHint, row, viewer);
  right.append(rightContent);

  layout.append(left, center, right);
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

function renderStepper(currentStep) {
  const stepper = document.createElement('div');
  stepper.className = 'stepper';

  [1, 2, 3].forEach((step) => {
    const node = document.createElement('span');
    node.className = `stepper__item ${currentStep >= step ? 'is-active' : ''}`;
    node.textContent = `Étape ${step}`;
    stepper.append(node);
  });

  return stepper;
}
