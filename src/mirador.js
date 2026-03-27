let miradorInstance = null;

export function renderMirador(collectionManifest, targetId = 'mirador-viewer') {
  // Étape clé: injecter le manifest de collection dans Mirador via URL objet locale.
  const viewerTarget = document.getElementById(targetId);
  if (!viewerTarget || typeof window.Mirador === 'undefined') {
    return;
  }

  const blobUrl = URL.createObjectURL(
    new Blob([JSON.stringify(collectionManifest)], {
      type: 'application/json',
    })
  );

  viewerTarget.innerHTML = '';

  miradorInstance = window.Mirador.viewer({
    id: targetId,
    windows: [{
      loadedManifest: blobUrl,
    }],
    workspace: {
      showZoomControls: true,
    },
  });

  return miradorInstance;
}
