"""Excel -> website data. Runs automatically on GitHub when anything in /update-here changes."""
import json, glob, sys, os, subprocess, datetime as dt
import openpyxl

def die(msg):
    print(f"::error::{msg}"); sys.exit(1)

def commit_time(f):
    try: return int(subprocess.check_output(["git", "log", "-1", "--format=%ct", "--", f], text=True).strip() or 0)
    except Exception: return 0

files = [f for f in glob.glob("update-here/*.xlsx") if not os.path.basename(f).startswith("~$")]
if not files: die("No .xlsx file found in the update-here folder.")
src = max(files, key=lambda f: (commit_time(f), os.path.getmtime(f)))  # newest upload wins
print("Using", src)

ws = openpyxl.load_workbook(src, data_only=True).active
rows = list(ws.iter_rows(values_only=True))
head = [str(h or "").strip().lower() for h in rows[0]]

def col(name, test):
    for i, h in enumerate(head):
        if test(h): return i
    die(f"Column '{name}' not found in row 1 of the Excel. Do not rename the header row.")

ix = dict(
    code=col("Material Code", lambda h: h == "material code"), sku=col("SKU", lambda h: h == "sku"),
    seg=col("Segment", lambda h: h == "segment"), size=col("Pack Size", lambda h: h == "pack size"),
    mrp=col("MRP", lambda h: h == "mrp"), rate=col("Rate without GST", lambda h: h == "rate without gst"),
    disc=col("Prod Discount", lambda h: h.startswith("prod discount")), sch=col("HO Scheme", lambda h: h.startswith("ho scheme")),
    gst=col("Rate with GST", lambda h: h.startswith("rate with gst")),
)
n = lambda v: round(float(v), 2) if isinstance(v, (int, float)) else 0
code = lambda v: str(int(v)) if isinstance(v, (int, float)) else str(v).strip()

new, errors = {}, []
for i, r in enumerate(rows[1:], start=2):
    if not r[ix["code"]] and not r[ix["sku"]]: continue
    if not r[ix["code"]] or not r[ix["sku"]]:
        errors.append(f"Row {i}: Material Code or SKU is empty"); continue
    p = {"code": code(r[ix["code"]]), "name": str(r[ix["sku"]]).strip(),
         "segment": str(r[ix["seg"]] or "").strip() or "Other",
         "size": n(r[ix["size"]]), "mrp": n(r[ix["mrp"]]), "rate": n(r[ix["rate"]]),
         "discount": n(r[ix["disc"]]), "scheme": n(r[ix["sch"]]), "gst": n(r[ix["gst"]])}
    if p["rate"] <= 0 or p["gst"] <= 0: errors.append(f"Row {i}: {p['name']} has no rate")
    if p["code"] in new: print(f"::warning::Duplicate Material Code {p['code']} (row {i}) - last one used")
    new[p["code"]] = p
if errors: die("Fix these rows in the Excel and upload again: " + " | ".join(errors[:15]))
if len(new) < 5: die("Too few products found - is this the right file?")

ist = dt.timezone(dt.timedelta(hours=5, minutes=30))
now = dt.datetime.now(ist).isoformat(timespec="minutes")

old, old_updated = {}, now
try:
    o = json.load(open("data/products.json")); old = {p["code"]: p for p in o["products"]}; old_updated = o["updated"]
except Exception: pass

added = [c for c in new if old and c not in old]
removed = [{"code": c, "name": old[c]["name"]} for c in old if c not in new]
keys = ("mrp", "rate", "discount", "scheme", "gst")
changed = {c: round(new[c]["rate"] - old[c]["rate"], 2) for c in new if c in old and any(new[c][k] != old[c][k] for k in keys)}
diff = bool(added or removed or changed)

if diff:
    json.dump({"date": now, "added": added, "removed": removed, "changed": changed}, open("data/changes.json", "w"), separators=(",", ":"))
elif not os.path.exists("data/changes.json"):
    json.dump({"date": now, "added": [], "removed": [], "changed": {}}, open("data/changes.json", "w"))
print(f"{len(new)} products | +{len(added)} new | {len(changed)} revised | -{len(removed)} removed")

updated = now if (diff or not old) else old_updated
json.dump({"updated": updated, "count": len(new), "products": list(new.values())}, open("data/products.json", "w"), separators=(",", ":"))

lines = [l.strip() for l in open("update-here/ANNOUNCEMENTS.txt", encoding="utf-8")] if os.path.exists("update-here/ANNOUNCEMENTS.txt") else []
json.dump({"items": [{"text": l} for l in lines if l and not l.startswith("#")]}, open("data/announcements.json", "w"), ensure_ascii=False)
