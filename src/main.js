import JSZip from "jszip";
import "./style.css";

const app = document.querySelector("#app");

const state = {
  files: [],
  results: new Map(),
  width: 1200,
  height: 1200,
  keepRatio: true,
  quality: 80,
  format: "webp",
  preset: "custom",
  theme: localStorage.getItem("pixelshrink-theme") || "dark"
};

const presets = {
  custom: null,
  instagram: [1080, 1080],
  youtube: [1280, 720],
  linkedin: [1200, 627],
  whatsapp: [1600, 1200],
  hd: [1920, 1080]
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B","KB","MB","GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

function percentSaved(original, result) {
  if (!original) return 0;
  return Math.max(0, Math.round((1 - result / original) * 100));
}

function render() {
  document.documentElement.dataset.theme = state.theme;

  app.innerHTML = `
    <div class="site">
      <header class="header">
        <a class="brand" href="#">PixelShrink</a>
        <nav>
          <a href="#how">How it works</a>
          <a href="#about">About</a>
          <a href="https://github.com/MHazeemShafi/PixelShrink" target="_blank" rel="noreferrer">GitHub</a>
          <button class="theme-btn" id="themeBtn" aria-label="Toggle theme">${state.theme === "dark" ? "Light" : "Dark"}</button>
        </nav>
      </header>

      <main>
        <section class="intro">
          <p class="eyebrow">IMAGE TOOL</p>
          <h1>Resize your images,<br><em>without the hassle.</em></h1>
          <p class="intro-text">A small, straightforward image resizer and compressor. Everything happens on your device.</p>
        </section>

        <section class="tool">
          <div class="dropzone" id="dropzone">
            <div class="upload-mark">+</div>
            <h2>Drop images here</h2>
            <p>or <label for="fileInput">choose files</label></p>
            <input id="fileInput" type="file" accept="image/*" multiple hidden>
            <small>JPG, PNG and WebP · up to 50 images</small>
          </div>

          <div class="controls">
            <div class="control-group">
              <label>Size</label>
              <div class="inputs">
                <input id="width" type="number" min="1" max="12000" value="${state.width}" aria-label="Width">
                <span>×</span>
                <input id="height" type="number" min="1" max="12000" value="${state.height}" aria-label="Height">
                <button id="ratioBtn" class="${state.keepRatio ? "on" : ""}" title="Keep aspect ratio">↗</button>
              </div>
              <div class="presets">
                ${Object.keys(presets).map(p => `<button class="${state.preset === p ? "selected":""}" data-preset="${p}">${p === "custom" ? "Custom" : p[0].toUpperCase()+p.slice(1)}</button>`).join("")}
              </div>
            </div>

            <div class="control-group">
              <div class="label-row"><label>Quality</label><span id="qualityLabel">${state.quality}%</span></div>
              <input id="quality" class="range" type="range" min="10" max="100" value="${state.quality}">
            </div>

            <div class="control-group">
              <label>Format</label>
              <div class="formats">
                ${["webp","jpeg","png"].map(f => `<button class="${state.format === f ? "selected":""}" data-format="${f}">${f === "jpeg" ? "JPG" : f.toUpperCase()}</button>`).join("")}
              </div>
            </div>
          </div>
        </section>

        <section class="files-section ${state.files.length ? "" : "hidden"}">
          <div class="section-title">
            <div><h2>Images</h2><span>${state.files.length} selected</span></div>
            <div class="actions">
              <button class="plain" id="clearBtn">Clear</button>
              <button class="primary" id="processBtn">Resize images</button>
            </div>
          </div>
          <div class="file-list">
            ${state.files.map(file => {
              const result = state.results.get(file.id);
              return `
                <div class="file-row">
                  <img src="${file.url}" alt="" class="thumb">
                  <div class="file-name"><strong>${esc(file.file.name)}</strong><small>${file.width} × ${file.height} · ${formatBytes(file.file.size)}</small></div>
                  <div class="file-result">${result ? `<strong>${formatBytes(result.blob.size)}</strong><small>${result.saved}% smaller</small>` : `<small>Ready</small>`}</div>
                  <button class="remove" data-remove="${file.id}" aria-label="Remove">×</button>
                </div>`;
            }).join("")}
          </div>
        </section>

        <section class="results-section ${state.results.size ? "" : "hidden"}">
          <div class="section-title">
            <div><h2>Finished</h2><span>Your files are ready</span></div>
            <button class="primary" id="zipBtn">Download ZIP</button>
          </div>
          <div class="result-grid">
            ${[...state.results.values()].map(r => `
              <article class="result-card">
                <img src="${r.preview}" alt="">
                <div class="result-card-body">
                  <strong title="${esc(r.name)}">${esc(r.name)}</strong>
                  <small>${r.width} × ${r.height} · ${formatBytes(r.blob.size)} · ${r.saved}% smaller</small>
                  <a class="download" download="${esc(r.name)}" href="${r.url}">Download</a>
                </div>
              </article>`).join("")}
          </div>
        </section>

        <section class="info" id="how">
          <div>
            <p class="eyebrow">HOW TO USE</p>
            <h2>Three simple steps.</h2>
          </div>
          <ol>
            <li><strong>Choose your images.</strong><span>Drop them into the box above or select them from your device.</span></li>
            <li><strong>Pick the size and format.</strong><span>Set custom dimensions, use a preset, and choose the output quality.</span></li>
            <li><strong>Resize and download.</strong><span>Process the images and download them individually or together as a ZIP.</span></li>
          </ol>
        </section>

        <section class="about" id="about">
          <div>
            <p class="eyebrow">ABOUT</p>
            <h2>Made to do one job well.</h2>
          </div>
          <div>
            <p>PixelShrink is a simple image utility for resizing, compressing and converting everyday images.</p>
            <p>It runs entirely in your browser using JavaScript and the Canvas API. Your images aren't uploaded to a server, which makes it useful for quick edits when you don't want to send files anywhere.</p>
            <p class="muted">Free to use · No account · No upload required</p>
          </div>
        </section>
      </main>

      <footer>
        <span>PixelShrink</span>
        <span>Open source · Built for the browser</span>
      </footer>
    </div>
  `;

  bind();
}

function bind() {
  document.querySelector("#themeBtn").onclick = () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("pixelshrink-theme", state.theme);
    render();
  };

  const input = document.querySelector("#fileInput");
  const drop = document.querySelector("#dropzone");
  input.onchange = e => addFiles([...e.target.files]);

  ["dragenter","dragover"].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault();
    drop.classList.add("dragging");
  }));
  ["dragleave","drop"].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault();
    drop.classList.remove("dragging");
  }));
  drop.addEventListener("drop", e => addFiles([...e.dataTransfer.files]));

  document.querySelector("#width").oninput = e => {
    state.width = clamp(+e.target.value || 1, 1, 12000);
    state.preset = "custom";
    if (state.keepRatio && state.files[0]) {
      state.height = Math.max(1, Math.round(state.width / (state.files[0].width / state.files[0].height)));
      document.querySelector("#height").value = state.height;
    }
  };

  document.querySelector("#height").oninput = e => {
    state.height = clamp(+e.target.value || 1, 1, 12000);
    state.preset = "custom";
  };

  document.querySelector("#ratioBtn").onclick = () => {
    state.keepRatio = !state.keepRatio;
    render();
  };

  document.querySelector("#quality").oninput = e => {
    state.quality = +e.target.value;
    document.querySelector("#qualityLabel").textContent = `${state.quality}%`;
  };

  document.querySelectorAll("[data-preset]").forEach(btn => btn.onclick = () => {
    const p = btn.dataset.preset;
    state.preset = p;
    if (presets[p]) [state.width, state.height] = presets[p];
    render();
  });

  document.querySelectorAll("[data-format]").forEach(btn => btn.onclick = () => {
    state.format = btn.dataset.format;
    render();
  });

  document.querySelectorAll("[data-remove]").forEach(btn => btn.onclick = () => {
    const id = btn.dataset.remove;
    const item = state.files.find(f => f.id === id);
    if (item) URL.revokeObjectURL(item.url);
    const old = state.results.get(id);
    if (old) URL.revokeObjectURL(old.url);
    state.files = state.files.filter(f => f.id !== id);
    state.results.delete(id);
    render();
  });

  document.querySelector("#clearBtn")?.addEventListener("click", () => {
    state.files.forEach(f => URL.revokeObjectURL(f.url));
    state.results.forEach(r => URL.revokeObjectURL(r.url));
    state.files = [];
    state.results.clear();
    render();
  });

  document.querySelector("#processBtn")?.addEventListener("click", processAll);
  document.querySelector("#zipBtn")?.addEventListener("click", downloadZip);
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

async function addFiles(files) {
  const images = files.filter(f => f.type.startsWith("image/")).slice(0, 50 - state.files.length);
  for (const file of images) {
    const url = URL.createObjectURL(file);
    try {
      const info = await getImageInfo(url);
      state.files.push({ id: uid(), file, url, width: info.width, height: info.height });
      if (state.preset === "custom" && state.files.length === 1) {
        state.width = info.width;
        state.height = info.height;
      }
    } catch {
      URL.revokeObjectURL(url);
    }
  }
  render();
}

function getImageInfo(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

async function processAll() {
  if (!state.files.length) return;
  const btn = document.querySelector("#processBtn");
  btn.disabled = true;
  btn.textContent = "Resizing…";

  for (const file of state.files) {
    try {
      const result = await resizeImage(file);
      const old = state.results.get(file.id);
      if (old) URL.revokeObjectURL(old.url);
      state.results.set(file.id, result);
      render();
    } catch (err) {
      console.error(err);
    }
  }
}

function targetDimensions(file) {
  if (!state.keepRatio) return [state.width, state.height];
  const ratio = file.width / file.height;
  let w = state.width, h = state.height;
  if (w / h > ratio) w = Math.round(h * ratio);
  else h = Math.round(w / ratio);
  return [Math.max(1, w), Math.max(1, h)];
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const [w, h] = targetDimensions(file);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { alpha: state.format !== "jpeg" });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (state.format === "jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
      }

      ctx.drawImage(img, 0, 0, w, h);

      const mime = state.format === "jpeg" ? "image/jpeg" : `image/${state.format}`;
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error("Could not create image"));
        const ext = state.format === "jpeg" ? "jpg" : state.format;
        const base = file.file.name.replace(/\.[^.]+$/, "");
        const name = `${base}-${w}x${h}.${ext}`;
        const url = URL.createObjectURL(blob);

        resolve({
          blob,
          url,
          preview: url,
          name,
          width: w,
          height: h,
          saved: percentSaved(file.file.size, blob.size)
        });
      }, mime, state.format === "png" ? undefined : state.quality / 100);
    };
    img.onerror = reject;
    img.src = file.url;
  });
}

async function downloadZip() {
  const zip = new JSZip();
  for (const r of state.results.values()) zip.file(r.name, r.blob);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pixelshrink-images.zip";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

render();
