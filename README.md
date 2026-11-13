# Nexora Digital — Agency Website Starter

A responsive multi-page website starter for a premium web development agency.

## Run locally
You do not need Node.js for this starter.

1. Open this folder in Visual Studio Code.
2. Open `index.html` in a browser, or use the VS Code **Live Server** extension. Use Live Server to navigate between pages locally.
3. To work with Claude Code, open the VS Code terminal in this folder and run `claude`.

## Project structure
```text
nexora-digital-agency/
├── index.html
├── services.html
├── work.html
├── process.html
├── about.html
├── contact.html
├── styles.css
├── script.js
├── CLAUDE.md
└── README.md
```

## Before publishing
- Confirm the final business name and check domain/trademark availability.
- Replace the sample email address.
- Replace concept portfolio projects with real work or keep them explicitly labeled as concepts.
- Add real company details, privacy information, and working contact handling.
- Test all pages and links on mobile and desktop.

This is a front-end starter. The contact CTA currently opens the visitor's email app; it does not yet store form submissions in a database.

## Live EUR/USD concept chart
The Moneta Finance concept uses the Twelve Data latest-price endpoint for EUR/USD. The browser requests a Cloudflare Worker every 60 seconds; the Worker stores the provider key as a secret and caches prices briefly. The chart plots only prices actually received in the current page session, so it needs at least two successful updates to draw a line. Provider plans can delay data or limit requests; this demo is not for trading decisions.

### Configure the quote feed
1. Create a Twelve Data account and an API key. Confirm the plan and data terms support the EUR/USD quote freshness you need.
2. In Cloudflare Dashboard, open **Workers & Pages**, create a Worker, paste in `cloudflare-worker.js`, and deploy it.
3. In the Worker settings, add `TWELVE_DATA_API_KEY` as a **secret** and deploy the change. Never put the key in a website file or commit it to GitHub.
4. The `.finance-ui` element in `work.html` is configured for `https://super-dust-5912nexora-fx-rate.wulanday9.workers.dev/api/eur-usd`. If you recreate the Worker, update this endpoint to match its `workers.dev` URL.
5. Deploy the changed site files to GitHub Pages. The Worker allows the current GitHub Pages origin and Live Server on port 5500; if the site uses a different domain or local port, update `ALLOWED_ORIGINS` in `cloudflare-worker.js`.

The chart requires the configured Worker, a valid provider secret, and the updated site files to be published to GitHub Pages.
