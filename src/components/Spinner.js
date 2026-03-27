// Composant loader pour états asynchrones.
export function Spinner() {
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', 'Chargement');
  return spinner;
}
