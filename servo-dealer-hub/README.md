# SERVO Dealer Hub

Static dealer portal (HTML + CSS + JS). No backend, no secrets, no database.

## Folder structure
```
index.html                  page
css/style.css               theme (red / blue / white)
js/app.js                   search, filters, cards/table
data/RATE_CHART.xlsx        SOURCE OF TRUTH (edit this)
data/products.json          auto-generated from the Excel (do not edit by hand)
data/announcements.json     banner messages (edit by hand)
scripts/build_data.py       Excel -> JSON converter
.github/workflows/          auto-runs the converter on every Excel upload
```

## How the client updates rates (no coding)
1. Open the GitHub repo → `data` folder → open `RATE_CHART.xlsx` → delete it, then **Add file → Upload files** and upload the new Excel (any name, but only ONE .xlsx allowed in `data/`).
2. Click **Commit changes**. A GitHub Action converts it to `products.json` in ~1 minute.
3. Vercel/Netlify redeploys automatically; the site is live ~30 seconds later.
   The "Updated" badge shows the new time.

Keep the header names in row 1 of the Excel unchanged (Material Code, SKU, Segment, Pack Size, MRP, Rate without GST, Prod Discount…, HO Scheme…, Rate with GST…).

## Announcements
Edit `data/announcements.json` on GitHub (pencil icon). Set `"active": false` to hide a message.

## Deploy
- **Vercel:** New Project → Import the GitHub repo → Framework: *Other* → no build command, no output directory → Deploy.
- **Netlify:** Add new site → Import from GitHub → leave build command and publish directory empty → Deploy.

## Preview locally
`python -m http.server 8000` then open http://localhost:8000

## Security note
Anyone with the website link can see the rates. Keep the GitHub repo **Private**, and add password protection (Vercel Pro / Netlify) if rates must stay dealer-only.
