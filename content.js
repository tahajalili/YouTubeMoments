const KEY = "notes";
let panel, listEl, inputEl, addBtn, videoId;

const fmt = (s) => {
  s = Math.floor(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = h ? String(m).padStart(2, "0") : m;
  return (h ? h + ":" : "") + mm + ":" + String(sec).padStart(2, "0");
};

const getVideo = () => document.querySelector("video.html5-main-video");
const getId = () => new URLSearchParams(location.search).get("v");
const getTitle = () =>
  document.querySelector("h1.ytd-watch-metadata")?.textContent.trim() || document.title.replace(/ - YouTube$/, "");

const load = async () => (await chrome.storage.local.get(KEY))[KEY] || {};
const save = (all) => chrome.storage.local.set({ [KEY]: all });

async function addNote() {
  const text = inputEl.value.trim();
  const v = getVideo();
  if (!v || !videoId) return;
  const all = await load();
  const entry = all[videoId] || { title: getTitle(), notes: [] };
  entry.title = getTitle();
  entry.notes.push({ id: Date.now(), t: Math.floor(v.currentTime), text, created: Date.now() });
  entry.notes.sort((a, b) => a.t - b.t);
  all[videoId] = entry;
  await save(all);
  inputEl.value = "";
  render();
}

async function removeNote(id) {
  const all = await load();
  const entry = all[videoId];
  if (!entry) return;
  entry.notes = entry.notes.filter((n) => n.id !== id);
  if (!entry.notes.length) delete all[videoId];
  await save(all);
  render();
}

async function render() {
  if (!panel) return;
  const entry = (await load())[videoId];
  listEl.textContent = "";
  for (const n of entry?.notes || []) {
    const row = document.createElement("div");
    row.className = "ymn-row";
    const time = document.createElement("button");
    time.className = "ymn-time";
    time.textContent = fmt(n.t);
    time.onclick = () => { const v = getVideo(); if (v) v.currentTime = n.t; };
    const txt = document.createElement("span");
    txt.className = "ymn-text";
    txt.textContent = n.text || "(bookmark)";
    const del = document.createElement("button");
    del.className = "ymn-del";
    del.textContent = "×";
    del.onclick = () => removeNote(n.id);
    row.append(time, txt, del);
    listEl.append(row);
  }
}

function updateAddLabel() {
  const v = getVideo();
  if (addBtn && v) addBtn.textContent = "Add @ " + fmt(v.currentTime);
}

function build() {
  panel = document.createElement("div");
  panel.id = "ymn-panel";
  panel.hidden = true;
  inputEl = document.createElement("input");
  inputEl.placeholder = "Note (empty = bookmark)";
  addBtn = document.createElement("button");
  addBtn.className = "ymn-add";
  addBtn.onclick = addNote;
  const bar = document.createElement("div");
  bar.className = "ymn-bar";
  const closeBtn = document.createElement("button");
  closeBtn.className = "ymn-close";
  closeBtn.textContent = "×";
  closeBtn.title = "Close (Esc)";
  closeBtn.onclick = () => { panel.hidden = true; };
  bar.append(inputEl, addBtn, closeBtn);
  listEl = document.createElement("div");
  listEl.className = "ymn-list";
  panel.append(bar, listEl);
  document.body.append(panel);

  // keep YouTube's single-key shortcuts from firing while typing
  panel.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") addNote();
    if (e.key === "Escape") panel.hidden = true;
  });
  panel.addEventListener("keyup", (e) => e.stopPropagation());
  panel.addEventListener("keypress", (e) => e.stopPropagation());
}

function toggle() {
  if (!getId()) return;
  panel.hidden = !panel.hidden;
  if (!panel.hidden) {
    getVideo()?.pause();
    updateAddLabel();
    render();
    inputEl.focus();
  }
}

function onNavigate() {
  videoId = getId();
  if (panel) {
    if (!videoId) panel.hidden = true;
    render();
  }
}

build();
onNavigate();
document.addEventListener("yt-navigate-finish", onNavigate);
setInterval(() => { if (panel && !panel.hidden) updateAddLabel(); }, 500);

// Alt+N toggles the panel (pauses the video so the timestamp stays put)
// capture phase on window so YouTube's own handlers can't swallow it first
window.addEventListener("keydown", (e) => {
  if (e.altKey && e.code === "KeyN") { e.preventDefault(); e.stopPropagation(); toggle(); }
}, true);

// clickable fallback
const fab = document.createElement("button");
fab.id = "ymn-fab";
fab.textContent = "📝";
fab.title = "Moment notes (Option/Alt+N)";
fab.onclick = toggle;
document.body.append(fab);
