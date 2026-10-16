const CSV_FILE = "RBL-songlist.csv";

const searchInput = document.getElementById("search");
const songList = document.getElementById("song-list");
const status = document.getElementById("status");

let songs = [];

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
        const character = text[i];
        const nextCharacter = text[i + 1];

        if (character === '"' && quoted && nextCharacter === '"') {
            field += '"';
            i += 1;
        } else if (character === '"') {
            quoted = !quoted;
        } else if (character === "," && !quoted) {
            row.push(field);
            field = "";
        } else if ((character === "\n" || character === "\r") && !quoted) {
            if (character === "\r" && nextCharacter === "\n") {
                i += 1;
            }

            row.push(field);
            if (row.some((value) => value.trim() !== "")) {
                rows.push(row);
            }
            row = [];
            field = "";
        } else {
            field += character;
        }
    }

    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }

    return rows;
}

function rowsToSongs(rows) {
    if (rows.length === 0) {
        return [];
    }

    const headings = rows[0].map((heading) => heading.trim().toLowerCase());
    const songColumn = headings.indexOf("song");
    const artistColumn = headings.indexOf("artist");

    if (songColumn === -1 || artistColumn === -1) {
        throw new Error('The CSV needs columns named "Song" and "Artist".');
    }

    return rows
        .slice(1)
        .map((row) => ({
            song: (row[songColumn] || "").trim(),
            artist: (row[artistColumn] || "").trim()
        }))
        .filter((item) => item.song || item.artist);
}

function compareText(first, second) {
    return first.localeCompare(second, undefined, {
        sensitivity: "base",
        numeric: true
    });
}

function getVisibleSongs() {
    const query = searchInput.value.trim().toLowerCase();

    return songs
        .filter((item) => {
            return item.song.toLowerCase().includes(query) ||
                item.artist.toLowerCase().includes(query);
        })
}

function renderSongs() {
    const visibleSongs = getVisibleSongs();
    const fragment = document.createDocumentFragment();

    songList.replaceChildren();

    for (const item of visibleSongs) {
        const row = document.createElement("tr");
        const songCell = document.createElement("td");
        const artistCell = document.createElement("td");

        songCell.textContent = item.song;
        artistCell.textContent = item.artist;
        row.append(songCell, artistCell);
        fragment.append(row);
    }

    songList.append(fragment);
    status.textContent = `${visibleSongs.length} song${visibleSongs.length === 1 ? "" : "s"}`;
}

async function loadSongs() {
    try {
        const response = await fetch(CSV_FILE, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Could not load ${CSV_FILE} (${response.status}).`);
        }

        songs = rowsToSongs(parseCsv(await response.text()));
        renderSongs();
    } catch (error) {
        status.textContent = error.message;
        console.error(error);
    }
}

searchInput.addEventListener("input", renderSongs);

loadSongs();
