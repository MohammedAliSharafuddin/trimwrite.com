# trimwrite.com

Public umbrella site for the TrimWrite product line.

The current landing page positions both products honestly as in testing:

- `QuartoPad` is the private-beta Quarto editor for R workflows
- `TrimWrite` is the public AI-pattern analyzer repo, still in beta

The site uses animated demo GIFs captured from the actual running apps.

## Local development

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
npm run preview
```

## Waitlist flow

The waitlist form currently falls back to `mailto:support@trimwrite.dev`.

If you want to collect beta requests in Google Sheets instead, set
`window.TRIMWRITE_WAITLIST_ENDPOINT` before `script.js` loads, or replace the
`WAITLIST_ENDPOINT` constant in `script.js` with your deployed Google Apps
Script web app URL.

## Assets

- Product demo GIFs live in `assets/animations/`
- The landing page source is `index.html`, `styles.css`, and `script.js`
- Regenerate the GIFs with `npm run capture:demos`
- The capture script expects:
  - QuartoPad running at `http://127.0.0.1:7496/`
  - TrimWrite running at `http://127.0.0.1:4000/index.html`
