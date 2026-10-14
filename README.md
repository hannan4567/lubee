# SERVO Dealer Hub (technical notes)

Static site: `index.html`, `css/`, `js/`. Data lives in `data/*.json`, **auto-generated** by `scripts/build_data.py` through `.github/workflows/update-data.yml` whenever `update-here/` changes.

```
update-here/   RATE_CHART.xlsx (source of truth), ANNOUNCEMENTS.txt   <- client edits only here
data/          products.json, changes.json, announcements.json        <- generated, do not edit
assets/        logo.png (optional)
```

## Deploy
- **Vercel:** Import GitHub repo -> Framework *Other* -> no build command, no output directory -> Deploy.
- **Netlify:** Import repo -> leave build command and publish directory empty -> Deploy.
- Make sure the `.github` folder is uploaded (hidden on some systems). Use GitHub Desktop if the web upload skips it.
- In GitHub: Settings -> Actions -> General -> Workflow permissions -> **Read and write** (needed so the bot can save generated data).

## Local preview
`python -m http.server 8000`  ->  http://localhost:8000

## Security
The repo and site are public-readable by link. Keep the repo private. Add password protection (Vercel Pro / Netlify) if rates must be dealer-only.
