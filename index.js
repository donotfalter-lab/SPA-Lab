const API_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const FETCH_TIMEOUT_MS = 8000;

let savedWords = [];
let currentAudioUrl = "";

// Cached DOM references, filled in once the DOM is ready.
// Keeping these in one place avoids repeated document.getElementById
// calls scattered across every function.
let elements = {};

/**
 * Fetches definition data for a given word from the Free Dictionary API.
 * Normalizes the input, guards against empty searches, times out slow
 * requests, and distinguishes "word not found" from other API/network
 * failures so the user gets an accurate error message either way.
 * @param {string} word - The raw word typed by the user.
 */
async function fetchWordData(word) {
    const normalizedWord = (word || "").trim().toLowerCase();

    if (!normalizedWord) {
        displayError("Please enter a word to search.");
        return;
    }

    setLoadingState(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(
            `${API_BASE_URL}${encodeURIComponent(normalizedWord)}`,
            { signal: controller.signal }
        );

        if (response.status === 404) {
            throw new Error(`No definitions found for "${normalizedWord}". Try checking the spelling.`);
        }

        if (!response.ok) {
            throw new Error(`Something went wrong fetching "${normalizedWord}" (status ${response.status}).`);
        }

        const data = await response.json();
        displayResults(data[0]);
    } catch (error) {
        if (error.name === "AbortError") {
            displayError("The request timed out. Please check your connection and try again.");
        } else {
            displayError(error.message);
        }
    } finally {
        clearTimeout(timeoutId);
        setLoadingState(false);
    }
}

/**
 * Shows or hides the loading indicator and disables the search
 * controls while a request is in flight, so users can't fire off
 * duplicate overlapping searches.
 * @param {boolean} isLoading
 */
function setLoadingState(isLoading) {
    elements.loadingIndicator.classList.toggle("hidden", !isLoading);
    elements.searchButton.disabled = isLoading;
    elements.wordInput.disabled = isLoading;
}

/**
 * Renders a successful API response into the results section:
 * word, phonetic spelling, playable audio (if available), save
 * button, and every meaning/definition/example/synonym/antonym.
 * @param {object} entry - A single dictionary entry object (data[0] from the API).
 */
function displayResults(entry) {
    elements.errorMessage.textContent = "";
    elements.errorMessage.classList.add("hidden");
    elements.meaningsContainer.innerHTML = "";

    elements.resultWord.textContent = entry.word;

    const phoneticWithText = entry.phonetics.find((p) => p.text);
    elements.resultPhonetic.textContent = phoneticWithText ? phoneticWithText.text : "";

    const phoneticWithAudio = entry.phonetics.find((p) => p.audio);
    if (phoneticWithAudio) {
        currentAudioUrl = phoneticWithAudio.audio;
        elements.playAudioButton.classList.remove("hidden");
    } else {
        currentAudioUrl = "";
        elements.playAudioButton.classList.add("hidden");
    }

    elements.saveWordButton.classList.remove("hidden");
    elements.saveWordButton.dataset.word = entry.word;
    updateSaveButtonState(entry.word);

    entry.meanings.forEach((meaning) => {
        elements.meaningsContainer.append(buildMeaningBlock(meaning));
    });

    elements.resultsSection.classList.remove("hidden");
}

/**
 * Builds the DOM subtree for a single "meaning" (one part of speech),
 * including its definitions, examples, synonyms, and antonyms.
 * @param {object} meaning - One entry from entry.meanings.
 * @returns {HTMLElement}
 */
function buildMeaningBlock(meaning) {
    const meaningBlock = document.createElement("div");
    meaningBlock.classList.add("meaning-block");

    const partOfSpeech = document.createElement("div");
    partOfSpeech.classList.add("part-of-speech");
    partOfSpeech.textContent = meaning.partOfSpeech;
    meaningBlock.append(partOfSpeech);

    meaning.definitions.forEach((definitionEntry) => {
        const definitionItem = document.createElement("div");
        definitionItem.classList.add("definition-item");
        definitionItem.textContent = definitionEntry.definition;
        meaningBlock.append(definitionItem);

        if (definitionEntry.example) {
            const example = document.createElement("div");
            example.classList.add("definition-example");
            example.textContent = `"${definitionEntry.example}"`;
            meaningBlock.append(example);
        }
    });

    const synonyms = meaning.synonyms || [];
    if (synonyms.length > 0) {
        const synonymsEl = document.createElement("div");
        synonymsEl.classList.add("synonyms-list");
        synonymsEl.textContent = `Synonyms: ${synonyms.join(", ")}`;
        meaningBlock.append(synonymsEl);
    }

    const antonyms = meaning.antonyms || [];
    if (antonyms.length > 0) {
        const antonymsEl = document.createElement("div");
        antonymsEl.classList.add("antonyms-list");
        antonymsEl.textContent = `Antonyms: ${antonyms.join(", ")}`;
        meaningBlock.append(antonymsEl);
    }

    return meaningBlock;
}

/**
 * Displays an error message and hides any previously shown results.
 * @param {string} message
 */
function displayError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove("hidden");
    elements.resultsSection.classList.add("hidden");
}

/**
 * Handles the search form's submit event: reads and clears the
 * input, then kicks off the fetch.
 * @param {SubmitEvent} event
 */
function handleSearchSubmit(event) {
    event.preventDefault();

    const word = elements.wordInput.value;
    fetchWordData(word);

    elements.wordInput.value = "";
}

/**
 * Clears any visible error as soon as the user starts typing a new
 * search, instead of leaving a stale error message on screen.
 */
function handleWordInputChange() {
    if (!elements.errorMessage.classList.contains("hidden")) {
        elements.errorMessage.classList.add("hidden");
        elements.errorMessage.textContent = "";
    }
}

/**
 * Updates the save button's label/style to reflect whether the
 * current word is already in savedWords.
 * @param {string} word
 */
function updateSaveButtonState(word) {
    const isSaved = savedWords.includes(word);
    elements.saveWordButton.textContent = isSaved ? "★ Saved" : "☆ Save";
    elements.saveWordButton.classList.toggle("saved", isSaved);
}

/**
 * Adds or removes the currently displayed word from the saved list,
 * then re-renders the save button and the saved words list.
 */
function toggleSaveWord() {
    const word = elements.saveWordButton.dataset.word;
    if (!word) {
        return;
    }

    if (savedWords.includes(word)) {
        savedWords = savedWords.filter((savedWord) => savedWord !== word);
    } else {
        savedWords.push(word);
    }

    updateSaveButtonState(word);
    renderSavedWordsList();
}

/**
 * Rebuilds the saved words list in the DOM. Clicking a saved word
 * re-runs the search for that word.
 */
function renderSavedWordsList() {
    elements.savedWordsList.innerHTML = "";

    savedWords.forEach((word) => {
        const listItem = document.createElement("li");
        listItem.textContent = word;
        listItem.addEventListener("click", () => {
            elements.wordInput.value = word;
            fetchWordData(word);
        });
        elements.savedWordsList.append(listItem);
    });
}

/**
 * Toggles the light/dark theme by adding/removing a class on <body>,
 * and updates the toggle button's label to match.
 */
function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    elements.themeToggleButton.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

/**
 * Plays the pronunciation audio for the currently displayed word,
 * if one was found in the API response.
 */
function playPronunciation() {
    if (!currentAudioUrl) {
        return;
    }
    const audio = new Audio(currentAudioUrl);
    audio.play();
}

/**
 * Caches DOM element references and wires up all event listeners.
 * Runs once, after the DOM has finished loading.
 */
function initialize() {
    elements = {
        searchForm: document.getElementById("search-form"),
        wordInput: document.getElementById("word-input"),
        searchButton: document.getElementById("search-button"),
        errorMessage: document.getElementById("error-message"),
        loadingIndicator: document.getElementById("loading-indicator"),
        resultsSection: document.getElementById("results"),
        resultWord: document.getElementById("result-word"),
        resultPhonetic: document.getElementById("result-phonetic"),
        playAudioButton: document.getElementById("play-audio-button"),
        saveWordButton: document.getElementById("save-word-button"),
        meaningsContainer: document.getElementById("meanings-container"),
        savedWordsList: document.getElementById("saved-words-list"),
        themeToggleButton: document.getElementById("theme-toggle-button"),
    };

    elements.searchForm.addEventListener("submit", handleSearchSubmit);
    elements.wordInput.addEventListener("input", handleWordInputChange);
    elements.themeToggleButton.addEventListener("click", toggleTheme);
    elements.playAudioButton.addEventListener("click", playPronunciation);
    elements.saveWordButton.addEventListener("click", toggleSaveWord);
}

document.addEventListener("DOMContentLoaded", initialize);

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        fetchWordData,
        displayResults,
        displayError,
        handleSearchSubmit,
        toggleSaveWord,
        toggleTheme,
        playPronunciation,
    };
}