# Implementación: dieciseisavos con cupos pendientes

Fecha: 2026-06-28
Repo: `jonyspiral/soliprode`

## Decisión de producto

No esperar a que estén definidos los clasificados para crear los partidos de dieciseisavos. Los 16 partidos deben existir desde ahora con:

- número oficial de partido;
- fecha/hora;
- sede y ciudad;
- etapa/ronda;
- cupos de clasificación visibles;
- equipos reales nulos hasta resolver grupos.

Lo que sí debe esperar es:

- asignación de `home_team_id` y `away_team_id`;
- apertura de pronósticos;
- carga del resultado.

## Motivo

El schema actual exige `matches.home_team_id` y `matches.away_team_id` como `not null`. Eso impide guardar partidos futuros sin inventar equipos placeholder.

El importador actual también está limitado a `stage = 'group_stage'` y `round_name = 'Fase de grupos'`, por lo que no sirve para eliminatorias.

## Objetivo técnico

Preparar el fixture para `round_of_32` sin romper la UI actual ni los pronósticos.

## Cambios de base recomendados

Crear una migración nueva, por ejemplo:

`supabase/migrations/013_knockout_slots.sql`

### 1. Permitir equipos nulos en partidos futuros

```sql
alter table public.matches
  alter column home_team_id drop not null,
  alter column away_team_id drop not null;
```

### 2. Ajustar constraint de equipos distintos

El check actual solo debe aplicar cuando ambos equipos existen.

```sql
alter table public.matches
  drop constraint if exists matches_distinct_teams_check;

alter table public.matches
  add constraint matches_distinct_teams_check check (
    home_team_id is null
    or away_team_id is null
    or home_team_id <> away_team_id
  );
```

### 3. Agregar cupos de clasificación

```sql
alter table public.matches
  add column if not exists home_slot_rule text,
  add column if not exists away_slot_rule text,
  add column if not exists home_slot_label text,
  add column if not exists away_slot_label text,
  add column if not exists bracket_position text,
  add column if not exists bracket_side text;
```

Uso:

- `home_slot_rule`: valor técnico estable, ejemplo `1A`, `2C`, `BEST_3_A_B_C_D_F`, `WINNER_73`.
- `home_slot_label`: copy visible, ejemplo `1.º Zona A`, `Mejor 3.º A/B/C/D/F`, `Ganador Partido 73`.
- idem visitante.
- `bracket_position`: ubicación de llave, ejemplo `R32-01`.
- `bracket_side`: `left`, `right` o similar si luego se arma bracket visual.

### 4. Constraint de stage

No cerrar demasiado el check. Permitir:

- `group_stage`
- `round_of_32`
- `round_of_16`
- `quarter_finals`
- `semi_finals`
- `third_place`
- `final`

Si no existe constraint explícito de stage, no hace falta agregarlo ahora.

### 5. Bloqueo server-side de pronósticos si faltan equipos

La acción `savePredictionAction` hoy valida `status = scheduled` y cierre por fecha. Debe sumar:

```ts
home_team_id, away_team_id
```

en el select del partido, y rechazar si falta alguno:

```ts
if (!matchRow.home_team_id || !matchRow.away_team_id) {
  return {
    ok: false,
    error: "MATCH_NOT_READY",
    message: "Este cruce todavía no tiene equipos definidos.",
  };
}
```

Actualizar el union type con `MATCH_NOT_READY`.

## Cambios en UI pública `/matches`

### Tipos

En `src/app/matches/page.tsx`:

- `home_team_id` y `away_team_id` deben aceptar `string | null`.
- sumar campos:
  - `home_slot_label`
  - `away_slot_label`
  - `home_slot_rule`
  - `away_slot_rule`
  - `bracket_position`
  - `bracket_side`

En `src/components/matches/prediction-board.tsx`:

- `home_team` y `away_team` deben aceptar `MatchTeam | null` o agregar estructura de slot.
- `MatchBoardItem` debe llevar `home_slot_label` y `away_slot_label`.

### Render

Cuando hay equipo real:

- mostrar bandera, FIFA code, short name y name como hoy.

Cuando no hay equipo real:

- mostrar badge neutral sin bandera real;
- mostrar `home_slot_label` / `away_slot_label`;
- mostrar subtítulo: `Se define al cierre de la fase de zonas`.

Ejemplo visual:

```tsx
const displayName = team?.short_name ?? slotLabel ?? "Equipo por definir";
const displayCode = team?.fifa_code ?? "TBD";
```

### Estado del partido

Si faltan equipos, aunque `status = scheduled`, el estado visible debe ser:

`Por definir`

No debe decir `Abierto`.

### Controles de pronóstico

Si faltan equipos:

- deshabilitar + / -;
- botón: `Esperando clasificados`;
- mensaje: `Vas a poder pronosticar cuando se definan los equipos.`

## Importador

Crear un importador separado para eliminatorias o extender el actual con modo por stage.

Recomendado:

`scripts/fixture/import-knockout-fixture.mjs`

CSV sugerido:

```csv
match_number,stage,round_name,home_slot_rule,home_slot_label,away_slot_rule,away_slot_label,starts_at,prediction_closes_at,venue,city,status,bracket_position,bracket_side
73,round_of_32,Dieciseisavos,1A,1.º Zona A,2C,2.º Zona C,2026-06-28T16:00:00-03:00,2026-06-28T16:00:00-03:00,Estadio...,Ciudad...,scheduled,R32-01,left
```

El importador debe:

- validar `match_number` único;
- validar `stage` permitido;
- validar `status = scheduled`;
- validar fechas ISO;
- permitir `home_team_id` y `away_team_id` nulos;
- hacer upsert por `match_number`;
- no tocar equipos.

## Resolución futura de clasificados

Crear después una acción admin:

`resolveRoundOf32Action()`

Responsabilidades:

1. leer partidos terminados de fase de grupos;
2. calcular tabla por zona:
   - puntos;
   - diferencia de gol;
   - goles a favor;
   - criterios oficiales restantes si se implementan;
3. ordenar 1.º, 2.º y terceros;
4. calcular ocho mejores terceros;
5. aplicar tabla oficial de combinación de terceros;
6. completar `home_team_id` / `away_team_id` para cada partido de `round_of_32`;
7. mantener `status = scheduled` y `prediction_closes_at = starts_at`.

## Checklist de aceptación

- [ ] Se pueden insertar partidos de `round_of_32` sin equipos reales.
- [ ] `/matches` no rompe cuando `home_team_id` o `away_team_id` son nulos.
- [ ] La UI muestra `1.º Zona A`, `2.º Zona C`, `Mejor 3.º ...` en vez de inventar países.
- [ ] No se pueden guardar pronósticos si falta algún equipo.
- [ ] Los partidos quedan visibles en calendario por fecha.
- [ ] Al completar equipos reales, la UI pasa automáticamente a mostrar banderas y habilitar picks si el partido sigue abierto.
- [ ] El sistema sigue funcionando para fase de grupos existente.

## Nota importante de lenguaje

Mantener consistencia SoliProde:

- usar `Zona` para grupos del Mundial;
- reservar `Grupo`, `Team` o `Plantel` para grupos sociales de jugadores.
