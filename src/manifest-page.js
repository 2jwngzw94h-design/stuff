import { buildCollectionManifest, extractValidManifestUrls } from './manifest.js';
import { renderMirador } from './mirador.js';
import { Button } from './components/Button.js';
import { Spinner } from './components/Spinner.js';

const root = document.getElementById('manifest-app');

function createLayout() {
  const app = document.createElement('div');
  app.className = 'app';

  const header = document.createElement('header');
  header.className = 'header';

  const left = document.createElement('div');
  left.className = 'header__left';

  const title = document.createElement('h1');
  title.textContent = 'Joconde IIIF Explorer — Page 2';
  const subtitle = document.createElement('span');
  subtitle.className = 'result-counter';
  subtitle.textContent = 'Étape 3: JSON du manifest • Étape 4: Mirador';
  left.append(title, subtitle);

  header.append(left);

  const layout = document.createElement('main');
  layout.className = 'layout layout--two-col';

  const step3Panel = document.createElement('section');
  step3Panel.className = 'panel';
  step3Panel.append(panelHeader('Étape 3 — Manifest de collection JSON'));

  const step3Content = document.createElement('div');
  step3Content.className = 'panel__content';
  step3Content.id = 'step3-content';
  step3Panel.append(step3Content);

  const step4Panel = document.createElement('section');
  step4Panel.className = 'panel';
  step4Panel.append(panelHeader('Étape 4 — Ouvrir dans Mirador'));

  const step4Content = document.createElement('div');
  step4Content.className = 'panel__content';

  const actionRow = document.createElement('div');
  actionRow.className = 'result-actions';
  actionRow.id = 'step4-actions';

  const viewer = document.createElement('div');
  viewer.id = 'mirador-viewer';
  viewer.className = 'viewer';

  step4Content.append(actionRow, viewer);
  step4Panel.append(step4Content);

  layout.append(step3Panel, step4Panel);
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

async function bootstrapPage2() {
  // Étape clé: reconstruire la sélection depuis le stockage de session.
  const raw = sessionStorage.getItem('jocondeSelectedRecords');
  const selectedRecords = raw ? JSON.parse(raw) : [];

  root.innerHTML = '';
  const app = createLayout();
  root.append(app);

  const step3Content = document.getElementById('step3-content');
  const step4Actions = document.getElementById('step4-actions');

  if (!selectedRecords.length) {
    const empty = document.createElement('div');
    empty.className = 'error';
    empty.textContent = 'Aucune œuvre sélectionnée. Revenez à la page 1.';
    step3Content.append(empty);
    step4Actions.append(Button({ label: 'Retour page 1', onClick: () => (window.location.href = 'index.html') }));
    return;
  }

  // Étape clé: générer la collection depuis les manifests valides des œuvres sélectionnées.
  step3Content.append(Spinner());

  let collectionManifest = null;
  try {
    const validManifestUrls = await extractValidManifestUrls(selectedRecords);
    collectionManifest = buildCollectionManifest(validManifestUrls);
    step3Content.innerHTML = '';

    const pre = document.createElement('pre');
    pre.className = 'json-preview';
    pre.textContent = JSON.stringify(collectionManifest, null, 2);
    step3Content.append(pre);
  } catch (error) {
    step3Content.innerHTML = '';
    const err = document.createElement('div');
    err.className = 'error';
    err.textContent = error.message || 'Erreur lors de la génération du manifest.';
    step3Content.append(err);
  }

  // Étape clé: étape 4 avec bouton d'ouverture Mirador sous le JSON.
  step4Actions.append(
    Button({ label: 'Retour page 1', onClick: () => (window.location.href = 'index.html') }),
    Button({
      label: 'Ouvrir dans Mirador',
      disabled: !collectionManifest,
      onClick: () => renderMirador(collectionManifest),
    })
  );
}

bootstrapPage2();
