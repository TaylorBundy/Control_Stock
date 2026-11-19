const plataforma = navigator.userAgent;
const presentacion = document.getElementById("presentation-th");
let imagenExpandida = false;
let vistaActual;
let destino;
let a = "";
let b = "";
let scrolll = "";
const inicios = 85;
const target = 20;
let final = "";
//const TargetHeight = document.documentElement.offsetHeight - screen.height;
const TargetHeight = document.documentElement.offsetHeight - window.innerHeight;
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

// Funcion que carga al cargar la pagina
document.addEventListener("DOMContentLoaded", iniciarAplicacion);

// Funcion para iniciar aplicacion
function iniciarAplicacion() {
  cerrarImagenesAlScroll();
  if (plataforma.includes("Android")) {
    vistaActual = "dashboard";
    document.querySelector(
      "body > div.shell > aside > div.brand > div.brand-icon > img",
    ).src = "./Imagenes/logo2.avif";
    document
      .querySelector("body > div.shell > aside > nav > button:nth-child(5)")
      .classList.add("hide");
    creaTop(destino);
    window.onscroll = function () {
      scrollFunction();
    };
  }
}

// Funcion que se ejecuta al hacer scroll
window.onscroll = function () {
  scrollFunction();
};

//definimos la funcion que crea el boton de top para dispositivos moviles
function creaTop(contenedor) {
  document.querySelectorAll(".top").forEach((nodo) => nodo.remove());
  const laSeccion = document.getElementById(vistaActual);
  contenedor = laSeccion;
  if (contenedor === undefined) alert("No existe el bloque destino");
  else {
    var nodoTop = document.createElement("div");
    nodoTop.className = "top";
    contenedor.appendChild(nodoTop);
    var nodo1 = document.querySelector(".top");
    var nodoButton = document.createElement("button");
    nodoButton.id = "myBtn";
    nodoButton.addEventListener("click", topFunction);
    nodo1.appendChild(nodoButton);
  }
}

// When the user scrolls down 20px from the top of the document, show the button
function scrollFunction() {
  const mybutton = document.getElementById("myBtn");
  const topp = document.querySelector(".top");
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    scrolll = window.scrollY;
    mybutton.style.display = "block";
    if (isBottomOfPage()) {
      topp.style.bottom = 20 + "px";
    } else if (
      scrolll <=
      Math.max(document.documentElement.scrollHeight) - window.innerHeight
    ) {
      final = inicios - (TargetHeight - scrolll);
      if (final > target && final <= inicios) {
        topp.style.bottom = Math.max(target, final) + "px";
      } else {
        topp.style.bottom = 20 + "px";
      }
    }
  } else {
    mybutton.style.display = "none";
  }
}

//funcion para determinar si llegamos al final de la pagina
function isBottomOfPage() {
  //return window.scrollY + window.innerHeight >= Math.round(document.documentElement.scrollHeight);
  return (
    window.scrollY + window.innerHeight >= document.documentElement.scrollHeight
  );
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  //const mybutton = document.getElementById("myBtn");
  //document.body.scrollTop = 0; // For Safari
  //document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  if ("scrollTo" in window) {
    // Verifica si el navegador soporta scrollTo
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } else {
    // Fallback para navegadores más antiguos
    let currentScroll =
      document.documentElement.scrollTop || document.body.scrollTop;
    if (currentScroll > 0) {
      window.requestAnimationFrame(topFunction);
      window.scrollTo(0, currentScroll - currentScroll / 8); // Efecto suave manual
    }
  }
}

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
    $("dashStock").innerHTML =
      s
        .slice(0, 8)
        .map(
          (p) =>
            `<tr><td data-label="Código">${esc(p.codigo)}</td><td data-label="Marca">${esc(p.marca)}</td><td data-label="Variedad">${esc(p.variedad)}</td><td data-label="Presentación" id="presentacion-td">${esc(p.presentacion)}</td><td class="${p.stock < 0 ? "negative" : ""}" data-label="Stock">${fmt(p.stock)}</td><td data-label="Stock (kg)">${fmt(p.stock_kg)}</td></tr>`,
        )
        .join("") || empty(6);
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

  // Agrupar por marca
  const grupos = {};

  rows.forEach((p) => {
    const marca = p.marca || "Sin marca";

    if (!grupos[marca]) grupos[marca] = [];

    grupos[marca].push(p);
  });

  $("productsBody").innerHTML =
    Object.entries(grupos)
      .map(
        ([marca, productos]) => `
        <tr>
          <td colspan="8" class="marca-container">

            <div class="marca-separador">

              <div class="marca-titulo">
                ${esc(marca)}
              </div>

              <table class="tabla-marca">
                <tbody>
                  ${productos
                    .map(
                      (p) => `
                        <tr>
                          <td><b>${esc(p.codigo)}</b></td>
                          <td>${esc(p.marca)}</td>
                          <td>${esc(p.variedad)}</td>
                          <td>${esc(p.presentacion)}</td>
                          <td>${fmt(p.peso)} Kg</td>
                          <td class="foto-td">
                            ${
                              p.foto
                                ? `<img class="product-thumb" src="${esc(photoSrc(p.foto))}">`
                                : '<span class="no-photo">Sin foto</span>'
                            }
                          </td>
                          <td>${esc(p.observaciones)}</td>
                          <td>
                            <div class="actions">
                              <button class="small-btn" data-edit="${esc(p.codigo)}">Editar</button>
                              <button class="small-btn" data-delete="${esc(p.codigo)}">×</button>
                            </div>
                          </td>
                        </tr>
                      `,
                    )
                    .join("")}
                </tbody>
              </table>

            </div>

          </td>
        </tr>
      `,
      )
      .join("") || empty(8);
  if (plataforma.includes("Android")) {
    $("productsBody").innerHTML =
      Object.entries(grupos)
        .map(
          ([marca, productos]) => `
        <tr>
          <td colspan="8" class="marca-container">

            <div class="marca-separador">

              <div class="marca-titulo">
                ${esc(marca)}
              </div>

              <table class="tabla-marca">
                <tbody>
                  ${productos
                    .map(
                      (p) => `
                        <tr>
                          <td data-label="Código"><b>${esc(p.codigo)}</b></td>
                          <td data-label="Marca">${esc(p.marca)}</td>
                          <td data-label="Variedad">${esc(p.variedad)}</td>
                          <td id="presentacion-td" data-label="Presentacion">${esc(p.presentacion)}</td>
                          <td data-label="Peso">${fmt(p.peso)} Kg</td>
                          <td class="foto-td">
                            ${
                              p.foto
                                ? `<img class="product-thumb" src="${esc(photoSrc(p.foto))}">`
                                : '<span class="no-photo">Sin foto</span>'
                            }
                          </td>
                          <td id="observaciones-td">${esc(p.observaciones)}</td>
                          <td>
                            <div class="actions">
                              <button class="small-btn" data-edit="${esc(p.codigo)}">Editar</button>
                              <button id="btnDelete" class="small-btn" data-delete="${esc(p.codigo)}">×</button>
                            </div>
                          </td>
                        </tr>
                      `,
                    )
                    .join("")}
                </tbody>
              </table>

            </div>

          </td>
        </tr>
      `,
        )
        .join("") || empty(8);
    presentacion.classList.add("hide");
    document.querySelector("#observaciones-th").classList.add("hide");
    //$("btnDelete").classList.add("hide");
    document
      .querySelectorAll("#btnDelete")
      .forEach((td) => td.classList.add("hide"));
    document
      .querySelectorAll("#presentacion-td")
      .forEach((td) => td.classList.add("hide"));
    document
      .querySelectorAll("#observaciones-td")
      .forEach((td) => td.classList.add("hide"));
  } else {
    document.querySelectorAll(".foto-td").forEach((td) => {
      td.addEventListener("click", () => {
        const img = td.querySelector("img");

        if (img) {
          if (imagenExpandida) {
            cerrarImagen();
          } else {
            expandirImagenUnica(img);
          }
        }
      });
    });
  }

  // Acá mantenés tus configuraciones de Android y eventos.
}
// Funcion que renderiza los productos
function renderProducts2() {
  const q = $("productSearch").value.toLowerCase();
  const rows = state.products.filter((p) =>
    [p.codigo, p.marca, p.variedad].join(" ").toLowerCase().includes(q),
  );
  $("productsBody").innerHTML =
    rows
      .map(
        (p) =>
          `<tr><td><b>${esc(p.codigo)}</b></td><td>${esc(p.marca)}</td><td id="product-td">${esc(p.variedad)}</td><td id="presentacion-td">${esc(p.presentacion)}</td><td>${fmt(p.peso)} Kg</td><td id="foto-td" class="foto-td">${p.foto ? `<img class="product-thumb" src="${esc(photoSrc(p.foto))}" alt="${esc(p.variedad)}" loading="lazy" onerror="this.outerHTML='<span class=&quot;no-photo&quot;>No encontrada</span>'">` : '<span class="no-photo">Sin foto</span>'}</td><td id="observaciones-td">${esc(p.observaciones)}</td><td><div class="actions"><button class="small-btn" data-edit="${esc(p.codigo)}">Editar</button><button id="btnDelete" class="small-btn" data-delete="${esc(p.codigo)}">×</button></div></td></tr>`,
      )
      .join("") || empty(8);
  if (plataforma.includes("Android")) {
    $("productsBody").innerHTML =
      rows
        .map(
          (p) =>
            `<tr><td data-label="Código"><b>${esc(p.codigo)}</b></td><td data-label="Marca">${esc(p.marca)}</td><td data-label="Variedad" id="product-td">${esc(p.variedad)}</td><td data-label="Presentación" id="presentacion-td">${esc(p.presentacion)}</td><td data-label="Peso">${fmt(p.peso)} Kg</td><td id="foto-td" class="foto-td">${p.foto ? `<img class="product-thumb" src="${esc(photoSrc(p.foto))}" alt="${esc(p.variedad)}" loading="lazy" onerror="this.outerHTML='<span class=&quot;no-photo&quot;>No encontrada</span>'">` : '<span class="no-photo">Sin foto</span>'}</td><td data-label="Observaciones" id="observaciones-td">${esc(p.observaciones)}</td><td><div class="actions"><button class="small-btn" data-edit="${esc(p.codigo)}">Editar</button><button id="btnDelete" class="small-btn" data-delete="${esc(p.codigo)}">×</button></div></td></tr>`,
        )
        .join("") || empty(8);
    presentacion.classList.add("hide");
    document.querySelector("#observaciones-th").classList.add("hide");
    //$("btnDelete").classList.add("hide");
    document
      .querySelectorAll("#btnDelete")
      .forEach((td) => td.classList.add("hide"));
    document
      .querySelectorAll("#presentacion-td")
      .forEach((td) => td.classList.add("hide"));
    document
      .querySelectorAll("#observaciones-td")
      .forEach((td) => td.classList.add("hide"));
    document.querySelectorAll(".foto-td").forEach((td) => {
      td.addEventListener("click", () => {
        const img = td.querySelector("img");

        if (img) {
          if (imagenExpandida) {
            cerrarImagen();
          } else {
            expandirImagenUnica(img);
          }
        }
      });
    });
  } else {
    document.querySelectorAll(".foto-td").forEach((td) => {
      td.addEventListener("click", () => {
        const img = td.querySelector("img");

        if (img) {
          if (imagenExpandida) {
            cerrarImagen();
          } else {
            expandirImagenUnica(img);
          }
        }
      });
    });
  }
}

// Funcion que expande la imagen y cierra la anterior si hay una abierta
function expandirImagenUnica(img) {
  const actual = document.querySelector(".img-expandida");

  if (actual && actual !== img) {
    actual.classList.remove("img-expandida");
  }

  img.classList.add("img-expandida");
  imagenExpandida = true;
}

// Funcion que cierra la imagen expandida
function cerrarImagen() {
  const img = document.querySelector(".img-expandida");
  if (img) img.classList.remove("img-expandida");
  imagenExpandida = false;
}

// Funcion que cierra las imagenes que estan expandidas al hacer scroll
function cerrarImagenesAlScroll() {
  window.addEventListener("scroll", () => {
    if (imagenExpandida) {
      cerrarImagen();
    }
  });
}

// Funcion que renderiza los movimientos
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
          `<tr><td>${esc(m.fecha)}</td><td>${typeBadge(m.tipo)}</td><td>${esc(m.codigo)}</td><td>${esc(productName(m.codigo))}</td><td>${fmt(m.cantidad)} Un</td><td>${esc(m.documento)}</td><td><button class="small-btn" data-mdelete="${m.index}">Eliminar</button></td></tr>`,
      )
      .join("") || empty(7);
  if (plataforma.includes("Android")) {
    $("movementsBody").innerHTML =
      rows
        .map(
          (m) =>
            `<tr><td data-label="Fecha">${esc(m.fecha)}</td><td data-label="Tipo">${typeBadge(m.tipo)}</td><td data-label="Código">${esc(m.codigo)}</td><td data-label="Producto">${esc(productName(m.codigo))}</td><td data-label="Cantidad">${fmt(m.cantidad)} Un</td><td data-label="Referencia">${esc(m.documento)}</td><td><button class="small-btn" data-mdelete="${m.index}">Eliminar</button></td></tr>`,
        )
        .join("") || empty(7);
  }
}

// Funcion que renderiza el stock
function renderStock() {
  const q = $("stockSearch").value.toLowerCase();
  const rows = state.stock.filter((p) =>
    [p.codigo, p.marca, p.variedad].join(" ").toLowerCase().includes(q),
  );
  const grupos = {};
  rows.forEach((p) => {
    const marca = p.marca || "Sin marca";

    if (!grupos[marca]) grupos[marca] = [];

    grupos[marca].push(p);
  });
  $("stockBody").innerHTML =
    rows
      .map(
        (p) =>
          `<tr><td><b>${esc(p.codigo)}</b></td><td>${esc(p.marca)}</td><td>${esc(p.variedad)}</td><td id="presentacion-td">${esc(p.presentacion)}</td><td>${fmt(p.peso)} Kg</td><td>${fmt(p.ingresos)} Un</td><td>${fmt(p.salidas)} Un</td><td class="${p.stock < 0 ? "negative" : ""}">${fmt(p.stock)} Un</td><td>${fmt(p.stock_kg)} Kg</td></tr>`,
      )
      .join("") || empty(9);
  if (plataforma.includes("Android")) {
    // $("stockBody").innerHTML =
    //   rows
    //     .map(
    //       (p) =>
    //         `<tr><td data-label="Código"><b>${esc(p.codigo)}</b></td><td data-label="Marca">${esc(p.marca)}</td><td data-label="Variedad">${esc(p.variedad)}</td><td data-label="Presentación" id="presentacion-td">${esc(p.presentacion)}</td><td data-label="Peso">${fmt(p.peso)} Kg</td><td data-label="Ingresos">${fmt(p.ingresos)} Un</td><td data-label="Salidas">${fmt(p.salidas)} Un</td><td class="${p.stock < 0 ? "negative" : ""}" data-label="Stock">${fmt(p.stock)} Un</td><td data-label="Stock (kg)">${fmt(p.stock_kg)} Kg</td><td id="foto-td" class="foto-td">${p.foto ? `<img class="product-thumb" src="${esc(photoSrc(p.foto))}" alt="${esc(p.variedad)}" loading="lazy" onerror="this.outerHTML='<span class=&quot;no-photo&quot;>No encontrada</span>'">` : '<span class="no-photo">Sin foto</span>'}</td></tr>`,
    //     )
    //     .join("") || empty(9);
    $("stockBody").innerHTML =
      Object.entries(grupos)
        .map(
          ([marca, productos]) => `
        <tr>
          <td colspan="8" class="marca-container">

            <div class="marca-separador">

              <div class="marca-titulo">
                ${esc(marca)}
              </div>

              <table class="tabla-marca">
                <tbody>
                  ${productos
                    .map(
                      (p) => `
                          <tr>
                            <td data-label="Código"><b>${esc(p.codigo)}</b></td>
                            <td data-label="Marca">${esc(p.marca)}</td>
                            <td data-label="Variedad">${esc(p.variedad)}</td>
                            <td data-label="Presentación" id="presentacion-td">${esc(p.presentacion)}</td>
                            <td data-label="Peso">${fmt(p.peso)} Kg</td>
                            <td data-label="Ingresos">${fmt(p.ingresos)} Un</td>
                            <td data-label="Salidas">${fmt(p.salidas)} Un</td>
                            <td class="${p.stock < 0 ? "negative" : ""}" data-label="Stock">${fmt(p.stock)} Un</td>
                            <td data-label="Stock (kg)">${fmt(p.stock_kg)} Kg</td>
                            <td id="foto-td" class="foto-td">${p.foto ? `<img class="product-thumb" src="${esc(photoSrc(p.foto))}" alt="${esc(p.variedad)}" loading="lazy" onerror="this.outerHTML='<span class=&quot;no-photo&quot;>No encontrada</span>'">` : '<span class="no-photo">Sin foto</span>'}</td>
                          </tr>`,
                    )
                    .join("")}
                  </tbody>
                </table>

              </div>

            </td>
          </tr>
        `,
        )
        .join("") || empty(9);
    //presentacion.classList.add("hide");
    document
      .querySelectorAll("#presentation-th")
      .forEach((th) => th.classList.add("hide"));
    document
      .querySelectorAll("#presentacion-td")
      .forEach((td) => td.classList.add("hide"));
    document.querySelectorAll(".foto-td").forEach((td) => {
      td.addEventListener("click", () => {
        const img = td.querySelector("img");

        if (img) {
          if (imagenExpandida) {
            cerrarImagen();
          } else {
            expandirImagenUnica(img);
          }
        }
      });
    });
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
  vistaActual = view;
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
  creaTop(vistaActual);
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

// Funcion que cierra los modales
function closeProduct() {
  // $("productDialog").close();
  if ($("productDialog").open) {
    $("productDialog").close();
  }
  if ($("movementDialog").open) {
    $("movementDialog").close();
  }
}

// Funcion para abrir los productos
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
const laMarca = document.getElementById("pMarca");
const elCodigo = document.getElementById("pCodigo");
const buscamos = document.getElementById("productSearch");

laMarca.addEventListener("input", function () {
  this.value = this.value.toUpperCase();
});

elCodigo.addEventListener("input", function () {
  this.value = this.value.toUpperCase();
});

buscamos.addEventListener("input", function () {
  this.value = this.value.toUpperCase();
});

$("saveProduct").onclick = async (e) => {
  e.preventDefault();
  const p = {
    codigo: $("pCodigo").value,
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

// Funcion para abrir los movimientos
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
