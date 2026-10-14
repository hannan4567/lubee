# How to update SERVO Dealer Hub (no coding needed)

You only ever work in the **`update-here`** folder on GitHub. Everything else updates by itself.

## 1. Change rates / add products / delete products
1. Open your rate chart Excel on your computer. Change prices, **add rows** for new products, or **delete rows** for removed products. Save.
2. On GitHub open the repo → `update-here` folder → **Add file → Upload files** → drop the saved Excel → **Commit changes**.
   - Any file name works. The **newest uploaded .xlsx is used**. Old ones are ignored.
3. Wait about 2 minutes. The website updates by itself.

The site automatically marks **NEW**, **▲ price up**, **▼ price down** and **REVISED** items and shows a "Latest update" banner with counts, so dealers see what changed.

**Rules for the Excel:** keep the header row (row 1) names exactly as they are. Every product needs a Material Code, SKU and rates. Filling the Segment column is recommended.

## 2. Announcements
Open `update-here/ANNOUNCEMENTS.txt` → click the pencil icon → write one message per line.
Put `#` at the start of a line to hide it. Click **Commit changes**.

## 3. Logo (optional)
Upload your logo as `logo.png` into the `assets` folder. It replaces the text logo automatically.

## 4. Did it work?
- Open the repo's **Actions** tab. A green tick means done. A red cross means a problem. Click it to read a plain message such as *"Row 45: SERVO XYZ has no rate"*. Fix the Excel and upload again.
- If there is an error, the website keeps showing the last good rates, so dealers never see broken data.

## Mistake? Undo
Upload the previous Excel again. The site goes back in about 2 minutes.
