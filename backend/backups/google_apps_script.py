# import os
# import requests


# def enviar_backup(json_content, movements_content, ini_content, origen="manual"):
#     """
#     Envía los archivos JSON e INI a Google Apps Script.
#     """

#     url = os.getenv("BACKUP_WEBAPP_URL")
#     secret = os.getenv("BACKUP_SECRET")

#     if not url or not secret:
#         raise RuntimeError("Faltan las variables de entorno del backup")

#     if not isinstance(json_content, str):
#         raise TypeError("El contenido JSON debe ser texto")

#     if not isinstance(ini_content, str):
#         raise TypeError("El contenido INI debe ser texto")

#     # Validar que el JSON sea correcto
#     import json

#     json.loads(json_content)

#     payload = {
#         "token": secret,
#         "origen": origen,
#         "files": {
#             "json": json_content,
#             "movements": movements_content,
#             "ini": ini_content,
#         },
#     }

#     try:
#         response = requests.post(url, json=payload, timeout=60, allow_redirects=True)

#         response.raise_for_status()

#         resultado = response.json()

#         if not resultado.get("ok"):
#             raise RuntimeError(
#                 resultado.get("mensaje", "Google Drive rechazó el backup")
#             )

#         return resultado

#     except requests.exceptions.Timeout:
#         raise RuntimeError("Google Apps Script tardó demasiado en responder")

#     except requests.exceptions.RequestException as e:
#         raise RuntimeError(f"Error de conexión con Google Drive: {e}")

#     except ValueError:
#         raise RuntimeError("Google Apps Script devolvió una respuesta inválida")


import os
import json
import requests


def enviar_backup(stock_content, movements_content, ini_content, origen="manual"):
    """
    Envía stock.json, movements.json y LISTADOS YERBAS.ini
    a Google Apps Script para almacenarlos en Google Drive.
    """

    url = os.getenv("BACKUP_WEBAPP_URL")
    secret = os.getenv("BACKUP_SECRET")

    if not url or not secret:
        raise RuntimeError("Faltan las variables de entorno del backup")

    # Validar tipos de contenido
    if not isinstance(stock_content, str):
        raise TypeError("El contenido de stock.json debe ser texto")

    if not isinstance(movements_content, str):
        raise TypeError("El contenido de movements.json debe ser texto")

    if not isinstance(ini_content, str):
        raise TypeError("El contenido INI debe ser texto")

    # Validar ambos JSON
    try:
        json.loads(stock_content)
        json.loads(movements_content)
    except json.JSONDecodeError as e:
        raise ValueError(f"El contenido JSON no es válido: {e}")

    # Preparar información para Google Apps Script
    payload = {
        "token": secret,
        "origen": origen,
        "files": {
            "stock": stock_content,
            "movements": movements_content,
            "ini": ini_content,
        },
    }

    try:
        response = requests.post(url, json=payload, timeout=60, allow_redirects=True)

        response.raise_for_status()

        resultado = response.json()

        if not resultado.get("ok"):
            raise RuntimeError(
                resultado.get("mensaje", "Google Drive rechazó el backup")
            )

        return resultado

    except requests.exceptions.Timeout:
        raise RuntimeError("Google Apps Script tardó demasiado en responder")

    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Error de conexión con Google Drive: {e}")

    except ValueError as e:
        raise RuntimeError(f"Google Apps Script devolvió una respuesta inválida: {e}")
