// État global centralisé pour piloter le parcours page 1 (étape 1 et étape 2).
export const state = {
  currentStep: 1,
  isAnimatingStep: false,
  filters: {
    domaine: [],
    materiaux_techniques: [],
  },
  options: {
    domaine: [],
    materiaux_techniques: [],
  },
  results: [],
  selectedRecordIds: [],
  isLoading: false,
  error: null,
};

const subscribers = new Set();

// Étape clé: mécanisme pub/sub pour rerender l'UI à chaque mutation d'état.
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
