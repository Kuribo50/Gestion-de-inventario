#!/bin/bash
# Activar el entorno virtual
source /home/bodegagestion/GestionBodega/backend/venv/bin/activate

# Navegar al directorio del proyecto (ajusta según sea necesario)
cd /home/bodegagestion/GestionBodega/backend

# Iniciar Gunicorn
exec gunicorn myproject.wsgi:application --bind 0.0.0.0:8000
