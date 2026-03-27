// Composant bouton primaire réutilisable.
export function Button({ label, onClick, disabled = false, className = '' }) {
  const button = document.createElement('button');
  button.className = `button button--primary ${className}`.trim();
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
}
