const plataforma = navigator.userAgent;
const presentacion = document.getElementById("presentation-th");
let state = { products: [], movements: [], stock: [] };
const $ = (id) => document.getElementById(id);
const fmt = (n) =>
  Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 3 });
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const API_BASE = (window.API_BASE || "").replace(/\/$/, "");
const apiUrl = (path) => API_BASE + path;

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

function photoSrc(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/uploads/")) return apiUrl(path);
  return new URL(path, document.baseURI).href;
}

function showProductPhoto(path) {
  const box = $("productPhotoPreview");
  if (path) {
    box.innerHTML = `<img src="${esc(photoSrc(path))}" alt="Fotografía del producto" onerror="this.parentElement.innerHTML='<span>Imagen no encontrada</span>'">`;
  } else {
    box.innerHTML = "<span>Sin fotografía</span>";
  }
}

async function api(url, opts = {}) {
  const r = await fetch(apiUrl(url), {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  let d = {};
  try {
    d = await r.json();
  } catch {}
  if (!r.ok) throw Error(d.error || "Error de servidor");
  return d;
}

async function refresh() {
  state = await api("/api/data");
  render();
}

function render() {
  const s = state.stock || [];
  $("statProducts").textContent = state.products.length;
  $("statUnits").textContent = fmt(s.reduce((a, p) => a + p.stock, 0));
  $("statKg").textContent = fmt(s.reduce((a, p) => a + p.stock_kg, 0)) + " kg";
  $("statNegative").textContent = s.filter((p) => p.stock < 0).length;
  $("dashStock").innerHTML =
    s
      .slice(0, 8)
      .map(
        (p) =>
          `<tr><td>${esc(p.codigo)}</td><td>${esc(p.marca)}</td><td>${esc(p.variedad)}</td><td id="presentacion-td">${esc(p.presentacion)}</td><td class="${p.stock < 0 ? "negative" : ""}">${fmt(p.stock)}</td><td>${fmt(p.stock_kg)}</td></tr>`,
      )
      .join("") || empty(6);
  if (plataforma.includes("Android")) {
    //presentacion.classList.add("hide");
    document
      .querySelectorAll("#presentation-th")
      .forEach((th) => th.classList.add("hide"));
    document
      .querySelectorAll("#presentacion-td")
      .forEach((td) => td.classList.add("hide"));
  }
  const recent = [...state.movements]
    .map((m, i) => ({ ...m, index: i }))
    .reverse()
    .slice(0, 6);
  $("dashMovements").innerHTML =
    recent
      .map(
        (m) =>
          `<tr><td>${esc(m.fecha)}</td><td>${typeBadge(m.tipo)}</td><td>${esc(m.codigo)}</td><td>${fmt(m.cantidad)}</td><td>${esc(m.documento)}</td></tr>`,
      )
      .join("") || empty(5);
  renderProducts();
  renderMovements();
  renderStock();
  fillProductSelect();
}

function empty(n) {
  return `<tr><td colspan="${n}" class="empty">No hay registros para mostrar.</td></tr>`;
}

function typeBadge(t) {
  return `<span class="badge ${t === "INGRESO" ? "in" : "out"}">${esc(t)}</span>`;
}

function renderProducts() {
  const q = $("productSearch").value.toLowerCase();
  const rows = state.products.filter((p) =>
    [p.codigo, p.marca, p.variedad].join(" ").toLowerCase().includes(q),
  );
  $("productsBody").innerHTML =
    rows
      .map(
        (p) =>
          `<tr><td><b>${esc(p.codigo)}</b></td><td>${esc(p.marca)}</td><td id="product-td">${esc(p.variedad)}</td><td id="presentacion-td">${esc(p.presentacion)}</td><td>${fmt(p.peso)}</td><td id="foto-td">${p.foto ? `<img class="product-thumb" src="${esc(photoSrc(p.foto))}" alt="${esc(p.variedad)}" loading="lazy" onerror="this.outerHTML='<span class=&quot;no-photo&quot;>No encontrada</span>'">` : '<span class="no-photo">Sin foto</span>'}</td><td>${esc(p.observaciones)}</td><td><div class="actions"><button class="small-btn" data-edit="${esc(p.codigo)}">Editar</button><button class="small-btn" data-delete="${esc(p.codigo)}">×</button></div></td></tr>`,
      )
      .join("") || empty(8);
  if (plataforma.includes("Android")) {
    presentacion.classList.add("hide");
    document
      .querySelectorAll("#presentacion-td")
      .forEach((td) => td.classList.add("hide"));
  }
}

function renderMovements() {
  const q = $("movementSearch").value.toLowerCase();
  const rows = state.movements
    .map((m, i) => ({ ...m, index: i }))
    .filter((m) =>
      [m.fecha, m.tipo, m.codigo, m.documento, m.contacto]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
    .reverse();
  $("movementsBody").innerHTML =
    rows
      .map(
        (m) =>
          `<tr><td>${esc(m.fecha)}</td><td>${typeBadge(m.tipo)}</td><td>${esc(m.codigo)}</td><td>${esc(productName(m.codigo))}</td><td>${fmt(m.cantidad)}</td><td>${esc(m.documento)}</td><td><button class="small-btn" data-mdelete="${m.index}">Eliminar</button></td></tr>`,
      )
      .join("") || empty(7);
}

function renderStock() {
  const q = $("stockSearch").value.toLowerCase();
  const rows = state.stock.filter((p) =>
    [p.codigo, p.marca, p.variedad].join(" ").toLowerCase().includes(q),
  );
  $("stockBody").innerHTML =
    rows
      .map(
        (p) =>
          `<tr><td><b>${esc(p.codigo)}</b></td><td>${esc(p.marca)}</td><td>${esc(p.variedad)}</td><td id="presentacion-td">${esc(p.presentacion)}</td><td>${fmt(p.peso)}</td><td>${fmt(p.ingresos)}</td><td>${fmt(p.salidas)}</td><td class="${p.stock < 0 ? "negative" : ""}">${fmt(p.stock)}</td><td>${fmt(p.stock_kg)}</td></tr>`,
      )
      .join("") || empty(9);
  if (plataforma.includes("Android")) {
    //presentacion.classList.add("hide");
    document
      .querySelectorAll("#presentation-th")
      .forEach((th) => th.classList.add("hide"));
    document
      .querySelectorAll("#presentacion-td")
      .forEach((td) => td.classList.add("hide"));
  }
}

function productName(code) {
  let p = state.products.find((x) => x.codigo === code);
  return p ? `${p.marca} ${p.variedad}` : "";
}

function fillProductSelect() {
  $("mCodigo").innerHTML = state.products
    .map(
      (p) =>
        `<option value="${esc(p.codigo)}">${esc(p.codigo)} — ${esc(p.marca)} ${esc(p.variedad)} (${fmt(p.peso)} kg)</option>`,
    )
    .join("");
}

function showView(view) {
  document
    .querySelectorAll(".view")
    .forEach((x) => x.classList.toggle("active", x.id === view));
  document
    .querySelectorAll(".nav")
    .forEach((x) => x.classList.toggle("active", x.dataset.view === view));
  const titles = {
    dashboard: "Resumen general",
    products: "Productos",
    movements: "Movimientos",
    stock: "Stock actual",
    files: "Importar y exportar",
  };
  $("pageTitle").textContent = titles[view] || "Control de Stock";
}

document
  .querySelectorAll(".nav")
  .forEach((b) => (b.onclick = () => showView(b.dataset.view)));
document
  .querySelectorAll("[data-goto]")
  .forEach((b) => (b.onclick = () => showView(b.dataset.goto)));
$("productSearch").oninput = renderProducts;
$("movementSearch").oninput = renderMovements;
$("stockSearch").oninput = renderStock;

function openProduct(p) {
  $("productForm").reset();
  $("originalCode").value = p?.codigo || "";
  $("productDialogTitle").textContent = p
    ? "Editar producto"
    : "Nuevo producto";
  $("pCodigo").value = p?.codigo || "";
  $("pMarca").value = p?.marca || "";
  $("pVariedad").value = p?.variedad || "";
  $("pPresentacion").value = p?.presentacion || "";
  $("pPeso").value = p?.peso || 0.5;
  $("pFoto").value = p?.foto || "";
  $("pObservaciones").value = p?.observaciones || "";
  showProductPhoto(p?.foto || "");
  $("productDialog").showModal();
}
$("newProduct").onclick = () => openProduct();
$("quickMovement").onclick = () => openMovement();
$("newMovement").onclick = () => openMovement();
$("productsBody").onclick = async (e) => {
  const edit = e.target.dataset.edit,
    del = e.target.dataset.delete;
  if (edit) openProduct(state.products.find((p) => p.codigo === edit));
  if (del && confirm("¿Eliminar este producto?"))
    try {
      await api("/api/products/" + encodeURIComponent(del), {
        method: "DELETE",
      });
      await refresh();
      toast("Producto eliminado");
    } catch (err) {
      toast(err.message);
    }
};

$("pPhotoFile").onchange = () => {
  const file = $("pPhotoFile").files[0];
  if (!file) {
    showProductPhoto($("pFoto").value);
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    $("pPhotoFile").value = "";
    toast("La imagen supera el límite de 8 MB.");
    return;
  }
  if (
    !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)
  ) {
    $("pPhotoFile").value = "";
    toast("Formato no válido. Usá JPG, PNG o WEBP.");
    return;
  }
  const previewUrl = URL.createObjectURL(file);
  $("productPhotoPreview").innerHTML =
    `<img src="${previewUrl}" alt="Vista previa">`;
};
const elCodigo = $("pCodigo");
let elReCodigo;
elCodigo.addEventListener("input", () => {
  const code = elCodigo.value.trim();
  elReCodigo = code.toUpperCase();
});
console.log(elCodigo);
$("saveProduct").onclick = async (e) => {
  e.preventDefault();
  const p = {
    codigo: elReCodigo, //$("pCodigo").value,
    marca: $("pMarca").value,
    variedad: $("pVariedad").value,
    presentacion: $("pPresentacion").value,
    peso: $("pPeso").value,
    foto: $("pFoto").value,
    observaciones: $("pObservaciones").value,
  };
  try {
    const old = $("originalCode").value;
    await api(
      old ? "/api/products/" + encodeURIComponent(old) : "/api/products",
      { method: old ? "PUT" : "POST", body: JSON.stringify(p) },
    );
    const photoFile = $("pPhotoFile").files[0];
    if (photoFile) {
      const fd = new FormData();
      fd.append("image", photoFile);
      const response = await fetch(
        apiUrl("/api/products/" + encodeURIComponent(p.codigo) + "/photo"),
        { method: "POST", body: fd },
      );
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error || "No se pudo subir la fotografía.");
    }
    $("productDialog").close();
    await refresh();
    toast(photoFile ? "Producto y fotografía guardados" : "Producto guardado");
  } catch (err) {
    toast(err.message);
  }
};

function openMovement() {
  $("movementForm").reset();
  $("mFecha").value = new Date().toISOString().slice(0, 10);
  fillProductSelect();
  if (!state.products.length) {
    toast("Primero cargá al menos un producto.");
    return;
  }
  $("movementDialog").showModal();
}

$("saveMovement").onclick = async (e) => {
  e.preventDefault();
  const m = {
    fecha: $("mFecha").value,
    tipo: $("mTipo").value,
    codigo: $("mCodigo").value,
    cantidad: $("mCantidad").value,
    documento: $("mDocumento").value,
    contacto: $("mContacto").value,
    observaciones: $("mObservaciones").value,
  };
  try {
    await api("/api/movements", { method: "POST", body: JSON.stringify(m) });
    $("movementDialog").close();
    await refresh();
    toast("Movimiento registrado");
  } catch (err) {
    toast(err.message);
  }
};

$("movementsBody").onclick = async (e) => {
  const i = e.target.dataset.mdelete;
  if (i !== undefined && confirm("¿Eliminar este movimiento?"))
    try {
      await api("/api/movements/" + i, { method: "DELETE" });
      await refresh();
      toast("Movimiento eliminado");
    } catch (err) {
      toast(err.message);
    }
};

$("importExcel").onclick = async () => {
  const f = $("excelFile").files[0];
  if (!f) {
    toast("Seleccioná un archivo Excel.");
    return;
  }
  if (
    !confirm(
      "La importación reemplazará los datos actuales del servidor. ¿Continuar?",
    )
  )
    return;
  const fd = new FormData();
  fd.append("file", f);
  try {
    const r = await fetch(apiUrl("/api/import"), { method: "POST", body: fd });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    $("importResult").textContent =
      `Importación correcta: ${d.products} productos y ${d.movements} movimientos.`;
    await refresh();
    toast("Planilla importada");
  } catch (e) {
    $("importResult").textContent = e.message;
    toast(e.message);
  }
};

$("exportExcel").onclick = () => {
  window.location.href = apiUrl("/api/export");
};

$("importIni").onclick = async () => {
  const f = $("iniFile").files[0];
  if (!f) {
    toast("Seleccioná el archivo INI.");
    return;
  }
  const fd = new FormData();
  fd.append("file", f);
  try {
    const r = await fetch(apiUrl("/api/import-ini"), {
      method: "POST",
      body: fd,
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    $("iniResult").textContent =
      d.message ||
      `Se asignaron fotografías a ${d.photos_assigned || 0} productos.`;
    toast("Referencias de fotografías importadas");
  } catch (e) {
    $("iniResult").textContent = e.message;
  }
};

$("importIni2").onclick = async () => {
  const f = $("iniFile2").files[0];
  if (!f) {
    toast("Seleccioná el archivo INI.");
    return;
  }
  const fd = new FormData();
  fd.append("file", f);
  try {
    const r = await fetch(apiUrl("/api/import-ini-products"), {
      method: "POST",
      body: fd,
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    $("iniResult2").textContent =
      `Se encontraron ${d.count} variedades que no están en el catálogo. La importación todavía no genera códigos automáticamente.`;
    toast("Listado analizado");
  } catch (e) {
    $("iniResult2").textContent = e.message;
  }
};

refresh().catch((e) =>
  toast("No se pudo conectar con el servidor: " + e.message),
);
