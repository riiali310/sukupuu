const state = {
  people: [],
  byId: new Map(),
  childrenByParent: new Map(),
  roots: [],
  expanded: new Set(),
  selectedId: null,
  search: '',
  generation: '',
  rootId: '',
  issuesOnly: false,
  matchingIds: new Set(),
  visibleIds: new Set(),
};

const els = {
  loading: document.getElementById('loading'),
  tree: document.getElementById('tree'),
  details: document.getElementById('details'),
  search: document.getElementById('search'),
  generationFilter: document.getElementById('generationFilter'),
  rootSelect: document.getElementById('rootSelect'),
  stats: document.getElementById('stats'),
  expandAll: document.getElementById('expandAll'),
  collapseAll: document.getElementById('collapseAll'),
  showIssues: document.getElementById('showIssues'),
  reset: document.getElementById('reset'),
};

init();

async function init() {
  bindEvents();
  try {
    const response = await fetch('henkilot.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.people = Array.isArray(data) ? data : (data.henkilot || []);
    prepareData();
    populateControls();
    render();
  } catch (error) {
    els.loading.innerHTML = `<div class="errorBox"><strong>Dataa ei saatu ladattua.</strong><br>${escapeHtml(error.message)}<br><br>Avaa sivu paikallisen palvelimen kautta, esimerkiksi <code>python3 -m http.server 8000</code>. Pelkkä tiedoston tuplaklikkaus voi estää JSONin latauksen.</div>`;
  }
}

function bindEvents() {
  els.search.addEventListener('input', () => {
    state.search = els.search.value.trim().toLowerCase();
    updateMatchesAndExpansion();
    render();
  });

  els.generationFilter.addEventListener('change', () => {
    state.generation = els.generationFilter.value;
    updateMatchesAndExpansion();
    render();
  });

  els.rootSelect.addEventListener('change', () => {
    state.rootId = els.rootSelect.value;
    if (state.rootId) expandPathTo(state.rootId);
    render();
  });

  els.expandAll.addEventListener('click', () => {
    state.people.forEach(person => state.expanded.add(person.id));
    render();
  });

  els.collapseAll.addEventListener('click', () => {
    state.expanded.clear();
    if (state.selectedId) expandPathTo(state.selectedId);
    render();
  });

  els.showIssues.addEventListener('click', () => {
    state.issuesOnly = !state.issuesOnly;
    els.showIssues.textContent = state.issuesOnly ? 'Näytä kaikki' : 'Näytä tarkistettavat';
    updateMatchesAndExpansion();
    render();
  });

  els.reset.addEventListener('click', () => {
    state.search = '';
    state.generation = '';
    state.rootId = '';
    state.issuesOnly = false;
    state.matchingIds.clear();
    state.visibleIds.clear();
    state.expanded.clear();
    state.selectedId = null;
    els.search.value = '';
    els.generationFilter.value = '';
    els.rootSelect.value = '';
    els.showIssues.textContent = 'Näytä tarkistettavat';
    renderDetails(null);
    render();
  });
}

function prepareData() {
  state.byId = new Map(state.people.map(person => [person.id, person]));
  state.childrenByParent = new Map();

  for (const person of state.people) {
    if (person.vanhempi_id && state.byId.has(person.vanhempi_id)) {
      if (!state.childrenByParent.has(person.vanhempi_id)) state.childrenByParent.set(person.vanhempi_id, []);
      state.childrenByParent.get(person.vanhempi_id).push(person);
    }
  }

  for (const children of state.childrenByParent.values()) {
    children.sort(comparePeople);
  }

  state.roots = state.people
    .filter(person => !person.vanhempi_id || !state.byId.has(person.vanhempi_id))
    .sort(comparePeople);

  for (const root of state.roots) state.expanded.add(root.id);
}

function populateControls() {
  const generations = [...new Set(state.people.map(p => p.sukupolvi).filter(Boolean))].sort(compareRoman);
  for (const generation of generations) {
    const option = document.createElement('option');
    option.value = generation;
    option.textContent = generation;
    els.generationFilter.appendChild(option);
  }

  for (const root of state.roots) {
    const option = document.createElement('option');
    option.value = root.id;
    option.textContent = `${root.id} ${root.nimi || '(nimetön)'}`;
    els.rootSelect.appendChild(option);
  }
}

function render() {
  els.loading.classList.add('hidden');
  renderStats();
  const roots = state.rootId ? [state.byId.get(state.rootId)].filter(Boolean) : state.roots;
  const ul = document.createElement('ul');
  roots.forEach(root => renderNode(root, ul));
  els.tree.replaceChildren(ul);
}

function renderStats() {
  const issueCount = state.people.filter(hasIssue).length;
  const rootCount = state.roots.length;
  const visibleCount = state.visibleIds.size || state.people.length;
  els.stats.innerHTML = `
    <strong>Tilanne</strong><br>
    Henkilöitä: ${state.people.length}<br>
    Juuria: ${rootCount}<br>
    Näkyvissä: ${visibleCount}<br>
    Tarkistettavia: ${issueCount}
  `;
}

function renderNode(person, container) {
  if (!person || !isVisible(person.id)) return;

  const children = state.childrenByParent.get(person.id) || [];
  const visibleChildren = children.filter(child => isVisible(child.id));
  const li = document.createElement('li');
  li.className = 'node';
  if (state.matchingIds.has(person.id)) li.classList.add('match');

  const row = document.createElement('div');
  row.className = 'nodeRow';

  const toggle = document.createElement('button');
  toggle.className = visibleChildren.length ? 'toggle' : 'toggle empty';
  toggle.type = 'button';
  toggle.textContent = state.expanded.has(person.id) ? '−' : '+';
  toggle.setAttribute('aria-label', state.expanded.has(person.id) ? 'Sulje lapset' : 'Avaa lapset');
  toggle.addEventListener('click', () => {
    if (state.expanded.has(person.id)) state.expanded.delete(person.id);
    else state.expanded.add(person.id);
    render();
  });

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'personButton';
  if (state.selectedId === person.id) button.classList.add('active');
  button.innerHTML = `
    <span class="badge ${hasIssue(person) ? 'issueBadge' : ''}">${escapeHtml(person.id || '?')}</span>
    ${escapeHtml(person.nimi || '(nimetön)')}
    <span class="personMeta">${escapeHtml(summaryLine(person, visibleChildren.length))}</span>
  `;
  button.addEventListener('click', () => {
    state.selectedId = person.id;
    state.expanded.add(person.id);
    renderDetails(person);
    render();
  });

  row.append(toggle, button);
  li.appendChild(row);

  if (visibleChildren.length && state.expanded.has(person.id)) {
    const childUl = document.createElement('ul');
    visibleChildren.forEach(child => renderNode(child, childUl));
    li.appendChild(childUl);
  }

  container.appendChild(li);
}

function renderDetails(person) {
  if (!person) {
    els.details.innerHTML = '<h2>Henkilön tiedot</h2><p class="muted">Valitse henkilö puusta.</p>';
    return;
  }

  const children = state.childrenByParent.get(person.id) || [];
  const parent = person.vanhempi_id ? state.byId.get(person.vanhempi_id) : null;
  const fields = [
    ['ID', person.id],
    ['Sukupolvi', person.sukupolvi],
    ['Nimi', person.nimi],
    ['Sukunimi', person.sukunimi],
    ['Syntymä', joinDatePlace(person.syntyma, person.syntymapaikka)],
    ['Kuolema', person.kuolema],
    ['Vihitty', person.vihitty],
    ['Puoliso', person.puoliso],
    ['Paikat', person.paikat],
    ['Huomiot', person.huomiot],
    ['Vanhempi', parent ? `${parent.id} ${parent.nimi || ''}` : person.vanhempi_id],
    ['Lapsia', children.length ? String(children.length) : ''],
    ['Lähde', person.lahde],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');

  const issueHtml = hasIssue(person) ? `<div class="issueBox">Tässä henkilössä on tarkistushuomio tai epävarma kohta. Hyvä että se näkyy, eikä piileskele nurkissa.</div>` : '';
  const editHref = `editor.html?id=${encodeURIComponent(person.id)}`;

  els.details.innerHTML = `
    <h2>${escapeHtml(person.nimi || '(nimetön)')}</h2>
    ${issueHtml}
    ${fields.map(([label, value]) => `<div class="field"><strong>${escapeHtml(label)}</strong>${escapeHtml(String(value))}</div>`).join('')}
    <p style="margin-top:14px"><a href="${editHref}">Avaa editorissa</a></p>
  `;
}

function updateMatchesAndExpansion() {
  state.matchingIds.clear();
  state.visibleIds.clear();
  const hasSearch = state.search.length > 0;

  for (const person of state.people) {
    const textMatch = !hasSearch || personToText(person).includes(state.search);
    const generationMatch = !state.generation || person.sukupolvi === state.generation;
    const issueMatch = !state.issuesOnly || hasIssue(person);
    if (textMatch && generationMatch && issueMatch) {
      state.matchingIds.add(person.id);
      addPathAndDescendants(person.id);
    }
  }

  if (!hasSearch && !state.generation && !state.issuesOnly) {
    state.visibleIds.clear();
  }
}

function addPathAndDescendants(id) {
  // Näytä osuma, sen esivanhemmat ja välittömät lapset.
  // Ilman esivanhempia syvällä oleva tarkistettava henkilö jää kokonaan piiloon,
  // koska puu renderöidään juurista alaspäin.
  let current = state.byId.get(id);
  while (current) {
    state.visibleIds.add(current.id);
    state.expanded.add(current.id);
    current = current.vanhempi_id ? state.byId.get(current.vanhempi_id) : null;
  }

  for (const child of state.childrenByParent.get(id) || []) {
    state.visibleIds.add(child.id);
  }
}

function expandPathTo(id) {
  let current = state.byId.get(id);
  while (current) {
    state.expanded.add(current.id);
    current = current.vanhempi_id ? state.byId.get(current.vanhempi_id) : null;
  }
}

function isVisible(id) {
  return state.visibleIds.size === 0 || state.visibleIds.has(id);
}

function hasIssue(person) {
  const text = [person.huomiot, person.paikat, person.puoliso].filter(Boolean).join(' ').toLowerCase();
  return /(tarkista|epäsel|mahd|jatkuu|täydennä|puuttuu|\?)/i.test(text);
}

function personToText(person) {
  return [person.id, person.sukupolvi, person.nimi, person.sukunimi, person.syntyma, person.kuolema, person.puoliso, person.paikat, person.huomiot, person.lahde]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function summaryLine(person, childCount) {
  const dates = [person.syntyma ? `s. ${person.syntyma}` : '', person.kuolema ? `k. ${person.kuolema}` : ''].filter(Boolean).join(' · ');
  const spouse = person.puoliso ? 'puoliso merkitty' : '';
  const children = childCount ? `${childCount} lasta` : '';
  return [person.sukupolvi, dates, person.syntymapaikka, spouse, children].filter(Boolean).join(' · ');
}

function joinDatePlace(date, place) {
  return [date, place].filter(Boolean).join(', ');
}

function comparePeople(a, b) {
  const gen = compareRoman(a.sukupolvi || '', b.sukupolvi || '');
  if (gen !== 0) return gen;
  return parseBoxNumber(a.id) - parseBoxNumber(b.id) || String(a.id).localeCompare(String(b.id), 'fi');
}

function parseBoxNumber(id) {
  const match = String(id || '').match(/-(\d+)/);
  return match ? Number(match[1]) : 9999;
}

function compareRoman(a, b) {
  return romanToNumber(a) - romanToNumber(b) || String(a).localeCompare(String(b), 'fi');
}

function romanToNumber(value) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  const str = String(value || '').toUpperCase();
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    const current = map[str[i]] || 0;
    const next = map[str[i + 1]] || 0;
    total += current < next ? -current : current;
  }
  return total || 999;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
