# Clauselab

A client-side contract lifecycle management workspace. No backend. No accounts. No telemetry. All data stays in the user's browser.

**Live demo:** after deployment, at `https://advsanketshah.github.io/Clauselab/`

Built by [Adv. Sanket Shah](https://advsanketshah.github.io/), a technology lawyer based in Indore, India.

## What it does

- **Contracts repository.** Track every contract with metadata, status, renewal dates, tags, and notes. Full CRUD, filtering, search, import/export as JSON.
- **Clause library.** 45+ practitioner-drafted clauses across 19 categories including DPDPA 2023, GDPR Article 28, indemnification, limitation of liability, dispute resolution, and boilerplate. Add your own.
- **Template drafter.** Form-based contract assembly with live preview. Includes Mutual NDA, SaaS Subscription, Consulting Services, and Data Processing Addendum templates. Exports to Word, markdown, and plain text.
- **AI-assisted review (BYOK).** Bring your own API key for Google Gemini (has free tier), OpenAI, or Anthropic. Five review modes: issue spotting, redline suggestions, plain-English summary, DPDPA+GDPR compliance check, missing-clauses check.
- **Portable data.** Export a JSON backup with one click. Restore on any other browser.

## Architecture

- Pure static site. HTML, CSS, vanilla JavaScript.
- No build step. No bundler. No framework.
- IndexedDB for contracts and custom clauses.
- localStorage for settings and API keys.
- Fonts: Inter + Outfit (Google Fonts).
- Zero analytics, zero trackers, zero third-party scripts beyond fonts.

## Deployment to GitHub Pages

1. Create a new repository on GitHub named `Clauselab` (or any name).
2. Push the contents of this folder to the root of that repository:
   ```bash
   git init
   git add .
   git commit -m "Initial Clauselab release"
   git branch -M main
   git remote add origin https://github.com/advsanketshah/Clauselab.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**.
4. Under **Source**, select **Deploy from a branch**.
5. Select **main** branch and **/ (root)** folder. Click **Save**.
6. Wait 1–2 minutes. The site will be live at `https://<username>.github.io/<repo-name>/`.

### Optional: custom domain

To use a custom domain, add a `CNAME` file at the root of the repository containing your domain (for example, `clauselab.in`) and configure the DNS A/AAAA or CNAME records per [GitHub's instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Running locally

Open `index.html` in any modern browser. For full functionality (fetching `data/*.json` seed files), serve over a local HTTP server:

```bash
# Python 3
python3 -m http.server 8080

# Node
npx serve
```

Then visit `http://localhost:8080`.

## File structure

```
clauselab/
├── index.html              Landing + dashboard
├── contracts.html          Contracts repository
├── clauses.html            Clause library
├── drafter.html            Template-based drafter
├── review.html             AI review (BYOK)
├── settings.html           Backup, restore, key management
├── about.html              About the tool
├── privacy.html            Privacy policy
├── terms.html              Terms of use
├── disclaimer.html         Legal disclaimer (BCI-compliant)
├── css/
│   ├── app.css             Design system
│   └── nav.css             Navigation and mobile tab bar
├── js/
│   ├── app.js              Core: nav injection, storage, utilities
│   ├── dashboard.js        Dashboard widgets
│   ├── contracts.js        Contracts CRUD
│   ├── clauses.js          Clause library logic
│   ├── drafter.js          Template drafter
│   ├── review.js           BYOK AI review
│   └── settings.js         Backup / wipe
├── data/
│   ├── clauses.json        Seed clauses
│   └── templates.json      Seed templates
├── assets/
│   ├── logo.svg            Primary mark
│   └── favicon.svg         Browser favicon
└── README.md
```

## Security notes

### BYOK model

API keys are stored in `localStorage` on the user's browser. They are:

- sent only to the provider API endpoint when the user explicitly clicks "Run review";
- **excluded** from the JSON backup export;
- cleared by the "Clear all API keys" action on the Settings page;
- cleared by the "Wipe all workspace data" action.

Recommendation: users should create dedicated API keys with restrictive spend and rate limits, and clear them when finished on shared devices.

### No server

Clauselab has no backend, no API, no database under the Publisher's control. The only network calls from a user's browser are:

1. Loading the static HTML/CSS/JS from the host (GitHub Pages).
2. Fetching Google Fonts.
3. When the user invokes AI Review: a direct call from the user's browser to the selected AI provider's API endpoint.

## Contributing

Issues and pull requests are welcome. For major changes, open an issue first to discuss.

## Licence

Source code: MIT License (see `LICENSE`, or add one when publishing). The Clauselab name, logo, and visual branding remain property of the Publisher and are not covered by the source licence.

## Credits

- Fonts: [Inter](https://rsms.me/inter/) by Rasmus Andersson; [Outfit](https://fonts.google.com/specimen/Outfit) by Smith, Clerico, and Varjan — both via Google Fonts.
- Design system: custom, aligned with the [Sanket Shah portfolio](https://advsanketshah.github.io/) branding.

## Contact

Adv. Sanket Shah — [advocatesanketshah@gmail.com](mailto:advocatesanketshah@gmail.com) — [LinkedIn](https://www.linkedin.com/in/advsanketshah/)

---

**Disclaimer.** Clauselab is a workspace tool. It is not legal advice. Use of this tool does not create an attorney-client relationship with the author. Read the full [Disclaimer](disclaimer.html), [Terms of Use](terms.html), and [Privacy Policy](privacy.html) before relying on any content.
