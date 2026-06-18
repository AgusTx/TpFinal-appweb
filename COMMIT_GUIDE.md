# Guía de Commits — Fase 1 (Limpieza y Esqueleto)

Este archivo contiene una propuesta de commits para agrupar los cambios realizados hasta ahora. Ejecuta los comandos tal cual o usa el script `scripts/commit_phase1.sh`.

Commits propuestos:

1) `chore: backup placeholder files`
   - Archivos añadidos: `backup/placeholders/*`
   - Archivos eliminados: `backend/modules/*` (placeholders) y `shared/app.ts`

2) `feat: add backend skeleton (Express server and stub routes)`
   - Archivos añadidos: `backend/src/main.ts`

3) `chore: set frontend API base to http://localhost:4000`
   - Archivo modificado: `frontend/src/services/api.ts`

4) `docs: add README for Phase 1 architecture and run instructions`
   - Archivo añadido: `README_PHASE1.md`

Instrucciones manuales (alternativa):

```bash
# Agrega y commitea backups
git add backup/placeholders
git commit -m "chore: backup placeholder files"

# Backend skeleton
git add backend/src/main.ts
git commit -m "feat: add backend skeleton (Express server and stub routes)"

# Frontend change
git add frontend/src/services/api.ts
git commit -m "chore: set frontend API base to http://localhost:4000"

# Documentación
git add README_PHASE1.md
git commit -m "docs: add README for Phase 1 architecture and run instructions"
```

Si prefieres que yo genere los commits directamente, ejecútalos localmente o dame permiso para intentar usar la terminal aquí.
