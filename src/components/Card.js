// Composant micro-card de type cartel musée avec case à cocher par œuvre.
export function Card({ record, selected = false, onToggle }) {
  const fields = record.fields || {};

  const card = document.createElement('article');
  card.className = 'card card--micro';

  const head = document.createElement('div');
  head.className = 'card__head';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = selected;
  checkbox.addEventListener('change', () => onToggle(record.recordid, checkbox.checked));

  const title = document.createElement('h3');
  title.textContent = fields.titre || fields.denomination || 'Sans titre';

  head.append(checkbox, title);

  const line1 = document.createElement('p');
  line1.textContent = `${fields.auteur || 'Auteur inconnu'} • ${fields.datation || 'Date inconnue'}`;

  const line2 = document.createElement('p');
  line2.textContent = `${fields.lieu_conservation || 'Lieu inconnu'} • ${
    fields.domaine || 'Domaine non renseigné'
  }`;

  const line3 = document.createElement('p');
  line3.textContent = fields.materiaux_techniques || 'Matériaux/techniques non renseignés';

  card.append(head, line1, line2, line3);
  return card;
}
