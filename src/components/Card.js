// Composant carte pour afficher une œuvre Joconde.
export function Card(record) {
  const fields = record.fields || {};
  const card = document.createElement('article');
  card.className = 'card';

  const title = document.createElement('h3');
  title.textContent = fields.titre || fields.denomination || 'Sans titre';

  const details = document.createElement('p');
  details.textContent = [
    fields.auteur || 'Auteur inconnu',
    fields.datation || 'Date inconnue',
    fields.lieu_conservation || 'Lieu inconnu',
  ].join(' • ');

  card.append(title, details);
  return card;
}
