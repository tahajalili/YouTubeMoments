const out = document.getElementById("out");
const q = document.getElementById("q");

const fmt = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(sec).padStart(2, "0");
};

async function render() {
  const all = (await chrome.storage.local.get("notes")).notes || {};
  const term = q.value.toLowerCase();
  out.textContent = "";
  let shown = 0;
  for (const [id, entry] of Object.entries(all)) {
    const notes = entry.notes.filter(
      (n) => !term || n.text.toLowerCase().includes(term) || entry.title.toLowerCase().includes(term)
    );
    if (!notes.length) continue;
    shown++;
    const h = document.createElement("h3");
    h.textContent = entry.title;
    out.append(h);
    for (const n of notes) {
      const div = document.createElement("div");
      div.className = "note";
      const a = document.createElement("a");
      a.href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}&t=${n.t}s`;
      a.target = "_blank";
      a.textContent = fmt(n.t);
      div.append(a, " " + (n.text || "(bookmark)"));
      out.append(div);
    }
  }
  if (!shown) {
    out.className = "empty";
    out.textContent = "No notes yet. Press Alt+N on a YouTube video.";
  } else {
    out.className = "";
  }
}

q.addEventListener("input", render);
render();
