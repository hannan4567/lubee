const $ = (id) => document.getElementById(id);
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sizeParts = (l) => (l < 1 ? [Math.round(l * 1000), "ml"] : [l, "L"]);
const size = (l) => sizeParts(l).join(" ");
const COLORS = { PCMO: "#0b3d91", CVO: "#e31e24", MCO: "#f58220", Grease: "#0e8a6b", AGRI: "#5b8c00", "2T": "#c2185b", Other: "#64708a" };
const PAGE = 48;
let ALL = [], seg = "", shown = PAGE, view = "cards", CH = { added: [], changed: {}, removed: [] };
try { view = localStorage.getItem("servoView") || "cards"; } catch {}

async function load() {
  $("out").innerHTML = '<div class="grid">' + '<div class="skel"></div>'.repeat(6) + "</div>";
  const j = (u) => fetch(u).then((r) => { if (!r.ok) throw 0; return r.json(); });
  try {
    const p = await j("data/products.json");
    const [a, c] = await Promise.all([j("data/announcements.json").catch(() => ({ items: [] })), j("data/changes.json").catch(() => CH)]);
    CH = c;
    ALL = p.products.map((x) => ({ ...x, _s: `${x.name} ${x.code} ${size(x.size)} ${x.size}l ${x.size}ltr ${x.segment}`.toLowerCase() }));
    const when = new Date(p.updated).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const segs = [...new Set(ALL.map((x) => x.segment))].sort((a, b) => (a === "Other") - (b === "Other") || a.localeCompare(b));
    $("badge").textContent = "Updated " + when;
    $("stats").innerHTML = `<span>${ALL.length} products</span><span>${segs.length} segments</span><span>Rates as on ${when}</span>`;
    let html = (a.items || []).map((i) => `<div class="ann">📢 ${esc(i.text)}</div>`).join("");
    const nA = CH.added.length, nC = Object.keys(CH.changed).length, nR = CH.removed.length;
    if (nA + nC + nR) html += `<div class="ann upd">🔄 <b>Latest update:</b> ${nA} new · ${nC} rate revised · ${nR} removed. Tap <b>“Updated items”</b> below to see them.</div>`;
    if (html) { $("ann").hidden = false; $("ann").innerHTML = html; }
    $("chips").innerHTML = (nA + nC ? '<button class="chip upd" data-s="__upd">★ Updated items</button>' : "") +
      ["All", ...segs].map((s) => `<button class="chip${s === "All" ? " on" : ""}" data-s="${s === "All" ? "" : esc(s)}">${esc(s)}</button>`).join("");
    [...new Set(ALL.map((x) => x.size))].sort((a, b) => a - b).forEach((v) => $("size").add(new Option(size(v), v)));
    setView(view, false); render();
  } catch {
    $("badge").textContent = "Offline";
    $("out").innerHTML = '<div class="empty">⚠️ Rates could not be loaded.<br>Please refresh the page.</div>';
  }
}

const flag = (p) => {
  if (CH.added.includes(p.code)) return '<span class="fl new">NEW</span>';
  if (!(p.code in CH.changed)) return "";
  const d = CH.changed[p.code];
  return d > 0 ? `<span class="fl up">▲ ${inr.format(d)}</span>` : d < 0 ? `<span class="fl dn">▼ ${inr.format(-d)}</span>` : '<span class="fl rv">REVISED</span>';
};

function card(p) {
  const [n, u] = sizeParts(p.size);
  return `<article class="card" style="--c:${COLORS[p.segment] || COLORS.Other}">
  <div class="hd"><div class="pk"><b>${n}</b><small>${u}</small></div>
  <div><h3>${esc(p.name)}</h3><div class="tags"><span class="tag">#${esc(p.code)}</span><span class="tag seg">${esc(p.segment)}</span>${flag(p)}</div></div></div>
  <div class="prices"><div><small>MRP</small><b>${inr.format(p.mrp)}</b></div>
  <div class="hl"><small>Dealer Rate</small><b>${inr.format(p.rate)}</b></div>
  <div><small>GST Incl.</small><b>${inr.format(p.gst)}</b></div></div>
  ${p.discount || p.scheme ? `<div class="deal">${p.discount ? `<span>Discount ${inr.format(p.discount)}/L</span>` : ""}${p.scheme ? `<span>Scheme ${inr.format(p.scheme)}</span>` : ""}</div>` : ""}
  <button class="wa" data-c="${esc(p.code)}">Share on WhatsApp</button></article>`;
}

const row = (p) => `<tr><td>${esc(p.name)} ${flag(p)}</td><td>${esc(p.code)}</td><td>${size(p.size)}</td><td class="r">${inr.format(p.mrp)}</td>
  <td class="r red">${inr.format(p.rate)}</td><td class="r">${p.discount ? inr.format(p.discount) + "/L" : "—"}</td>
  <td class="r">${p.scheme ? inr.format(p.scheme) : "—"}</td><td class="r red">${inr.format(p.gst)}</td></tr>`;

function render() {
  const terms = $("q").value.toLowerCase().split(/\s+/).filter(Boolean), sz = $("size").value, so = $("sort").value;
  let list = ALL.filter((p) =>
    (!seg || (seg === "__upd" ? CH.added.includes(p.code) || p.code in CH.changed : p.segment === seg)) &&
    (!sz || String(p.size) === sz) && terms.every((t) => p._s.includes(t)));
  if (so === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (so === "lo") list = [...list].sort((a, b) => a.rate - b.rate);
  if (so === "hi") list = [...list].sort((a, b) => b.rate - a.rate);
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
const reset = () => { shown = PAGE; render(); };
let t;
$("q").addEventListener("input", () => { clearTimeout(t); t = setTimeout(reset, 120); });
$("size").onchange = reset; $("sort").onchange = reset;
$("chips").addEventListener("click", (e) => {
  const b = e.target.closest(".chip"); if (!b) return;
  seg = b.dataset.s;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === b));
  reset();
});
$("vCards").onclick = () => { setView("cards"); render(); };
$("vTable").onclick = () => { setView("table"); render(); };
$("prn").onclick = () => window.print();
$("more").onclick = () => { shown += PAGE; render(); };
$("out").addEventListener("click", (e) => {
  const b = e.target.closest(".wa"); if (!b) return;
  const p = ALL.find((x) => x.code === b.dataset.c); if (!p) return;
  const msg = `*${p.name}*\nCode: ${p.code} | Pack: ${size(p.size)}\nMRP: ${inr.format(p.mrp)}\nDealer Rate: ${inr.format(p.rate)}\nGST Incl. Rate: ${inr.format(p.gst)}`;
  window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank", "noopener");
});
load();
