/*
 * LexiconDB: a very small read-only "database" over two JSON tables.
 *
 *   data/topics.json   one row per topic:  { id, name, blurb, section, order }
 *   data/entries.json  one row per item:   { id, topic, type, term, pos, meaning, example, fromGuide }
 *
 * entries.topic is a foreign key to topics.id.
 * type is "word" | "collocation" | "idiom".
 * In example sentences, {braces} mark the target phrase.
 *
 * To add vocabulary, add rows to entries.json (ids must be unique); no code changes needed.
 */
const LexiconDB = (() => {
  const TYPES = ["word", "collocation", "idiom"];
  let topics = [];
  let entries = [];
  let topicById = new Map();
  let entryById = new Map();

  async function fetchTable(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status})`);
    return res.json();
  }

  // Light integrity checks, so a typo in the JSON shows up as a clear console warning.
  function validate() {
    const seen = new Set();
    entries = entries.filter(e => {
      const problem =
        !e.id ? "missing id" :
        seen.has(e.id) ? "duplicate id" :
        !topicById.has(e.topic) ? `unknown topic "${e.topic}"` :
        !TYPES.includes(e.type) ? `unknown type "${e.type}"` :
        !e.term || !e.meaning || !e.example ? "missing term, meaning or example" : null;
      if (problem) { console.warn(`LexiconDB: skipped entry (${problem})`, e); return false; }
      seen.add(e.id);
      return true;
    });
  }

  async function load(baseUrl = "data/") {
    const [t, e] = await Promise.all([
      fetchTable(baseUrl + "topics.json"),
      fetchTable(baseUrl + "entries.json"),
    ]);
    topics = t.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    topicById = new Map(topics.map(x => [x.id, x]));
    entries = e;
    validate();
    entryById = new Map(entries.map(x => [x.id, x]));
    return { topics: topics.length, entries: entries.length };
  }

  /*
   * query({ topic, section, type, fromGuide, search })
   * Every field is optional; the conditions are combined with AND.
   *   topic     topic id
   *   section   "topic" | "cross-topic"
   *   type      "word" | "collocation" | "idiom"
   *   fromGuide true to keep only guide items
   *   search    case-insensitive text matched against term, meaning and example
   */
  function query(where = {}) {
    const s = (where.search || "").trim().toLowerCase();
    return entries.filter(e =>
      (!where.topic || e.topic === where.topic) &&
      (!where.section || topicById.get(e.topic).section === where.section) &&
      (!where.type || e.type === where.type) &&
      (!where.fromGuide || e.fromGuide) &&
      (!s || e.term.toLowerCase().includes(s) ||
             e.meaning.toLowerCase().includes(s) ||
             e.example.replace(/[{}]/g, "").toLowerCase().includes(s))
    );
  }

  return {
    TYPES,
    load,
    query,
    topics: (section) => section ? topics.filter(t => t.section === section) : topics.slice(),
    topic: (id) => topicById.get(id),
    entry: (id) => entryById.get(id),
    all: () => entries.slice(),
  };
})();
