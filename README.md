# GreenLedger

GreenLedger es un proyecto de portfolio pensado como un SaaS B2B para cumplimiento regulatorio y trazabilidad en cannabis medicinal.

## Lo importante primero

Si, puedes construir todo esto con VS Code.

VS Code es solo el editor. Lo que de verdad hace funcionar el proyecto son las herramientas que instalas alrededor:

- `Frontend`: React + TypeScript + Vite
- `Backend`: ASP.NET Core 8
- `Base de datos`: PostgreSQL
- `Cache`: Redis
- `Infra local`: Docker Desktop

## Estructura inicial

- `front/`: interfaz web que vera el usuario
- `back/`: API, reglas de negocio, seguridad y acceso a datos
- `docker-compose.dev.yml`: contenedores base para PostgreSQL y Redis

## Estado actual

Ya te deje una base minima para entender el concepto:

- un `front` funcional con dashboard demo
- un `back` con estructura profesional por capas
- documentacion simple para que entiendas por que existe cada parte
- una carpeta `explicaciones/` para estudiar como funciona .NET y como se llevaria a produccion

## Que te falta instalar

Ahora mismo en tu maquina falta `.NET SDK`, por eso el backend aun no se puede ejecutar.

Instala esto:

1. `.NET 8 SDK`
2. `Docker Desktop`
3. Extension `C# Dev Kit` en VS Code
4. Extension `ESLint` en VS Code

## Como correr lo que ya funciona

Frontend:

```powershell
cd C:\Users\sgira\OneDrive\Escritorio\green_ledger\front
npm run dev
```

Abre la URL que te muestre Vite, normalmente `http://localhost:5173`.

## Siguiente paso recomendado

Cuando instales `.NET 8 SDK`, seguimos con:

1. levantar la API
2. conectar React con la API real
3. agregar PostgreSQL
4. crear autenticacion JWT
5. crear auditoria y trazabilidad reales
