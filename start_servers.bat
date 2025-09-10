@echo off
echo Starting all services...

:: 2- Start Keycloak
start cmd /k "cd /d G:\myWork\keycloak-26.2.4\bin && kc.bat start-dev"

:: 3- Start Frontend (React/Vue/Angular)
start cmd /k "cd /d C:\Users\thelo\Desktop\WareHouse\frontend && npm run dev"

:: 4- Start Prometheus
start cmd /k "cd /d C:\Users\thelo\Desktop\WareHouse\prometheus-3.5.0.windows-amd64 && prometheus.exe"

:: 5- Start Grafana
start cmd /k "cd /d C:\Users\thelo\Desktop\WareHouse\grafana-v12.0.2+security-01\bin && grafana-server.exe"

echo All services started.
pause
