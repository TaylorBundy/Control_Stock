"use strict";

// ========================================
// CONFIGURACIÓN
// ========================================

const plataforma = navigator.userAgent;

const API_BASE = (window.API_BASE || "").replace(/\/$/, "");

const apiUrl = (path) => API_BASE + path;

let state = {
  products: [],
  movements: [],
  stock: [],
};

let imagenExpandida = false;
let filaExpandida = false;
let vistaActual;
let destino;
let a = "";
let b = "";
let scrolll = "";
const inicios = 85;
const target = 20;
let final = "";
let modoLocal = false;
let archivoLocal = null;
//const TargetHeight = document.documentElement.offsetHeight - screen.height;
const TargetHeight = document.documentElement.offsetHeight - window.innerHeight;
// Funcion que carga al cargar la pagina
document.addEventListener("DOMContentLoaded", iniciarAplicacion);
// Funcion para iniciar aplicacion
function iniciarAplicacion() {
  vistaActual = "stock-main-id";
  if (plataforma.includes("Android")) {
    document.querySelector("body > header > div > div.brand-icon > img").src =
      "./Imagenes/logo2.avif";
  }
  cerrarImagenesAlScroll();
  //   if (plataforma.includes("Android")) {
  //     document.querySelector("#btnJSON").classList.add("hide");
  //     document.querySelector("#btnSERVER").classList.add("hide");
  //     document.querySelector(
  //       "body > div.shell > aside > div.brand > div.brand-icon > img",
  //     ).src = "./Imagenes/logo2.avif";
  //     document
  //       .querySelector("body > div.shell > aside > nav > button:nth-child(5)")
  //       .classList.add("hide");
  //   }
  creaTop(vistaActual);
  creaBottom(vistaActual);
  window.onscroll = function () {
    scrollFunction();
  };
}

// Funcion que se ejecuta al hacer scroll
window.onscroll = function () {
  scrollFunction();
};

//definimos la funcion que crea el boton de top para dispositivos moviles
function creaTop(contenedor) {
  console.log(contenedor);
  //document.querySelectorAll(".top").forEach((nodo) => nodo.remove());
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
    nodoButton.title = "Click para subir";
    nodoButton.addEventListener("click", topFunction);
    nodo1.appendChild(nodoButton);
  }
}

//definimos la funcion que crea el boton de top para dispositivos moviles
function creaBottom(contenedor) {
  document.querySelectorAll(".bottom").forEach((nodo) => nodo.remove());
  const laSeccion = document.getElementById(vistaActual);
  contenedor = laSeccion;
  if (contenedor === undefined) alert("No existe el bloque destino");
  else {
    var nodoTop = document.createElement("div");
    nodoTop.className = "bottom";
    contenedor.appendChild(nodoTop);
    var nodo1 = document.querySelector(".bottom");
    var nodoButton = document.createElement("button");
    nodoButton.id = "myBtn2";
    nodoButton.title = "Click para bajar";
    nodoButton.addEventListener("click", bottomFunction);
    nodo1.appendChild(nodoButton);
  }
}

// When the user scrolls down 20px from the top of the document, show the button
function scrollFunction() {
  const mybutton = document.getElementById("myBtn");
  const topp = document.querySelector(".top");
  const mybutton2 = document.getElementById("myBtn2");
  const topp2 = document.querySelector(".bottom");
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    scrolll = window.scrollY;
    mybutton.style.display = "block";
    mybutton2.style.display = "block";
    if (isBottomOfPage()) {
      topp.style.bottom = 60 + "px";
      topp2.style.bottom = 20 + "px";
      mybutton2.style.display = "none";
    } else if (
      scrolll <=
      Math.max(document.documentElement.scrollHeight) - window.innerHeight
    ) {
      final = inicios - (TargetHeight - scrolll);
      if (final > target && final <= inicios) {
        topp.style.bottom = Math.max(target, final) + "px";
      } else {
        topp.style.bottom = 60 + "px";
      }
    }
  } else {
    mybutton.style.display = "none";
    mybutton2.style.display = "none";
  }

  //   if (isBottomOfPage()) {
  //     topp2.style.bottom = 20 + "px";
  //   } else if (
  //     scrolll <=
  //     Math.max(document.documentElement.scrollHeight) - window.innerHeight
  //   ) {
  //     final = inicios - (TargetHeight - scrolll);
  //     if (final > target && final <= inicios) {
  //       topp2.style.bottom = Math.max(target, final) + "px";
  //     } else {
  //       topp2.style.bottom = 20 + "px";
  //     }

  // } else {
  //   mybutton2.style.display = "none";
  // }
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

// When the user clicks on the button, scroll to the bottom of the document
function bottomFunction() {
  const bottom = document.documentElement.scrollHeight;

  if ("scrollTo" in window) {
    window.scrollTo({
      top: bottom,
      behavior: "smooth",
    });
  } else {
    window.scrollTo(0, bottom);
  }
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

const $ = (id) => document.getElementById(id);

const fmt = (n) =>
  Number(n || 0).toLocaleString("es-AR", {
    maximumFractionDigits: 3,
  });

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

function empty(n) {
  return `
        <tr>
            <td colspan="${n}" class="empty">
                No hay registros para mostrar.
            </td>
        </tr>
    `;
}

// ========================================
// API
// ========================================

async function api(url) {
  const response = await fetch(apiUrl(url), {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error de servidor");
  }

  return data;
}

// ========================================
// CÁLCULO DE STOCK
// ========================================

function stockRows(data) {
  return data.products.map((p) => {
    const movimientos = data.movements.filter((m) => m.codigo === p.codigo);

    const ins = movimientos
      .filter((m) => m.tipo === "INGRESO")
      .reduce((a, m) => a + Number(m.cantidad), 0);

    const outs = movimientos
      .filter((m) => m.tipo === "SALIDA")
      .reduce((a, m) => a + Number(m.cantidad), 0);

    const stock = ins - outs;

    return {
      ...p,
      ingresos: ins,
      salidas: outs,
      stock,
      stock_kg: stock * Number(p.peso || 0),
    };
  });
}

// ========================================
// CARGAR STOCK
// ========================================

async function loadStock() {
  const btn = $("refreshStock");

  try {
    btn.disabled = true;
    btn.innerHTML = `<img class="agregar" src="./Imagenes/Iconos/actualizar.avif" alt="Logo"/>Cargando...`; //"Cargando...";

    $("stockBody").innerHTML = `
            <tr>
                <td>Cargando stock...</td>
            </tr>
        `;

    const data = await api("/api/data");

    state.products = data.products || [];
    state.movements = data.movements || [];

    // Utilizar el stock que devuelve el servidor.
    // Si no existe, calcularlo a partir de movimientos.

    state.stock = Array.isArray(data.stock) ? data.stock : stockRows(data);

    renderStock();
  } catch (error) {
    console.error("Error cargando stock:", error);

    $("stockBody").innerHTML = `
            <tr>
                <td class="empty">
                    No se pudo cargar el stock.
                    <br>
                    ${esc(error.message)}
                </td>
            </tr>
        `;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<img class="agregar" src="./Imagenes/Iconos/actualizar.avif" alt="Logo"/>Actualizar`; //"↻ Actualizar";
  }
}

// ========================================
// RENDERIZAR STOCK
// ========================================

function photoSrc(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/uploads/")) return apiUrl(path);
  return new URL(path, document.baseURI).href;
}

// Acá colocás tu función renderStock()
// exactamente como la tenés actualmente.
//
// No necesitás modificar su lógica.
// Funcion que renderiza el stock
let claseStock;
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

  const esAndroid = plataforma.includes("Android");

  // Genera una tabla individual con sus propios encabezados
  function renderTabla(productos) {
    return `
      <table class="tabla-marca">
        <thead>
          <tr>
            <th class="codigoProductos">Código</th>
            <th>Marca</th>
            <th id="product-th">Variedad</th>
            ${!esAndroid ? "<th>Presentación</th>" : ""}
            <th>Peso unit.</th>
            <th>Stock</th>
            <th>Foto</th>
          </tr>
        </thead>

        <tbody>
          ${productos
            .map((p) => {
              claseStock =
                p.stock < 0 ? "negativeTR" : p.stock > 0 ? "positiveTR" : "";

              return `
              <!-- <tr ${esAndroid ? `class="${claseStock}"` : ""}> -->
              <tr class="${esAndroid ? `fila-expandible ${claseStock}` : ""}">
                <td ${!esAndroid ? `class="${claseStock}"` : ""} data-label="Código">
                  <b>${esc(p.codigo)}</b>
                </td>

                <td ${!esAndroid ? `class="${claseStock}"` : ""} data-label="Marca">
                  ${esc(p.marca)}
                </td>

                <td ${!esAndroid ? `class="${claseStock}"` : ""} data-label="Variedad">
                  ${esc(p.variedad)}
                </td>

                ${
                  !esAndroid
                    ? `
                      <td class="${claseStock}" data-label="Presentación">
                        ${esc(p.presentacion)}
                      </td>
                    `
                    : ""
                }

                <td ${!esAndroid ? `class="${claseStock}"` : ""} data-label="Peso">
                  ${fmt(p.peso)} Kg
                </td>

                <td ${!esAndroid ? `class="${claseStock}"` : ""} data-label="Stock">
                  ${fmt(p.stock)} Un
                </td>

                <td ${!esAndroid ? `class="${claseStock}"` : "foto-td"}>
                  ${
                    p.foto
                      ? `<img class="product-thumb"
                          src="${esc(photoSrc(p.foto))}"
                          alt="${esc(p.variedad)}"
                          loading="lazy"
                          onerror="this.outerHTML='<span class=&quot;no-photo&quot;>No encontrada</span>'">`
                      : '<span class="no-photo">Sin foto</span>'
                  }
                </td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    `;
  }

  $("stockBody").innerHTML =
    Object.entries(grupos)
      .map(([marca, productos]) => {
        // Dividir los productos en dos columnas equilibradas
        const mitad = Math.ceil(productos.length / 2);

        const columnas = [
          productos.slice(0, mitad),
          productos.slice(mitad),
        ].filter((columna) => columna.length > 0);

        return `
          <tr>
            <td colspan="9" class="marca-container">

              <div class="marca-separador">

                <div class="marca-titulo">
                  ${esc(marca)}
                  <span class="cantidad-productos">
                    ${productos.length} productos
                  </span>
                </div>

                <div class="columnas-productos">

                  ${columnas.map((columna) => renderTabla(columna)).join("")}

                </div>

              </div>

            </td>
          </tr>
        `;
      })
      .join("") || empty(7);
  if (esAndroid) {
    document.querySelectorAll(".fila-expandible").forEach((tr) => {
      tr.addEventListener("click", () => {
        //tr.classList.toggle("expandido");

        if (filaExpandida) {
          cerrarFila();
        } else {
          expandirFilaUnica(tr);
        }
      });
    });
  }

  // Eventos para ampliar fotografías
  document.querySelectorAll(".product-thumb").forEach((td) => {
    // td.classList.add(`${claseStock}`);
    const elementoPadre = td.parentElement;
    elementoPadre.classList.add("foto-td");
    // console.log(elementoPadre);
    elementoPadre.addEventListener("click", (event) => {
      event.stopPropagation();
      const img = elementoPadre.querySelector("img");

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

function renderStock2() {
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
  // $("stockBody").innerHTML =
  //   rows
  //     .map(
  //       (p) =>
  //         `<tr><td><b>${esc(p.codigo)}</b></td><td>${esc(p.marca)}</td><td>${esc(p.variedad)}</td><td id="presentacion-td">${esc(p.presentacion)}</td><td>${fmt(p.peso)} Kg</td><td>${fmt(p.ingresos)} Un</td><td>${fmt(p.salidas)} Un</td><td class="${p.stock < 0 ? "negative" : ""}">${fmt(p.stock)} Un</td><td>${fmt(p.stock_kg)} Kg</td></tr>`,
  //     )
  //     .join("") || empty(9);
  $("stockBody").innerHTML =
    Object.entries(grupos)
      .map(
        ([marca, productos]) => `
        <tr>
          <td colspan="9" class="marca-container">

            <div class="marca-separador">

              <div class="marca-titulo">
                ${esc(marca)}
                <span class="cantidad-productos">
                  ${productos.length} productos
                </span>
              </div>

              <table class="tabla-marca">
                <thead>
                  <tr>
                    <th class="codigoProductos">Código</th>
                    <th >Marca</th>
                    <th id="product-th">Variedad</th>
                    <th id="presentation-th">Presentación</th>
                    <th>Peso unit.</th>
                    <!-- <th>Ingresos</th> -->
                    <!-- <th>Salidas</th> -->
                    <th>Stock</th>
                    <th>Foto</th>
                  </tr>
                </thead>
                <tbody>
                  ${productos
                    .map(
                      (p) => `
                          <tr >
                            <td class="${p.stock < 0 ? "negativeTR" : p.stock > 0 ? "positiveTR" : ""}" style="width:10%;" data-label="Código"><b>${esc(p.codigo)}</b></td>
                            <td class="${p.stock < 0 ? "negativeTR" : p.stock > 0 ? "positiveTR" : ""}" style="width:10%;" data-label="Marca">${esc(p.marca)}</td>
                            <td class="${p.stock < 0 ? "negativeTR" : p.stock > 0 ? "positiveTR" : ""}" style="width:40%;" data-label="Variedad">${esc(p.variedad)}</td>
                            <td class="${p.stock < 0 ? "negativeTR" : p.stock > 0 ? "positiveTR" : ""}" style="width:10%;" data-label="Presentación" id="presentacion-td">${esc(p.presentacion)}</td>
                            <td class="${p.stock < 0 ? "negativeTR" : p.stock > 0 ? "positiveTR" : ""}" style="width:10%;" data-label="Peso">${fmt(p.peso)} Kg</td>
                            <!-- <td class="${p.stock < 0 ? "negativeTR" : p.stock > 0 ? "positiveTR" : ""}" data-label="Ingresos">${fmt(p.ingresos)} Un</td> -->
                            <!-- <td class="${p.stock < 0 ? "negativeTR" : p.stock > 0 ? "positiveTR" : ""}" data-label="Salidas">${fmt(p.salidas)} Un</td> -->
                            <td class="${p.stock < 0 ? "negative" : p.stock > 0 ? "positive" : ""}" style="width:10%;" data-label="Stock">${fmt(p.stock)} Un</td>
                            <!-- <td class="${p.stock < 0 ? "negativeTR" : p.stock > 0 ? "positiveTR" : ""}" data-label="Stock (kg)">${fmt(p.stock_kg)} Kg</td> -->
                            <!-- <td id="foto-td" class="foto-td">${p.foto ? `<img class="product-thumb" src="${esc(photoSrc(p.foto))}" alt="${esc(p.variedad)}" loading="lazy" onerror="this.outerHTML='<span class=&quot;no-photo&quot;>No encontrada</span>'">` : '<span class="no-photo">Sin foto</span>'}</td> -->
                            <td style="width:10%;" id="foto-td" class="foto-td">${p.foto ? `<img class="product-thumb" src="${esc(photoSrc(p.foto))}" alt="${esc(p.variedad)}" loading="lazy" onerror="this.outerHTML='<span class=&quot;no-photo&quot;>No encontrada</span>'">` : '<span class="no-photo">Sin foto</span>'}</td>
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
      .join("") || empty(7);
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
                <span class="cantidad-productos">
                  ${productos.length} productos
                </span>
              </div>

              <table class="tabla-marca">
                <tbody>
                  ${productos
                    .map(
                      (p) => `
                          <tr class="${p.stock < 0 ? "negative" : p.stock > 0 ? "positive" : ""}">
                            <td data-label="Código"><b>${esc(p.codigo)}</b></td>
                            <td data-label="Marca">${esc(p.marca)}</td>
                            <td data-label="Variedad">${esc(p.variedad)}</td>
                            <td data-label="Presentación" id="presentacion-td">${esc(p.presentacion)}</td>
                            <td data-label="Peso">${fmt(p.peso)} Kg</td>
                            <!-- <td data-label="Ingresos">${fmt(p.ingresos)} Un</td> -->
                            <!-- <td data-label="Salidas">${fmt(p.salidas)} Un</td> -->
                            <td data-label="Stock">${fmt(p.stock)} Un</td>
                            <!-- <td data-label="Stock (kg)">${fmt(p.stock_kg)} Kg</td> -->
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
  }
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

// ========================================
// IMÁGENES (COMPATIBILIDAD ANDROID)
// ========================================

function expandirImagenUnica(img) {
  const actual = document.querySelector(".img-expandida");

  if (actual && actual !== img) {
    actual.classList.remove("img-expandida");
  }

  img.classList.add("img-expandida");
  imagenExpandida = true;
}

function expandirFilaUnica(img) {
  const actual = document.querySelector(".expandido");

  if (actual && actual !== img) {
    actual.classList.remove("expandido");
  }

  img.classList.add("expandido");
  filaExpandida = true;
}

function cerrarImagen() {
  const img = document.querySelector(".img-expandida");

  if (img) img.classList.remove("img-expandida");

  imagenExpandida = false;
}
function cerrarFila() {
  const img = document.querySelector(".expandido");

  if (img) img.classList.remove("expandido");

  filaExpandida = false;
}
// Funcion que cierra las imagenes que estan expandidas al hacer scroll
function cerrarImagenesAlScroll() {
  window.addEventListener("scroll", () => {
    if (imagenExpandida) {
      cerrarImagen();
    }
    if (filaExpandida) {
      cerrarFila();
    }
  });
}
// ========================================
// EVENTOS
// ========================================

$("stockSearch").addEventListener("input", renderStock);

$("refreshStock").addEventListener("click", loadStock);

document.addEventListener("DOMContentLoaded", loadStock);
