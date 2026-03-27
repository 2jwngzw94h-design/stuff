// État global centralisé pour garder l'application prévisible et modulaire.
export const state = {
  filters: {
    lieu_conservation: [],
    domaine_materiaux: [],
  },
  options: {
    lieu_conservation: [],
    domaine_materiaux: [],
  },
  results: [],
  isLoading: false,
  error: null,
  collectionManifest: null,
};

const subscribers = new Set();

// Étape clé: pub/sub minimal pour déclencher les rerenders UI au moindre changement d'état.
export function subscribe(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function setState(patch) {
  Object.assign(state, patch);
  subscribers.forEach((listener) => listener(state));
}

export function setFilter(name, values) {
  state.filters[name] = values;
  subscribers.forEach((listener) => listener(state));
}
