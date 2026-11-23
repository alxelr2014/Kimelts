# IELTS Topic Lexicon

Vocabulary, collocations and idioms by IELTS topic, with Study, Flashcards and Quiz modes.

## Run it

The page loads its words from JSON files, and browsers block that when a page is opened straight from disk. Serve the folder instead, from the project root:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>. You can link straight to a topic, e.g. `http://localhost:8000/#health`, `#guide` or `#all`.

## Files

```text
index.html          page structure
css/styles.css      styles (light and dark themes)
js/db.js            LexiconDB: loads and queries the data
js/app.js           page logic (rendering, flashcards, quiz, progress)
data/topics.json    topics table
data/entries.json   words, collocations and idioms table
```

## The database

**`data/topics.json`**: one row per topic.

| field     | meaning                                                      |
|-----------|--------------------------------------------------------------|
| `id`      | unique key, also used in the URL (`#education`)              |
| `name`    | shown in the sidebar and heading                             |
| `blurb`   | one-line description under the heading                       |
| `section` | `"topic"` or `"cross-topic"` (which sidebar group it's in)   |
| `order`   | sort order in the sidebar                                    |

**`data/entries.json`**: one row per item, one item per line.

| field       | meaning                                                              |
|-------------|----------------------------------------------------------------------|
| `id`        | unique key; used to remember "learned" progress, so don't change it  |
| `topic`     | the `id` of a row in `topics.json`                                   |
| `type`      | `"word"`, `"collocation"` or `"idiom"`                               |
| `term`      | the word or phrase                                                   |
| `pos`       | part of speech for words (`"n."`, `"adj."`…), otherwise `null`       |
| `meaning`   | short definition                                                     |
| `example`   | example sentence; wrap the target phrase in `{braces}`               |
| `fromGuide` | `true` if it comes from your Collocations in Use guide               |

### Adding an item

Add a line to `entries.json` (remember the comma after the previous line):

```json
{"id":"health-v-8","topic":"health","type":"word","term":"immunity","pos":"n.","meaning":"The body's ability to resist disease.","example":"Vaccines build {immunity} against serious illness.","fromGuide":false}
```

Reload the page and it appears. The quiz uses the `{braced}` phrase as the blank, so every example needs one. Rows with an unknown topic, a duplicate id or missing fields are skipped, with a warning in the browser console.

### Adding a topic

Add a row to `topics.json`, then add entries that use its `id` as their `topic`.
