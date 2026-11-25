from backups.google_apps_script import enviar_backup
import json

# Datos ficticios para probar la conexión
datos_json = {
    "products": [{"codigo": "TEST001", "descripcion": "Producto de prueba"}],
    "movements": [],
}

datos_ini = """
[BACKUP_TEST]
estado=correcto
proyecto=PlanillasMarce
"""

try:

    resultado = enviar_backup(
        json.dumps(datos_json, ensure_ascii=False), datos_ini, origen="prueba"
    )

    print("BACKUP EXITOSO")
    print("Carpeta:", resultado.get("carpeta"))
    print("Fecha:", resultado.get("fecha"))

except Exception as e:

    print("ERROR EN BACKUP:")
    print(e)
