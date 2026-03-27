// Composant MultiSelect avec recherche et sélection multiple.
export function MultiSelect({ label, options, selectedValues, onChange }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-group';

  const labelEl = document.createElement('label');
  labelEl.className = 'label';
  labelEl.textContent = label;

  const shell = document.createElement('div');
  shell.className = 'multiselect';

  const search = document.createElement('input');
  search.className = 'multiselect__search';
  search.placeholder = 'Rechercher...';

  const optionsList = document.createElement('div');
  optionsList.className = 'multiselect__options';

  const chips = document.createElement('div');
  chips.className = 'multiselect__chips';

  function renderOptions(filterText = '') {
    optionsList.innerHTML = '';

    options
      .filter((opt) => opt.toLowerCase().includes(filterText.toLowerCase()))
      .slice(0, 100)
      .forEach((option) => {
        const row = document.createElement('label');
        row.className = 'multiselect__option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = selectedValues.includes(option);

        checkbox.addEventListener('change', () => {
          const next = checkbox.checked
            ? [...selectedValues, option]
            : selectedValues.filter((item) => item !== option);
          onChange(next);
        });

        const text = document.createElement('span');
        text.textContent = option;

        row.append(checkbox, text);
        optionsList.append(row);
      });
  }

  function renderChips() {
    chips.innerHTML = '';
    if (!selectedValues.length) {
      const none = document.createElement('span');
      none.className = 'empty';
      none.textContent = 'Aucune sélection';
      chips.append(none);
      return;
    }

    selectedValues.forEach((value) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = value;
      chips.append(chip);
    });
  }

  search.addEventListener('input', (event) => renderOptions(event.target.value));

  renderOptions();
  renderChips();

  shell.append(search, optionsList, chips);
  wrapper.append(labelEl, shell);
  return wrapper;
}
