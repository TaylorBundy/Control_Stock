from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
from datetime import datetime
import json, os, io, configparser, re, shutil, unicodedata, uuid
import base64
import requests
from urllib.parse import quote

BASE = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("DATA_DIR", str(BASE / "data")))
DATA_FILE = DATA_DIR / "stock.json"
TEMPLATE = BASE / "Control_Stock_Yerbas_plantilla.xlsm"
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
UPLOAD_DIR = DATA_DIR / "uploads"
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_OWNER = os.getenv("GITHUB_OWNER")
GITHUB_REPO = os.getenv("GITHUB_REPO")
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")
CORS(app, resources={r"/api/*": {"origins": os.environ.get("FRONTEND_ORIGIN", "*")}})


@app.get("/health")
def health():
    return jsonify(status="ok")


# def load_data():
#     if not DATA_FILE.exists():
#         seed = BASE / "data" / "stock.json"
#         if seed.exists():
#             DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
#             shutil.copy2(seed, DATA_FILE)
#         else:
#             return {"products": [], "movements": []}
#     data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
#     data.setdefault("photo_map", {})
#     apply_photo_map(data)
#     return data


def load_data():
    try:
        url = (
            f"https://api.github.com/repos/"
            f"{GITHUB_OWNER}/{GITHUB_REPO}/contents/"
            f"backend/data/stock.json"
        )

        headers = {
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        response = requests.get(
            url, headers=headers, params={"ref": GITHUB_BRANCH}, timeout=30
        )

        response.raise_for_status()

        contenido = response.json()

        import base64

        archivo = base64.b64decode(contenido["content"]).decode("utf-8")

        data = json.loads(archivo)

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            data = {"products": [], "movements": [], "photo_map": {}}
        else:
            raise Exception(f"Error leyendo stock.json desde GitHub: {e}")

    data.setdefault("products", [])
    data.setdefault("movements", [])
    data.setdefault("photo_map", {})

    apply_photo_map(data)

    return data


def save_data(data):
    DATA_FILE.parent.mkdir(exist_ok=True)
    tmp = DATA_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(DATA_FILE)


def save_file(path, content, message=None):
    """
    Guarda o actualiza cualquier archivo directamente en GitHub.

    path:
        Ruta del archivo dentro del repositorio.

    content:
        dict/list = JSON
        str       = texto (INI, TXT, etc.)
        bytes     = imágenes u otros archivos binarios
    """

    if not all([GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO]):
        raise Exception("Faltan las variables de configuración de GitHub.")

    # Convertir el contenido a bytes
    if isinstance(content, (dict, list)):
        content = json.dumps(content, ensure_ascii=False, indent=2).encode("utf-8")

    elif isinstance(content, str):
        content = content.encode("utf-8")

    elif not isinstance(content, bytes):
        raise TypeError("Tipo de contenido no soportado.")

    # Codificar contenido en Base64
    encoded_content = base64.b64encode(content).decode("utf-8")

    # API de GitHub
    api_url = (
        f"https://api.github.com/repos/"
        f"{GITHUB_OWNER}/{GITHUB_REPO}/contents/"
        f"{quote(path, safe='/')}"
    )

    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    # Consultar si el archivo ya existe
    response = requests.get(
        api_url, headers=headers, params={"ref": GITHUB_BRANCH}, timeout=30
    )

    if response.status_code == 200:
        sha = response.json()["sha"]

    elif response.status_code == 404:
        sha = None

    else:
        raise Exception(
            f"Error consultando GitHub: {response.status_code} " f"{response.text}"
        )

    # Preparar actualización
    payload = {
        "message": message or f"Actualizar {path}",
        "content": encoded_content,
        "branch": GITHUB_BRANCH,
    }

    # GitHub exige SHA para modificar archivos existentes
    if sha:
        payload["sha"] = sha

    # Crear o actualizar archivo
    response = requests.put(api_url, headers=headers, json=payload, timeout=60)

    if response.status_code not in (200, 201):
        raise Exception(
            f"Error guardando en GitHub: {response.status_code} " f"{response.text}"
        )

    result = response.json()

    return {
        "success": True,
        "path": path,
        "sha": result["content"]["sha"],
        "commit": result["commit"]["html_url"],
    }


def normalize_key(value):
    value = unicodedata.normalize("NFKD", str(value or ""))
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return " ".join(value.casefold().strip().split())


# def load_photo_map(data):
#     return data.setdefault("photo_map", {})


def photo_key(brand, variety):
    return normalize_key(brand) + "|" + normalize_key(variety)


# def apply_photo_map(data):
#     mapping = load_photo_map(data)
#     for product in data.get("products", []):
#         path = mapping.get(photo_key(product.get("marca"), product.get("variedad")))
#         if path and not str(product.get("foto", "")).startswith("/uploads/"):
#             product["foto"] = path


# def parse_ini_photo_map(raw):
#     try:
#         content = raw.decode("utf-8-sig")
#     except UnicodeDecodeError:
#         content = raw.decode("cp1252", errors="replace")
#     parser = configparser.ConfigParser(interpolation=None)
#     parser.optionxform = str
#     parser.read_string(content)
#     mapping = {}
#     for brand in parser.sections():
#         values = parser[brand]
#         for key, value in values.items():
#             if key.lower().startswith("imagen."):
#                 variety = key[len("imagen.") :].strip()
#                 path = value.strip().replace("\\\\", "/").replace("\\", "/")
#                 path = path.lstrip("./")
#                 if path:
#                     mapping[photo_key(brand, variety)] = "./" + path
#     return mapping


def load_photo_map(data):
    """
    Descarga el mapa de fotografías desde el INI de GitHub.
    """
    url = (
        f"https://api.github.com/repos/"
        f"{GITHUB_OWNER}/{GITHUB_REPO}/contents/"
        f"backend/LISTADOS%20YERBAS.ini"
    )

    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    response = requests.get(
        url, headers=headers, params={"ref": GITHUB_BRANCH}, timeout=30
    )

    response.raise_for_status()

    content = base64.b64decode(response.json()["content"])

    mapping = parse_ini_photo_map(content)

    data["photo_map"] = mapping

    return mapping


def apply_photo_map(data):
    mapping = load_photo_map(data)

    for product in data.get("products", []):
        path = mapping.get(photo_key(product.get("marca"), product.get("variedad")))

        if path and not str(product.get("foto", "")).startswith("/uploads/"):
            product["foto"] = path

    return data


def parse_ini_photo_map(raw):
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        content = raw.decode("cp1252", errors="replace")

    parser = configparser.ConfigParser(interpolation=None)

    parser.optionxform = str
    parser.read_string(content)

    mapping = {}

    for brand in parser.sections():
        values = parser[brand]

        for key, value in values.items():
            if key.lower().startswith("imagen."):
                variety = key[len("imagen.") :].strip()

                path = value.strip().replace("\\\\", "/").replace("\\", "/")

                path = path.lstrip("./")

                if path:
                    mapping[photo_key(brand, variety)] = "./" + path

    return mapping


def stock_rows(data):
    result = []
    for p in data["products"]:
        ins = sum(
            int(m["cantidad"])
            for m in data["movements"]
            if m["codigo"] == p["codigo"] and m["tipo"] == "INGRESO"
        )
        outs = sum(
            int(m["cantidad"])
            for m in data["movements"]
            if m["codigo"] == p["codigo"] and m["tipo"] == "SALIDA"
        )
        result.append(
            {
                **p,
                "ingresos": ins,
                "salidas": outs,
                "stock": ins - outs,
                "stock_kg": (ins - outs) * float(p.get("peso") or 0),
            }
        )
    return result


def parse_workbook(file_obj):
    wb = load_workbook(file_obj, data_only=True, read_only=True)
    if "Productos" not in wb.sheetnames or "Movimientos" not in wb.sheetnames:
        raise ValueError(
            "El archivo debe contener las hojas 'Productos' y 'Movimientos'."
        )
    products, movements = [], []
    for row in wb["Productos"].iter_rows(min_row=5, values_only=True):
        if len(row) >= 5 and row[0]:
            products.append(
                {
                    "codigo": str(row[0]).strip(),
                    "marca": str(row[1] or "").strip(),
                    "variedad": str(row[2] or "").strip(),
                    "presentacion": str(row[3] or "").strip(),
                    "peso": float(row[4] or 0),
                    "foto": str(row[5] or "") if len(row) > 5 else "",
                    "observaciones": str(row[6] or "") if len(row) > 6 else "",
                }
            )
    for row in wb["Movimientos"].iter_rows(min_row=5, values_only=True):
        if len(row) >= 4 and row[1] and row[2] and row[3] is not None:
            fecha = row[0]
            if isinstance(fecha, datetime):
                fecha = fecha.strftime("%Y-%m-%d")
            elif fecha:
                fecha = str(fecha)[:10]
            movements.append(
                {
                    "fecha": fecha or "",
                    "tipo": str(row[1]).upper(),
                    "codigo": str(row[2]).strip(),
                    "cantidad": int(row[3]),
                    "documento": str(row[4] or "") if len(row) > 4 else "",
                    "contacto": str(row[5] or "") if len(row) > 5 else "",
                    "observaciones": str(row[6] or "") if len(row) > 6 else "",
                }
            )
    wb.close()
    return {"products": products, "movements": movements}


@app.get("/api/data")
def api_data():
    data = load_data()
    return jsonify({**data, "stock": stock_rows(data)})


@app.post("/api/import")
def api_import():
    f = request.files.get("file")
    if not f:
        return jsonify(error="Seleccioná un archivo XLSM o XLSX."), 400
    try:
        data = parse_workbook(f)
        existing = load_data()
        data["photo_map"] = existing.get("photo_map", {})
        apply_photo_map(data)
        save_data(data)
        return jsonify(
            ok=True, products=len(data["products"]), movements=len(data["movements"])
        )
    except Exception as e:
        return jsonify(error=f"No se pudo importar el archivo: {e}"), 400


# @app.post("/api/products")
# def add_product():
#     data = load_data()
#     p = request.get_json(force=True)
#     required = ["codigo", "marca", "variedad", "peso"]
#     if any(not str(p.get(k, "")).strip() for k in required):
#         return jsonify(error="Completá código, marca, variedad y peso."), 400
#     if any(
#         x["codigo"].lower() == str(p["codigo"]).strip().lower()
#         for x in data["products"]
#     ):
#         return jsonify(error="Ya existe un producto con ese código."), 400
#     try:
#         peso = float(p["peso"])
#     except:
#         return jsonify(error="El peso debe ser numérico."), 400
#     if peso <= 0:
#         return jsonify(error="El peso debe ser mayor que cero."), 400
#     item = {
#         "codigo": str(p["codigo"]).strip(),
#         "marca": str(p["marca"]).strip(),
#         "variedad": str(p["variedad"]).strip(),
#         "presentacion": p.get("presentacion", ""),
#         "peso": peso,
#         "foto": p.get("foto", ""),
#         "observaciones": p.get("observaciones", ""),
#     }
#     data["products"].append(item)
#     apply_photo_map(data)
#     save_data(data)
#     return jsonify(ok=True)


@app.post("/api/products")
def add_product():
    data = load_data()
    p = request.get_json(force=True)

    required = ["codigo", "marca", "variedad", "peso"]

    if any(not str(p.get(k, "")).strip() for k in required):
        return jsonify(error="Completá código, marca, variedad y peso."), 400

    if any(
        x["codigo"].lower() == str(p["codigo"]).strip().lower()
        for x in data["products"]
    ):
        return jsonify(error="Ya existe un producto con ese código."), 400

    try:
        peso = float(p["peso"])
    except (ValueError, TypeError):
        return jsonify(error="El peso debe ser numérico."), 400

    if peso <= 0:
        return jsonify(error="El peso debe ser mayor que cero."), 400

    item = {
        "codigo": str(p["codigo"]).strip(),
        "marca": str(p["marca"]).strip(),
        "variedad": str(p["variedad"]).strip(),
        "presentacion": p.get("presentacion", ""),
        "peso": peso,
        "foto": p.get("foto", ""),
        "observaciones": p.get("observaciones", ""),
    }

    data["products"].append(item)

    apply_photo_map(data)

    try:
        resultado = save_file(
            "backend/data/stock.json", data, "Agregar producto: " + item["codigo"]
        )

        return jsonify(ok=True, producto=item, github=resultado)

    except Exception as e:
        return (
            jsonify(
                ok=False, error=f"No se pudo guardar el producto en GitHub: {str(e)}"
            ),
            500,
        )


@app.put("/api/products/<codigo>")
def edit_product(codigo):
    data = load_data()
    p = request.get_json(force=True)
    item = next((x for x in data["products"] if x["codigo"] == codigo), None)
    if not item:
        return jsonify(error="Producto no encontrado."), 404
    newcode = str(p.get("codigo", codigo)).strip()
    if any(
        x["codigo"].lower() == newcode.lower() and x is not item
        for x in data["products"]
    ):
        return jsonify(error="El código ya está utilizado."), 400
    old = item["codigo"]
    for k in [
        "codigo",
        "marca",
        "variedad",
        "presentacion",
        "peso",
        "foto",
        "observaciones",
    ]:
        if k in p:
            item[k] = float(p[k]) if k == "peso" else p[k]
    if old != item["codigo"]:
        for m in data["movements"]:
            if m["codigo"] == old:
                m["codigo"] = item["codigo"]
    apply_photo_map(data)
    save_data(data)
    return jsonify(ok=True)


@app.post("/api/products/<codigo>/photo")
def upload_product_photo(codigo):
    data = load_data()
    product = next((p for p in data["products"] if p["codigo"] == codigo), None)
    if not product:
        return jsonify(error="Producto no encontrado."), 404
    image = request.files.get("image")
    if not image or not image.filename:
        return jsonify(error="Seleccioná una imagen."), 400
    extension = Path(image.filename).suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return jsonify(error="Formato no permitido. Usá JPG, PNG, AVIF o WEBP."), 400
    if image.mimetype not in {"image/jpeg", "image/png", "image/webp", "image/avif"}:
        return (
            jsonify(error="El archivo seleccionado no parece ser una imagen válida."),
            400,
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename
    image.save(destination)

    old_photo = product.get("foto", "")
    product["foto"] = f"/uploads/{filename}"
    save_data(data)

    # Borrar la fotografía anterior solo si también fue subida a este servidor.
    if old_photo.startswith("/uploads/"):
        old_name = Path(old_photo).name
        old_path = (UPLOAD_DIR / old_name).resolve()
        if old_path.parent == UPLOAD_DIR.resolve() and old_path.exists():
            old_path.unlink()

    return jsonify(ok=True, foto=product["foto"])


@app.get("/uploads/<path:filename>")
def uploaded_photo(filename):
    return send_from_directory(UPLOAD_DIR, filename)


@app.delete("/api/products/<codigo>")
def delete_product(codigo):
    data = load_data()
    if any(m["codigo"] == codigo for m in data["movements"]):
        return (
            jsonify(
                error="No se puede eliminar: el producto tiene movimientos asociados."
            ),
            400,
        )
    data["products"] = [p for p in data["products"] if p["codigo"] != codigo]
    save_data(data)
    return jsonify(ok=True)


@app.post("/api/movements")
def add_movement():
    data = load_data()
    m = request.get_json(force=True)
    if m.get("tipo") not in ["INGRESO", "SALIDA"]:
        return jsonify(error="Tipo de movimiento inválido."), 400
    if not any(p["codigo"] == m.get("codigo") for p in data["products"]):
        return jsonify(error="El código no existe en Productos."), 400
    try:
        qty = int(m.get("cantidad", 0))
    except:
        qty = 0
    if qty <= 0:
        return jsonify(error="La cantidad debe ser un entero mayor que cero."), 400
    item = {
        "fecha": m.get("fecha") or datetime.now().strftime("%Y-%m-%d"),
        "tipo": m["tipo"],
        "codigo": m["codigo"],
        "cantidad": qty,
        "documento": m.get("documento", ""),
        "contacto": m.get("contacto", ""),
        "observaciones": m.get("observaciones", ""),
    }
    data["movements"].append(item)
    save_data(data)
    return jsonify(ok=True)


@app.delete("/api/movements/<int:index>")
def delete_movement(index):
    data = load_data()
    if index < 0 or index >= len(data["movements"]):
        return jsonify(error="Movimiento no encontrado."), 404
    data["movements"].pop(index)
    save_data(data)
    return jsonify(ok=True)


@app.post("/api/import-ini")
def import_ini():
    f = request.files.get("file")
    if not f:
        return jsonify(error="Seleccioná el archivo INI."), 400
    try:
        data = load_data()
        mapping = parse_ini_photo_map(f.read())
        data["photo_map"] = mapping
        before = sum(1 for p in data["products"] if p.get("foto"))
        apply_photo_map(data)
        updated = sum(1 for p in data["products"] if p.get("foto"))
        matched = sum(
            1
            for p in data["products"]
            if mapping.get(photo_key(p.get("marca"), p.get("variedad")))
        )
        save_data(data)
        return jsonify(
            ok=True,
            references=len(mapping),
            matched=matched,
            photos_assigned=matched,
            products_with_photo=updated,
            message=f"Se leyeron {len(mapping)} referencias y se asignaron fotografías a {matched} productos.",
        )
    except Exception as e:
        return jsonify(error=f"No se pudo procesar el INI: {e}"), 400


@app.post("/api/import-ini-products")
def import_ini_products():
    f = request.files.get("file")
    if not f:
        return jsonify(error="Seleccioná el archivo INI."), 400
    raw = f.read()
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        content = raw.decode("cp1252", errors="replace")
    parser = configparser.ConfigParser()
    parser.read_string(content)
    added = []
    data = load_data()
    for brand, values in parser.items():
        if brand == "DEFAULT":
            continue
        varieties = [
            v.strip() for v in values.get("variedades", "").split(",") if v.strip()
        ]
        for variety in varieties:
            if not any(
                p["marca"].lower() == brand.lower()
                and p["variedad"].lower() == variety.lower()
                for p in data["products"]
            ):
                added.append(
                    {
                        "codigo": "",
                        "marca": brand,
                        "variedad": variety,
                        "presentacion": "",
                        "peso": 0.5,
                        "foto": "",
                        "observaciones": "",
                    }
                )
    # INI sirve como listado auxiliar: devuelve sugerencias sin crear códigos ficticios.
    return jsonify(suggestions=added, count=len(added))


@app.get("/api/export")
def export_xlsx():
    data = load_data()
    if TEMPLATE.exists():
        wb = load_workbook(TEMPLATE, keep_vba=False)
    else:
        from openpyxl import Workbook

        wb = Workbook()
    products = wb["Productos"]
    moves = wb["Movimientos"]
    # Vaciar áreas de datos sin tocar encabezados ni formatos.
    for r in range(5, max(products.max_row, 204) + 1):
        for c in range(1, 9):
            products.cell(r, c).value = None
    for r in range(5, max(moves.max_row, 1004) + 1):
        for c in range(1, 8):
            moves.cell(r, c).value = None
    for i, p in enumerate(data["products"], 5):
        vals = [
            p.get("codigo"),
            p.get("marca"),
            p.get("variedad"),
            p.get("presentacion"),
            p.get("peso"),
            p.get("foto"),
            p.get("observaciones"),
        ]
        for c, v in enumerate(vals, 1):
            products.cell(i, c).value = v
        products.cell(i, 8).value = f'=A{i}&" | "&B{i}&" | "&C{i}'
    for i, m in enumerate(data["movements"], 5):
        vals = [
            m.get("fecha"),
            m.get("tipo"),
            m.get("codigo"),
            m.get("cantidad"),
            m.get("documento"),
            m.get("contacto"),
            m.get("observaciones"),
        ]
        for c, v in enumerate(vals, 1):
            moves.cell(i, c).value = v
        if m.get("fecha"):
            try:
                moves.cell(i, 1).value = datetime.strptime(
                    m["fecha"], "%Y-%m-%d"
                ).date()
            except:
                pass
    # Expand calculated stock formulas to cover current catalog size.
    stock = wb["Stock actual"]
    for r in range(5, max(204, 4 + len(data["products"])) + 1):
        src = r
        stock.cell(r, 1).value = f'=IF(Productos!A{src}="","",Productos!A{src})'
        stock.cell(r, 2).value = f'=IF($A{src}="","",Productos!B{src})'
        stock.cell(r, 3).value = f'=IF($A{src}="","",Productos!C{src})'
        stock.cell(r, 4).value = f'=IF($A{src}="","",Productos!D{src})'
        stock.cell(r, 5).value = f'=IF($A{src}="","",Productos!E{src})'
        stock.cell(r, 6).value = (
            f'=IF($A{src}="","",SUMIFS(Movimientos!$D$5:$D$1004,Movimientos!$C$5:$C$1004,$A{src},Movimientos!$B$5:$B$1004,"INGRESO"))'
        )
        stock.cell(r, 7).value = (
            f'=IF($A{src}="","",SUMIFS(Movimientos!$D$5:$D$1004,Movimientos!$C$5:$C$1004,$A{src},Movimientos!$B$5:$B$1004,"SALIDA"))'
        )
        stock.cell(r, 8).value = f'=IF($A{src}="","",F{src}-G{src})'
        stock.cell(r, 9).value = f'=IF($A{src}="","",H{src}*E{src})'
    summary = wb["Resumen"]
    summary["B4"] = "=COUNTA(Productos!A5:A1000)"
    summary["B5"] = "=SUM('Stock actual'!H5:H1000)"
    summary["B6"] = "=SUM('Stock actual'!I5:I1000)"
    summary["B7"] = "=COUNTIF('Stock actual'!H5:H1000,\"<0\")"
    try:
        wb.calculation.fullCalcOnLoad = True
        wb.calculation.forceFullCalc = True
        wb.calculation.calcMode = "auto"
    except:
        pass
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return send_file(
        output,
        as_attachment=True,
        download_name="Control_Stock_Yerbas_actualizado.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
