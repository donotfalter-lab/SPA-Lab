# Wordly - Interactive Dictionary SPA

Wordly is a single-page application (SPA) that lets users search for a word and instantly see its pronunciation, definitions, synonyms, and antonyms, all on one page with no reloads. Built for Wordly, an online language learning platform, as an interactive dictionary feature.

## Features

- **Search functionality** - type any English word into the search bar and submit to look it up.
- **Definitions and parts of speech** - results are grouped by part of speech (noun, verb, adjective, etc.), with example sentences shown where available.
- **Synonyms and antonyms** - displayed alongside each meaning when the API provides them.
- **Audio pronunciation** - a play button lets users hear the word pronounced, when an audio clip is available.
- **Save words** - save a word to a running list for quick access later; click a saved word to look it up again.
- **Light/dark theme toggle** - switch the page's theme with one click.
- **Error handling** - clear messages for empty searches, words not found (404), other API errors, and request timeouts, with the error automatically clearing once the user starts a new search.
- **Loading indicator** - a spinner shows while a search is in progress, and the form disables briefly to prevent duplicate submissions.
- **Responsive design** - layout adapts for smaller screens.

## Technologies Used

- HTML5 (semantic elements, ARIA attributes for accessibility)
- CSS3 (flexbox layout, transitions/animations, dark theme, responsive media queries)
- JavaScript (ES6+, `fetch`, `async`/`await`, DOM manipulation, event listeners)

## API

This project uses the [Free Dictionary API](https://dictionaryapi.dev/):

```
GET https://api.dictionaryapi.dev/api/v2/entries/en/<word>
```

No API key is required.

## Project Structure

```
.
├── index.html   # Page structure and markup
├── style.css    # Styling, animations, theming, responsive layout
├── index.js     # Fetch logic, DOM rendering, and event handling
└── README.md
```

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in a browser (or serve it locally, e.g. with the VS Code "Live Server" extension).
3. Type a word into the search bar and click **Search** (or press Enter).

No build step, package installation, or server is required, this is a static site that runs entirely in the browser.

## Usage Notes

- Not every word returns a phonetic spelling or audio clip, as this depends on what the API's underlying data source has available. The audio button only appears when a clip exists.
- Saved words are kept in memory for the current session only; refreshing the page clears the saved list.

## Author

Built as part of a Software Engineering summative lab on Single Page Applications.