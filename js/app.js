/* IELTS Topic Lexicon: page logic. All words and idioms come from LexiconDB (js/db.js). */

const TYPE_LABEL = { word: "Vocabulary", collocation: "Collocations", idiom: "Idioms" };
const TYPE_ONE = { word: "Word", collocation: "Collocation", idiom: "Idiom" };
const TYPE_SUB = { word: "Precise single words and compounds", collocation: "Natural word partnerships", idiom: "Informal, for Speaking" };

// ---- Learned progress (browser localStorage) ----
const KEY = "ielts-lexicon-learned-v1";
let learned = new Set();
try { learned = new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) {}
function saveLearned() { try { localStorage.setItem(KEY, JSON.stringify([...learned])); } catch (e) {} }

// ---- UI state ----
const S = { topic: "education", tab: "all", mode: "study", guideOnly: false, hideLearned: false, q: "", fc: { deck: [], i: 0, flip: false }, quiz: null };

// ---- Helpers ----
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const exHTML = s => esc(s).replace(/\{(.+?)\}/g, "<mark>$1</mark>");
const exPlain = s => s.replace(/[{}]/g, "");
const target = s => (s.match(/\{(.+?)\}/) || [, ""])[1];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const topicName = it => LexiconDB.topic(it.topic).name;

// Items for the current topic/search, before or after the type/guide/learned filters.
function baseItems() {
  if (S.q.trim()) return LexiconDB.query({ search: S.q });
  if (S.topic === "all") return LexiconDB.all();
  if (S.topic === "guide") return LexiconDB.query({ fromGuide: true });
  return LexiconDB.query({ topic: S.topic });
}
function currentItems() {
  let list = baseItems();
  if (S.tab !== "all") list = list.filter(i => i.type === S.tab);
  if (S.guideOnly) list = list.filter(i => i.fromGuide);
  if (S.hideLearned) list = list.filter(i => !learned.has(i.id));
  return list;
}

function speak(text) {
  try { const u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; u.rate = .95; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
}

// ---- Rendering ----
function renderRail() {
  const all = LexiconDB.all();
  const done = all.filter(i => learned.has(i.id)).length;
  const btn = (id, name, items) => {
    const d = items.filter(i => learned.has(i.id)).length;
    const cur = !S.q && S.topic === id;
    return `<button class="topic-btn" data-topic="${id}" aria-current="${cur}"><span>${esc(name)}</span><span class="cnt">${d}/${items.length}</span><span class="bar"><i style="width:${items.length ? d / items.length * 100 : 0}%"></i></span></button>`;
  };
  const topicBtns = section => LexiconDB.topics(section).map(t => btn(t.id, t.name, LexiconDB.query({ topic: t.id }))).join("");
  document.getElementById("rail").innerHTML =
    `<div class="overall"><div class="num">${done} <span style="font-size:15px;color:var(--muted);font-weight:500">/ ${all.length}</span></div><div class="lbl">items marked learned</div></div>` +
    `<div class="rail-h">Topics</div>` + topicBtns("topic") +
    `<div class="rail-h">Cross-topic</div>` + topicBtns("cross-topic") +
    btn("guide", "From your guide only", LexiconDB.query({ fromGuide: true })) +
    btn("all", "All topics", all);
}

function headHTML() {
  let title, blurb;
  if (S.q.trim()) { title = `Search: “${esc(S.q.trim())}”`; blurb = "Matches across every topic, by term, meaning or example."; }
  else if (S.topic === "all") { title = "All topics"; blurb = "Every word, collocation and idiom in the lexicon."; }
  else if (S.topic === "guide") { title = "From your guide"; blurb = "All the collocations from your Collocations in Use Advanced guide, each with an IELTS-style example sentence."; }
  else { const t = LexiconDB.topic(S.topic); title = esc(t.name); blurb = esc(t.blurb); }
  const base = baseItems();
  const n = t => t === "all" ? base.length : base.filter(i => i.type === t).length;
  const tabs = ["all", ...LexiconDB.TYPES].map(t => `<button data-tab="${t}" aria-pressed="${S.tab === t}">${t === "all" ? "All" : TYPE_LABEL[t]}<span class="n">${n(t)}</span></button>`).join("");
  return `<div class="t-head"><h2>${title}</h2></div><p class="t-blurb">${blurb}</p>
  <div class="tip"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="flex:none;margin-top:2px;color:var(--accent)"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>
  <div><b>Where to use what.</b> Collocations and precise vocabulary lift your Lexical Resource score in both Writing and Speaking. Keep idioms for Speaking, and use one only where it fits naturally; examiners mark down idioms forced into Task 2 essays.</div></div>
  <div class="controls"><div class="tabs" role="group" aria-label="Item type">${tabs}</div>
  <label class="toggle" for="f-guide"><input type="checkbox" id="f-guide" ${S.guideOnly ? "checked" : ""}>From my guide only</label>
  <label class="toggle" for="f-hide"><input type="checkbox" id="f-hide" ${S.hideLearned ? "checked" : ""}>Hide learned</label></div>`;
}

const ICON_SPK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>`;
const ICON_CHK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>`;

function cardHTML(it, showTopic) {
  const L = learned.has(it.id);
  const badges = [];
  if (it.fromGuide) badges.push(`<span class="badge g" title="From your Collocations in Use guide">Your guide</span>`);
  if (it.type === "idiom") badges.push(`<span class="badge s">Speaking</span>`);
  return `<article class="card${L ? " learned" : ""}">
    <div class="card-top"><div class="term">${esc(it.term)}${it.pos ? `<span class="pos">${esc(it.pos)}</span>` : ""}</div><div class="badges">${badges.join("")}</div></div>
    <div class="meaning">${esc(it.meaning)}</div>
    <div class="ex">${exHTML(it.example)}</div>
    <div class="card-foot"><span class="topic-tag">${showTopic ? esc(topicName(it)) + " · " : ""}${TYPE_ONE[it.type]}</span>
    <span><button class="icon-btn" data-speak="${it.id}" aria-label="Hear ${esc(it.term)}">${ICON_SPK}Listen</button>
    <button class="icon-btn learn-btn" data-learn="${it.id}" aria-pressed="${L}">${ICON_CHK}${L ? "Learned" : "Mark learned"}</button></span></div>
  </article>`;
}

function renderStudy() {
  const list = currentItems();
  const multi = S.q.trim() || S.topic === "all" || S.topic === "guide";
  if (!list.length) return `<div class="empty">Nothing matches these filters. Try switching off “Hide learned” or “From my guide only”.</div>`;
  return LexiconDB.TYPES.map(t => {
    const g = list.filter(i => i.type === t); if (!g.length) return "";
    return `<h3 class="sec-h">${TYPE_LABEL[t]} <small>${g.length} · ${TYPE_SUB[t]}</small></h3><div class="grid">${g.map(i => cardHTML(i, multi)).join("")}</div>`;
  }).join("");
}

function buildDeck() { S.fc = { deck: shuffle(currentItems()), i: 0, flip: false }; }
function renderCards() {
  const { deck, i, flip } = S.fc;
  if (!deck.length) return `<div class="empty">No cards here. Change the filters above to build a deck.</div>`;
  const it = deck[Math.min(i, deck.length - 1)];
  const L = learned.has(it.id);
  return `<div class="fc-wrap">
    <div class="fc-meta"><span>Card ${i + 1} of ${deck.length}</span><span>${esc(topicName(it))} · ${TYPE_ONE[it.type]}${it.fromGuide ? " · from your guide" : ""}</span></div>
    <div class="fc" id="fc" role="button" tabindex="0" aria-label="Flip card">
      <div class="term">${esc(it.term)}${it.pos ? ` <span class="pos">${esc(it.pos)}</span>` : ""}</div>
      ${flip ? `<div class="meaning">${esc(it.meaning)}</div><div class="ex">${exHTML(it.example)}</div>` : `<div class="hint">Say what it means and use it in a sentence, then flip (Space)</div>`}
    </div>
    <div class="row">
      <button class="btn" id="fc-prev">← Previous</button>
      <button class="btn primary" id="fc-flip">${flip ? "Hide answer" : "Show answer"}</button>
      <button class="btn ${L ? "" : "ok"}" id="fc-know">${L ? "Unmark" : "I know this"}</button>
      <button class="btn" id="fc-next">Next →</button>
    </div>
    <div class="row"><button class="icon-btn" data-speak="${it.id}">${ICON_SPK}Listen</button><button class="icon-btn" id="fc-shuffle">Shuffle deck</button></div>
  </div>`;
}

function buildQuiz() {
  const pool = currentItems().filter(i => target(i.example));
  const qs = shuffle(pool).slice(0, 10).map(it => {
    const ans = target(it.example);
    let others = shuffle(pool.filter(o => o.type === it.type && o.id !== it.id).map(o => target(o.example)));
    if (others.length < 3) others = others.concat(shuffle(LexiconDB.query({ type: it.type }).filter(o => o.id !== it.id).map(o => target(o.example))));
    const opts = shuffle([ans, ...[...new Set(others.filter(o => o.toLowerCase() !== ans.toLowerCase()))].slice(0, 3)]);
    return { it, ans, opts, picked: null };
  });
  S.quiz = { qs, i: 0, score: 0 };
}
function renderQuiz() {
  const Q = S.quiz;
  if (!Q || !Q.qs.length) return `<div class="empty">Not enough items for a quiz with these filters.</div>`;
  if (Q.i >= Q.qs.length) {
    const missed = Q.qs.filter(q => q.picked !== q.ans);
    return `<div class="qz"><div class="qz-card" style="text-align:center;align-items:center">
      <div class="score">${Q.score}/${Q.qs.length}</div>
      <div class="fb">${Q.score === Q.qs.length ? "Perfect round. Every answer correct." : Q.score >= 7 ? "Strong result. Review the ones you missed below." : "Keep going. Study the missed items, then try a new round."}</div>
      <div class="row"><button class="btn primary" id="qz-new">New quiz</button></div></div>
      ${missed.length ? `<h3 class="sec-h">To review</h3><div class="missed">${missed.map(q => `<div><b>${esc(q.it.term)}</b>: ${esc(q.it.meaning)}<br><span class="ex">${exHTML(q.it.example)}</span></div>`).join("")}</div>` : ""}
    </div>`;
  }
  const q = Q.qs[Q.i];
  const sentence = esc(q.it.example).replace(/\{(.+?)\}/, () => `<span class="blank">${q.picked ? esc(q.ans) : "&nbsp;"}</span>`);
  return `<div class="qz"><div class="fc-meta"><span>Question ${Q.i + 1} of ${Q.qs.length}</span><span>Score ${Q.score}</span></div>
  <div class="qz-progress"><i style="width:${Q.i / Q.qs.length * 100}%"></i></div>
  <div class="qz-card"><div class="fb">Complete the sentence (${TYPE_ONE[q.it.type].toLowerCase()} · ${esc(topicName(q.it))})</div>
  <div class="qz-q">${sentence}</div>
  <div class="opts">${q.opts.map((o, k) => {
    let cls = "opt"; if (q.picked) { if (o === q.ans) cls += " right"; else if (o === q.picked) cls += " wrong"; }
    return `<button class="${cls}" data-opt="${k}" ${q.picked ? "disabled" : ""}>${esc(o)}</button>`;
  }).join("")}</div>
  ${q.picked ? `<div class="fb"><b>${esc(q.it.term)}</b>: ${esc(q.it.meaning)}</div><div class="row" style="justify-content:flex-end"><button class="btn primary" id="qz-next">${Q.i + 1 < Q.qs.length ? "Next question →" : "See results"}</button></div>` : ""}
  </div></div>`;
}

function render() {
  renderRail();
  let body;
  if (S.mode === "study") body = renderStudy();
  else if (S.mode === "cards") body = renderCards();
  else body = renderQuiz();
  document.getElementById("main").innerHTML = headHTML() + body;
  document.querySelectorAll(".modes button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === S.mode));
}
function refreshDerived() { if (S.mode === "cards") buildDeck(); if (S.mode === "quiz") buildQuiz(); }

// ---- Events ----
function bindEvents() {
  document.addEventListener("click", e => {
    const b = e.target.closest("button,[data-topic],#fc"); if (!b) return;
    if (b.dataset.topic) { S.topic = b.dataset.topic; S.q = ""; document.getElementById("q").value = ""; S.tab = "all"; try { history.replaceState(null, "", "#" + S.topic); } catch (_) { location.hash = S.topic; } refreshDerived(); render(); window.scrollTo({ top: 0 }); return; }
    if (b.dataset.mode) { S.mode = b.dataset.mode; refreshDerived(); render(); return; }
    if (b.dataset.tab) { S.tab = b.dataset.tab; refreshDerived(); render(); return; }
    if (b.dataset.speak) { const it = LexiconDB.entry(b.dataset.speak); speak(it.term + ". " + exPlain(it.example)); return; }
    if (b.dataset.learn) { const id = b.dataset.learn; learned.has(id) ? learned.delete(id) : learned.add(id); saveLearned(); render(); return; }
    if (b.id === "fc" || b.id === "fc-flip") { S.fc.flip = !S.fc.flip; render(); return; }
    if (b.id === "fc-next") { S.fc.i = (S.fc.i + 1) % S.fc.deck.length; S.fc.flip = false; render(); return; }
    if (b.id === "fc-prev") { S.fc.i = (S.fc.i - 1 + S.fc.deck.length) % S.fc.deck.length; S.fc.flip = false; render(); return; }
    if (b.id === "fc-know") { const id = S.fc.deck[S.fc.i].id; if (learned.has(id)) learned.delete(id); else { learned.add(id); S.fc.i = (S.fc.i + 1) % S.fc.deck.length; S.fc.flip = false; } saveLearned(); render(); return; }
    if (b.id === "fc-shuffle") { buildDeck(); render(); return; }
    if (b.dataset.opt !== undefined) { const q = S.quiz.qs[S.quiz.i]; if (q.picked) return; q.picked = q.opts[+b.dataset.opt]; if (q.picked === q.ans) S.quiz.score++; render(); return; }
    if (b.id === "qz-next") { S.quiz.i++; render(); return; }
    if (b.id === "qz-new") { buildQuiz(); render(); return; }
  });
  document.addEventListener("change", e => {
    if (e.target.id === "f-guide") { S.guideOnly = e.target.checked; refreshDerived(); render(); }
    if (e.target.id === "f-hide") { S.hideLearned = e.target.checked; refreshDerived(); render(); }
  });
  let qt;
  document.getElementById("q").addEventListener("input", e => { clearTimeout(qt); qt = setTimeout(() => { S.q = e.target.value; refreshDerived(); render(); }, 180); });
  document.addEventListener("keydown", e => {
    if (S.mode !== "cards" || e.target.tagName === "INPUT" || !S.fc.deck.length) return;
    if (e.key === " " || e.key === "Enter") { if (e.target.closest && e.target.closest("button:not(#fc)")) return; e.preventDefault(); S.fc.flip = !S.fc.flip; render(); }
    if (e.key === "ArrowRight") { S.fc.i = (S.fc.i + 1) % S.fc.deck.length; S.fc.flip = false; render(); }
    if (e.key === "ArrowLeft") { S.fc.i = (S.fc.i - 1 + S.fc.deck.length) % S.fc.deck.length; S.fc.flip = false; render(); }
  });
  window.addEventListener("hashchange", fromHash);
}

function fromHash() {
  const h = (location.hash || "").slice(1);
  if (h && (LexiconDB.topic(h) || h === "all" || h === "guide")) { S.topic = h; S.q = ""; refreshDerived(); render(); }
}

// ---- Boot: load the database, then render ----
(async function init() {
  const main = document.getElementById("main");
  main.innerHTML = `<div class="empty">Loading lexicon…</div>`;
  try {
    await LexiconDB.load("data/");
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="empty"><b>Couldn't load the word database.</b><br>
      Browsers block loading data files from a page opened directly from disk (file://).
      Serve this folder instead, e.g. run <code>python -m http.server 8000</code> inside it and open
      <code>http://localhost:8000</code>.<br><small>${esc(String(err.message || err))}</small></div>`;
    return;
  }
  if (!LexiconDB.topic(S.topic)) S.topic = LexiconDB.topics()[0]?.id || "all";
  bindEvents();
  fromHash();
  render();
})();
