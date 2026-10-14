const $ = (id) => document.getElementById(id);
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const size = (l) => (l < 1 ? Math.round(l * 1000) + " ml" : l + " L");
const PAGE = 48;
let ALL = [], seg = "", shown = PAGE, view = "cards";
try { view = localStorage.getItem("servoView") || "cards"; } catch {}

async function load() {
  $("out").innerHTML = '<div class="grid">' + '<div class="skel"></div>'.repeat(6) + "</div>";
  try {
    const [p, a] = await Promise.all([
      fetch("data/products.json").then((r) => { if (!r.ok) throw 0; return r.json(); }),
      fetch("data/announcements.json").then((r) => (r.ok ? r.json() : { items: [] })).catch(() => ({ items: [] })),
    ]);
    ALL = p.products.map((x) => ({ ...x, _s: `${x.name} ${x.code} ${size(x.size)} ${x.size}l ${x.size}ltr ${x.segment}`.toLowerCase() }));
    $("badge").textContent = "Updated " + new Date(p.updated).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const items = (a.items || []).filter((i) => i.active);
    if (items.length) { $("ann").hidden = false; $("ann").innerHTML = items.map((i) => `<div class="ann">📢 ${esc(i.text)}</div>`).join(""); }
    const segs = [...new Set(ALL.map((x) => x.segment))].sort((a, b) => (a === "Other") - (b === "Other") || a.localeCompare(b));
    $("chips").innerHTML = ["All", ...segs].map((s) => `<button class="chip${s === "All" ? " on" : ""}" data-s="${s === "All" ? "" : esc(s)}">${esc(s)}</button>`).join("");
    [...new Set(ALL.map((x) => x.size))].sort((a, b) => a - b).forEach((v) => $("size").add(new Option(size(v), v)));
    setView(view, false);
    render();
  } catch {
    $("badge").textContent = "Offline";
    $("out").innerHTML = '<div class="empty">⚠️ Rates could not be loaded. Please refresh the page.</div>';
  }
}

function card(p) {
  return `<article class="card"><h3>${esc(p.name)}</h3>
  <div class="tags"><span class="tag">#${esc(p.code)}</span><span class="tag">${size(p.size)}</span><span class="tag seg">${esc(p.segment)}</span></div>
  <div class="prices"><div><small>MRP</small><b>${inr.format(p.mrp)}</b></div>
  <div class="hl"><small>Dealer Rate</small><b>${inr.format(p.rate)}</b></div>
  <div><small>GST Incl.</small><b>${inr.format(p.gst)}</b></div></div>
  ${p.discount || p.scheme ? `<div class="deal">${p.discount ? `<span>Discount ${inr.format(p.discount)}/L</span>` : ""}${p.scheme ? `<span>Scheme ${inr.format(p.scheme)}</span>` : ""}</div>` : ""}</article>`;
}

function row(p) {
  return `<tr><td>${esc(p.name)}</td><td>${esc(p.code)}</td><td>${size(p.size)}</td><td class="r">${inr.format(p.mrp)}</td>
  <td class="r red">${inr.format(p.rate)}</td><td class="r">${p.discount ? inr.format(p.discount) + "/L" : "—"}</td>
  <td class="r">${p.scheme ? inr.format(p.scheme) : "—"}</td><td class="r red">${inr.format(p.gst)}</td></tr>`;
}

function render() {
  const terms = $("q").value.toLowerCase().split(/\s+/).filter(Boolean), sz = $("size").value;
  const list = ALL.filter((p) => (!seg || p.segment === seg) && (!sz || String(p.size) === sz) && terms.every((t) => p._s.includes(t)));
  $("meta").textContent = `Showing ${Math.min(shown, list.length)} of ${list.length} products`;
  const part = list.slice(0, shown);
  $("out").innerHTML = !list.length ? '<div class="empty">🔍 No products match your search.</div>'
    : view === "cards" ? `<div class="grid">${part.map(card).join("")}</div>`
    : `<div class="tbl-wrap"><table><thead><tr><th>Product</th><th>Material Code</th><th>Pack</th><th class="r">MRP</th><th class="r">Dealer Rate</th><th class="r">Discount</th><th class="r">Scheme</th><th class="r">GST Incl. Rate</th></tr></thead><tbody>${part.map(row).join("")}</tbody></table></div>`;
  $("more").hidden = list.length <= shown;
}

function setView(v, save = true) {
  view = v; if (save) try { localStorage.setItem("servoView", v); } catch {}
  $("vCards").classList.toggle("on", v === "cards"); $("vTable").classList.toggle("on", v === "table");
}

let t;
$("q").addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { shown = PAGE; render(); }, 120); });
$("size").addEventListener("change", () => { shown = PAGE; render(); });
$("chips").addEventListener("click", (e) => {
  const b = e.target.closest(".chip"); if (!b) return;
  seg = b.dataset.s; shown = PAGE;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === b));
  render();
});
$("vCards").onclick = () => { setView("cards"); render(); };
$("vTable").onclick = () => { setView("table"); render(); };
$("more").onclick = () => { shown += PAGE; render(); };
load();
