# Plan — Home promo floor and countdown

Estado: ACTIVO
Prioridad: P0
Fecha: 2026-06-03
Próxima acción: ajustar Home para mostrar piso comercial de pozo/jugadores y countdown promocional único de 72 horas
Criterio de cierre: Home muestra piso visible correcto, usa ventana única de campaña sin reset por usuario, y valida `npm run lint` + `npm run build`

## Objetivo

Mejorar la Home como landing de conversión manteniendo el tono competitivo de SoliProde, sin tocar pagos server-side ni áreas fuera de alcance.

## Alcance

- `src/app/page.tsx`
- componentes visuales de Home
- helpers simples para calcular display de pozo/jugadores
- config centralizada del countdown promocional
- documentación viva mínima si el cambio abre una nueva convención de campaña

## Fuera de alcance

- pagos server-side
- Mercado Pago backend
- schema o migraciones de Supabase
- scoring
- rankings funcionales
- fixture
- grupos
- Admin
- Dashboard
- Matches

## Implementación propuesta

1. Crear helper centralizado para métricas visibles de Home con piso:
   - pozo inicial `300000`
   - jugadores `60`
   - si hay datos reales mayores, mostrar los reales
2. Crear config centralizada de campaña para el countdown principal:
   - fecha final única
   - duración visible en formato `72h 00m 00s`
   - estado final `Precio promocional finalizado`
3. Reorganizar Home para que el countdown quede en zona principal, con acento dorado y sin competir con el CTA principal.
4. Mantener el lenguaje del producto alineado con los contratos de voz y UI.

## Verificación

1. `npm run lint`
2. `npm run build`
3. revisión de copy y de no-overflow en mobile por lectura estructural del layout
