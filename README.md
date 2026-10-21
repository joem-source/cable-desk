# Gotham Cable Desk

Custom cable orders for Gotham Sound. This replaces FormDocs. Sales reps enter orders, the service team works from the queue, and everyone can search and duplicate past cables.

- Site: https://joem-source.github.io/cable-desk/
- Data: Firebase (Firestore). Only @gothamsound.com Google accounts can sign in.
- No customer data is stored in this repo. The FormDocs history is loaded into Firebase once with `import.html`.

## Files
| File | What it is |
|---|---|
| `index.html`, `app.js` | The Cable Desk |
| `config.js` | Firebase connection settings (safe to publish) |
| `import.html` | One-time upload of the FormDocs history |
| `firestore.rules` | Database access rules, pasted into the Firebase console |

## Changing things later
- **Statuses, standard connector names, quick notes:** top of `app.js` (`STATUSES`, `STD_CONN`, `QUICK_NOTES`).
- **Reloading the history:** run `import.html` again with a new `history.json`. Orders entered in the Cable Desk are kept.
