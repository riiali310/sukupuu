const STORAGE_KEY = "riiali_henkilot_editor_v1";
const fields = ["id","sukupolvi","nimi","sukunimi","syntyma","syntymapaikka","kuolema","vihitty","puoliso","paikat","vanhempi_id","lahde","huomiot"];
let db = { _meta: {}, henkilot: [] };
let selectedId = null;

const $ = (id) => document.getElementById(id);

function romanSort(v) {
  const map = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10, XI:11 };
  return map[v] || 999;
}
function boxNumber(id) {
  const m = String(id || "").match(/-(\d+)/);
  return m ? Number(m[1]) : 99999;
}
function sortPeople(a, b) {
  return romanSort(a.sukupolvi) - romanSort(b.sukupolvi) || boxNumber(a.id) - boxNumber(b.id) || String(a.id).localeCompare(String(b.id));
}
function cleanPerson(p) {
  const out = {};
  for (const key of fields) {
    const val = p[key];
    if (val !== undefined && val !== null && String(val).trim() !== "") out[key] = String(val).trim();
  }
  if (p.lapset_ids && Array.isArray(p.lapset_ids) && p.lapset_ids.length) out.lapset_ids = p.lapset_ids;
  return out;
}
function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
async function loadData() {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    db = JSON.parse(local);
    render();
    return;
  }
  try {
    const res = await fetch("henkilot.json", { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    db = await res.json();
  } catch (err) {
    db = { _meta: { huomio: "Aineistoa ei voitu ladata automaattisesti. Tuo JSON tiedostovalitsimella." }, henkilot: [] };
  }
  render();
}
function validate() {
  const people = db.henkilot || [];
  const ids = new Map();
  const duplicateIds = [];
  for (const p of people) {
    if (!p.id) continue;
    if (ids.has(p.id)) duplicateIds.push(p.id);
    ids.set(p.id, p);
  }
  const missingParents = people.filter(p => p.vanhempi_id && !ids.has(p.vanhempi_id)).map(p => `${p.id} -> ${p.vanhempi_id}`);
  const noSource = people.filter(p => !p.lahde).map(p => p.id || p.nimi || "tuntematon");
  const dateKeys = ["syntyma", "kuolema", "vihitty"];
  const badDates = [];
  for (const p of people) {
    for (const k of dateKeys) {
      if (p[k] && !/^\d{4}(-\d{2}){0,2}$/.test(String(p[k]))) badDates.push(`${p.id} ${k}: ${p[k]}`);
    }
  }
  const issueWords = /(tarkista|epäselv|mahd|jatkuu|puuttuu|\?)/i;
  const notes = people.filter(p => issueWords.test([p.huomiot, p.paikat, p.puoliso].filter(Boolean).join(" "))).map(p => p.id);
  return { duplicateIds, missingParents, noSource, badDates, notes };
}
function personHasIssue(p, issues) {
  return issues.notes.includes(p.id) || issues.noSource.includes(p.id) || issues.missingParents.some(x => x.startsWith(`${p.id} ->`)) || issues.duplicateIds.includes(p.id);
}
function filteredPeople() {
  const q = $("search").value.trim().toLowerCase();
  const gen = $("generationFilter").value;
  const issue = $("issueFilter").value;
  const issues = validate();
  return [...(db.henkilot || [])].sort(sortPeople).filter(p => {
    const hay = fields.map(k => p[k] || "").join(" ").toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (gen && p.sukupolvi !== gen) return false;
    if (issue === "issues" && !personHasIssue(p, issues)) return false;
    if (issue === "missingParent" && !issues.missingParents.some(x => x.startsWith(`${p.id} ->`))) return false;
    if (issue === "noSource" && p.lahde) return false;
    return true;
  });
}
function renderGenerationFilter() {
  const current = $("generationFilter").value;
  const gens = [...new Set((db.henkilot || []).map(p => p.sukupolvi).filter(Boolean))].sort((a,b) => romanSort(a)-romanSort(b));
  $("generationFilter").innerHTML = '<option value="">Kaikki sukupolvet</option>' + gens.map(g => `<option value="${g}">${g}</option>`).join("");
  $("generationFilter").value = current;
}
function renderValidation() {
  const v = validate();
  const hard = v.duplicateIds.length + v.missingParents.length + v.badDates.length;
  const html = [];
  html.push(`<h3>QA <span class="badge ${hard ? 'bad' : 'ok'}">${hard ? hard + ' kovaa huomiota' : 'ei kovia virheitä'}</span> <span class="badge ${v.notes.length ? 'warn' : 'ok'}">${v.notes.length} tarkistettavaa</span></h3>`);
  const rows = [];
  if (v.duplicateIds.length) rows.push(`<li>Duplikaatti-ID:t: ${v.duplicateIds.slice(0,20).join(", ")}</li>`);
  if (v.missingParents.length) rows.push(`<li>Rikkinäiset vanhempi_id-linkit: ${v.missingParents.slice(0,20).join(", ")}</li>`);
  if (v.noSource.length) rows.push(`<li>Puuttuva lähde: ${v.noSource.slice(0,20).join(", ")}</li>`);
  if (v.badDates.length) rows.push(`<li>Epäilyttävät päivämäärät: ${v.badDates.slice(0,20).join(", ")}</li>`);
  if (v.notes.length) rows.push(`<li>Huomiokentissä tarkistettavaa: ${v.notes.slice(0,30).join(", ")}</li>`);
  html.push(rows.length ? `<ul>${rows.join("")}</ul>` : `<p class="small">Perustarkistus näyttää hyvältä. Ei silti kruunata itseämme vielä kuninkaaksi, käsialat pitää lopulta katsoa lähteistä.</p>`);
  $("validation").innerHTML = html.join("");
}
function renderList() {
  const people = filteredPeople();
  $("personList").innerHTML = people.map(p => `
    <button class="person-item ${p.id === selectedId ? 'active' : ''}" data-id="${escapeHtml(p.id || '')}">
      <span class="person-id">${escapeHtml(p.id || '?')}</span>
      <span><strong>${escapeHtml(p.nimi || '(nimetön)')}</strong><div class="person-meta">${escapeHtml([p.syntyma, p.kuolema ? 'k. ' + p.kuolema : '', p.lahde].filter(Boolean).join(' · '))}</div></span>
    </button>`).join("");
  $("stats").textContent = `Näytetään ${people.length} / ${(db.henkilot || []).length} henkilöä. Muutokset: ${localStorage.getItem(STORAGE_KEY) ? 'selaimessa tallessa' : 'ei paikallisia muutoksia'}.`;
}
function renderEditor() {
  const person = (db.henkilot || []).find(p => p.id === selectedId);
  const form = $("personForm");
  if (!person) {
    form.classList.add("hidden");
    $("emptyHelp").classList.remove("hidden");
    $("editorTitle").textContent = "Valitse henkilö";
    $("duplicatePerson").disabled = true;
    $("deletePerson").disabled = true;
    return;
  }
  form.classList.remove("hidden");
  $("emptyHelp").classList.add("hidden");
  $("editorTitle").textContent = `${person.id} ${person.nimi || ''}`;
  for (const key of fields) form.elements[key].value = person[key] || "";
  $("duplicatePerson").disabled = false;
  $("deletePerson").disabled = false;
}
function render() {
  renderGenerationFilter();
  renderValidation();
  renderList();
  renderEditor();
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
}
function download(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function nextIdForGeneration(gen) {
  const nums = (db.henkilot || []).filter(p => p.sukupolvi === gen).map(p => boxNumber(p.id)).filter(n => Number.isFinite(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${gen}-${next}`;
}
function toCsv() {
  const cols = fields;
  const lines = [cols.join(",")];
  for (const p of [...(db.henkilot || [])].sort(sortPeople)) {
    lines.push(cols.map(c => `"${String(p[c] || "").replaceAll('"','""')}"`).join(","));
  }
  return lines.join("\n");
}

$("personList").addEventListener("click", e => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  selectedId = btn.dataset.id;
  render();
});
for (const id of ["search", "generationFilter", "issueFilter"]) $(id).addEventListener("input", render);
$("personForm").addEventListener("submit", e => {
  e.preventDefault();
  const oldId = selectedId;
  const raw = Object.fromEntries(new FormData(e.target).entries());
  const person = cleanPerson(raw);
  const idx = db.henkilot.findIndex(p => p.id === oldId);
  if (idx >= 0) db.henkilot[idx] = person;
  if (oldId !== person.id) {
    for (const p of db.henkilot) if (p.vanhempi_id === oldId) p.vanhempi_id = person.id;
  }
  selectedId = person.id;
  saveLocal();
  render();
});
$("addPerson").addEventListener("click", () => {
  const gen = $("generationFilter").value || "VIII";
  const p = { id: nextIdForGeneration(gen), sukupolvi: gen, nimi: "Uusi henkilö", lahde: "lisätty_editorissa" };
  db.henkilot.push(p);
  selectedId = p.id;
  saveLocal();
  render();
});
$("duplicatePerson").addEventListener("click", () => {
  const p = db.henkilot.find(x => x.id === selectedId);
  if (!p) return;
  const copy = { ...p, id: nextIdForGeneration(p.sukupolvi || "VIII"), nimi: `${p.nimi || ''} kopio`.trim() };
  db.henkilot.push(copy);
  selectedId = copy.id;
  saveLocal();
  render();
});
$("deletePerson").addEventListener("click", () => {
  if (!selectedId) return;
  const children = db.henkilot.filter(p => p.vanhempi_id === selectedId).map(p => p.id);
  const msg = children.length ? `Tällä henkilöllä on lapsia: ${children.join(", ")}. Poistetaanko silti?` : "Poistetaanko valittu henkilö?";
  if (!confirm(msg)) return;
  db.henkilot = db.henkilot.filter(p => p.id !== selectedId);
  selectedId = null;
  saveLocal();
  render();
});
$("clearSelection").addEventListener("click", () => { selectedId = null; render(); });
$("exportJson").addEventListener("click", () => {
  const out = { ...db, henkilot: [...(db.henkilot || [])].map(cleanPerson).sort(sortPeople) };
  download("henkilot.json", JSON.stringify(out, null, 2) + "\n");
});
$("exportCsv").addEventListener("click", () => download("henkilot.csv", toCsv(), "text/csv"));
$("resetLocal").addEventListener("click", () => {
  if (!confirm("Poistetaanko selaimeen tallennetut muutokset ja ladataanko alkuperäinen henkilot.json uudestaan?")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});
$("importJson").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    db = JSON.parse(reader.result);
    selectedId = null;
    saveLocal();
    render();
  };
  reader.readAsText(file);
});

loadData();
