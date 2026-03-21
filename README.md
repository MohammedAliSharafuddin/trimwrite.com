# trimwrite.com

Canonical public product page:
<https://flairmi.com/products/trimwrite.html>

Public site for TrimWrite and QuartoPad.

Current role in the portfolio:

- soft-launch vanity and campaign domain
- public product canon lives on FlairMI
- redirect or thin-canonical strategy should be applied after launch, not during soft launch

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

The waitlist form posts directly to `mohammedali.page@gmail.com` using FormSubmit's
static-site endpoint and falls back to `mailto:` if the request fails.

If you want to route requests somewhere else, set
`window.TRIMWRITE_WAITLIST_ENDPOINT` before `script.js` loads, or replace the
`WAITLIST_ENDPOINT` constant in `script.js`.

## Analytics

Google Analytics 4 is wired behind a simple config hook.

- GA4 is configured in `index.html` for the public site.
- Waitlist submissions send a `generate_lead` event when the request succeeds.

## Assets

- Product demo GIFs live in `assets/animations/`
- The landing page source is `index.html`, `styles.css`, and `script.js`
- Regenerate the GIFs with `npm run capture:demos`
- The capture script expects:
  - QuartoPad running at `http://127.0.0.1:7496/`
  - TrimWrite running at `http://127.0.0.1:4000/index.html`
