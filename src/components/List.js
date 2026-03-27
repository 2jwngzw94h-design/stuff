// Composant liste scrollable de résultats.
export function List(items) {
  const container = document.createElement('div');
  container.className = 'results-list';
  items.forEach((item) => container.append(item));
  return container;
}
