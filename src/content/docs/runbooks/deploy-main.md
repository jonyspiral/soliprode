---
title: "Runbook: Deploy a Main"
description: "Procedimiento estándar para publicar cambios en SoliProde."
lastUpdated: "2026-06-01"
---

# Runbook: Deploy a `main`

Objetivo: que cualquier agente publique de forma consistente, trazable y con mínimo riesgo.

## Flujo canónico

1. Verificar rama y estado local.
2. Ejecutar validación mínima del slice.
3. Commit atómico con mensaje claro.
4. Push a `origin/main`.
5. Verificar que Vercel o la integración de CI tome el cambio.
6. Reportar evidencia: `commit` + URL del deploy/run + estado.

## Comandos base

```bash
git status --short --branch
npm run lint
npm run build
git add -A
git commit -m "feat(scope): resumen corto"
git push origin main
```

## Criterios obligatorios

- No hacer `force-push` a `main` sin autorización explícita.
- No mezclar refactors no relacionados en el mismo publish.
- Si hay cambios inesperados en el worktree, frenar y aclarar alcance antes de publicar.

## Evidencia mínima

- SHA publicado.
- Rama publicada.
- URL del deploy o del run, si existe.
- Estado final.
