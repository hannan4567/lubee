"""Converts the Excel rate chart in /data into data/products.json (run automatically by GitHub Actions)."""
import json, glob, sys, datetime as dt
import openpyxl

files = glob.glob("data/*.xlsx")
if len(files) != 1:
    sys.exit(f"Keep exactly ONE .xlsx file in /data (found {len(files)})")

ws = openpyxl.load_workbook(files[0], data_only=True).active
rows = list(ws.iter_rows(values_only=True))
head = [str(h or "").strip().lower() for h in rows[0]]

def col(test):
    for i, h in enumerate(head):
        if test(h): return i
    sys.exit("Required column missing in Excel header row")

ix = dict(
    code=col(lambda h: h == "material code"), sku=col(lambda h: h == "sku"),
    seg=col(lambda h: h == "segment"), size=col(lambda h: h == "pack size"),
    mrp=col(lambda h: h == "mrp"), rate=col(lambda h: h == "rate without gst"),
    disc=col(lambda h: h.startswith("prod discount")), sch=col(lambda h: h.startswith("ho scheme")),
    gst=col(lambda h: h.startswith("rate with gst")),
)
n = lambda v: round(float(v), 2) if isinstance(v, (int, float)) else 0
code = lambda v: str(int(v)) if isinstance(v, (int, float)) else str(v)

products = [
    {
        "code": code(r[ix["code"]]), "name": str(r[ix["sku"]]).strip(),
        "segment": str(r[ix["seg"]] or "").strip() or "Other",
        "size": n(r[ix["size"]]), "mrp": n(r[ix["mrp"]]), "rate": n(r[ix["rate"]]),
        "discount": n(r[ix["disc"]]), "scheme": n(r[ix["sch"]]), "gst": n(r[ix["gst"]]),
    }
    for r in rows[1:] if r[ix["code"]] and r[ix["sku"]]
]
ist = dt.timezone(dt.timedelta(hours=5, minutes=30))
out = {"updated": dt.datetime.now(ist).isoformat(timespec="minutes"), "count": len(products), "products": products}
json.dump(out, open("data/products.json", "w"), separators=(",", ":"))
print(f"Wrote {len(products)} products")
