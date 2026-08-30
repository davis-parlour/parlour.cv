# parlour.cv

Personal website for Davis Parlour, hosted as a static site at [parlour.cv](https://parlour.cv/).

## Structure

- `index.html` — page content and semantic structure
- `styles.css` — layout and visual system
- `script.js` — navigation, dialogs, and JSON-backed lists
- `skills.json` — technical skills shown on the site
- `interests.json` — interests shown on the site
- `release-notes.json` — changelog entries shown in the release-notes dialog
- `tyne-bridge-construction.png` — original 1916 × 821 hero artwork
- `tyne-bridge-construction-960.png` — lighter responsive hero artwork for smaller screens
- `Davis-Parlour-Firmware-Engineer-CV.pdf` — downloadable CV

There is no build step and no analytics. Serve the repository over HTTP while developing so the JSON content files can be fetched:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.
