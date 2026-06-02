# Plan — SoliProde MVP Recaudable

Estado: PROPUESTO
Prioridad: P0
Fecha: 2026-06-02

## Objetivo

Definir el plan técnico-productivo completo para llevar SoliProde desde su base actual a un MVP que pueda cobrar inscripciones reales, sostener competencia oficial y operar con control administrativo mínimo.

## Alcance

- Documentar el modelo comercial de inscripción.
- Definir estados y reglas operativas para participación, pronósticos, fixture, rankings y grupos.
- Proponer la hoja de ruta de implementación hasta un MVP recaudable y competitivo.
- Identificar riesgos operativos y decisiones pendientes antes de cobrar.

## Fuera de alcance

- Implementar cambios en backend, UI, auth o Supabase.
- Crear nuevas migraciones.
- Modificar RLS.
- Integrar Mercado Pago.
- Insertar seed data.
- Cambiar la Home.

## Principio de producto

SoliProde debe sentirse como un juego competitivo con premios y lectura social simple:

> Jugá el Prode del Mundial, competí por premios, sumá puntos y ganale a tu grupo.

La solidaridad existe, pero no domina la propuesta:

- 90% premio / juego / competencia / ranking / grupos
- 10% solidaridad

## 1. Modelo comercial de inscripción

### Regla base

- Crear cuenta es gratis.
- El usuario puede cargar pronósticos antes de pagar.
- Esos pronósticos existen, pero no participan oficialmente hasta activar participación.
- Solo participantes activos/pagos:
  - aparecen en ranking oficial;
  - suman puntos oficiales;
  - compiten por premios;
  - cuentan para ranking de grupo;
  - habilitan elegibilidad para premio grupal.

### Copy recomendado

`Podés cargar tus pronósticos gratis. Para que participen por premios, activá tu participación.`

### CTA recomendado

- `Activar mis pronósticos`
- `Activar participación`

### Evitar como CTA principal

- `Pagar inscripción`

### Decisión de producto

Conviene separar claramente:

1. cuenta,
2. carga de pronósticos,
3. activación competitiva.

Eso baja fricción inicial y permite que el valor del cobro aparezca después de que el usuario ya invirtió tiempo en el juego.

## 2. Precio inicial + countdown

### Regla

- Mostrar solo el precio inicial vigente.
- Mostrar countdown de vencimiento del precio inicial.
- Cuando termina ese countdown, el precio puede aumentar.
- El cambio de precio no debe depender de una tabla pública de precios futuros.
- El admin debe poder cambiar manualmente el precio vigente y su vigencia.
- Cada participación debe guardar un snapshot del precio pagado.

### Copy público recomendado

- `Precio inicial: $5.000`
- `Disponible por tiempo limitado`
- `Cuando termine la cuenta regresiva, la inscripción puede aumentar.`

### Campos sugeridos para futuro

- `entry_price`
- `price_snapshot_at`
- `price_valid_until`
- `activated_at`
- `entry_baseline_points`
- `eligible_from`

### Decisión técnica

El precio vigente debe vivir en una fuente administrable de configuración operativa, no en una tabla pública orientada a históricos. El histórico lo guarda cada `participation` al activarse.

## 3. Pago online / pago manual MVP

### Etapa 1 MVP

- Pago manual o link de pago.
- Usuario inicia pago o informa comprobante.
- Admin confirma el pago.
- `participation` pasa a `active`.

### Etapa 2

- Mercado Pago integrado.
- Checkout online.
- Webhook confirma pago automáticamente.
- `participation` pasa a `active` sin intervención manual.

### Cuándo conviene cobrar

No conviene cobrar:

- en la Home;
- antes de crear cuenta;
- antes de que el usuario entienda el juego.

Sí conviene cobrar:

- después de crear cuenta;
- idealmente después de que el usuario ya cargó pronósticos;
- cuando el producto ya puede decirle qué está activando.

### Momento ideal

`Ya cargaste tus pronósticos. Para que participen por premios, activá tu participación.`

### Decisión

El cobro debe ser una activación competitiva, no el primer contacto del usuario con el producto.

## 4. Entrada tardía

### Regla

- Se puede ingresar tarde hasta una fecha definida por admin.
- Si el Mundial ya empezó, el jugador entra con puntaje de ingreso.
- Ese puntaje se calcula usando la mediana de puntos de jugadores activos/pagos al momento de activación.
- La mediana se guarda como snapshot.
- No se recalcula después.
- El jugador solo suma puntos reales desde partidos futuros.
- No puede pronosticar partidos ya empezados o terminados.

### Copy recomendado

`El torneo ya empezó. Entrás con puntaje de ingreso y competís desde los próximos partidos.`

### Campo sugerido

- `entry_baseline_points`

### Decisión técnica

La elegibilidad real no depende solo de la fecha de creación del usuario sino del momento de activación de la participación y del primer partido futuro disponible.

## 5. Fixture

### Mínimo necesario

- equipos;
- partidos;
- fecha y hora;
- fase;
- grupo;
- estado del partido;
- resultado final;
- bloqueo automático de pronóstico al inicio del partido.

### Regla operativa

- El usuario puede pronosticar solo partidos futuros.
- Los pronósticos se bloquean al inicio del partido.
- El admin carga resultados.
- Después de cargar resultados, se calculan puntos.

### Necesidades técnicas mínimas

- fuente clara de hora oficial del partido;
- estado del partido consistente (`scheduled`, `live`, `finished`, `cancelled`);
- control de zona horaria;
- proceso operativo para carga de fixture y resultados.

## 6. Pronósticos

### Estados sugeridos

- `draft`: cargado por usuario no activo o aún editable;
- `active`: válido para competir;
- `locked`: partido iniciado;
- `scored`: puntos calculados;
- `invalid`: no válido por falta de pago o fuera de tiempo.

### Regla

- Si el usuario no pagó, puede guardar pronóstico como `draft`.
- Para que el pronóstico compita, la participación debe estar `active`.
- Si el usuario activa antes del inicio del partido, sus pronósticos futuros pueden valer.
- Si activa después de iniciado el partido, ese partido no entra.

### Decisión de modelado

Conviene pensar la validez competitiva como combinación de:

- estado del partido,
- estado de la participación,
- momento de activación,
- momento de lock.

No alcanza con guardar solo el score previsto.

## 7. Reglas de puntuación

### Recomendación MVP

- Resultado exacto: 5 puntos.
- Acierta resultado general: 3 puntos.
- No acierta: 0 puntos.

Resultado general:

- gana local;
- empate;
- gana visitante.

### Evaluación de extras

Extras posibles:

- diferencia de gol;
- bonus campeón;
- bonus subcampeón;
- hasta dónde llega Argentina.

### Recomendación

Para MVP conviene lanzar con regla simple y publicar reglas claras antes de cobrar. Los bonus deben quedar para fase posterior salvo que ya estén completamente definidos, modelados y explicados.

## 8. Modelo de grupos / teams

### Simplificación MVP

- No implementar comunidades en el MVP.
- No mostrar comunidades en la UI MVP.
- No crear jerarquía oficina/comunidad/subgrupo.
- Usar solo grupos/teams.

### Qué representa un grupo

Un grupo puede representar:

- oficina;
- familia;
- amigos;
- curso;
- empresa;
- equipo de trabajo.

### Estructura

Jugador  
↓  
Grupo / Team

### Competencias derivadas

1. Ranking individual general.
2. Ranking interno del grupo.
3. Ranking de grupos.

### Reglas del grupo

- Cualquier usuario autenticado puede crear un grupo.
- Un usuario puede invitar a otros con link/código.
- Un jugador puede pertenecer a un grupo principal para competir.
- El ranking interno funciona desde 2 jugadores activos.
- El jugador con más puntos del grupo se muestra como `DT del grupo`.

### Copy

- `Armá tu equipo de 11.`
- `Mientras tanto, ya pueden competir por el ranking interno del grupo.`

## 9. Regla de 11 jugadores para premio grupal

### Regla

- Un grupo puede existir con cualquier cantidad de miembros.
- No se exige 11 para crear grupo.
- No se exige 11 para ranking interno.
- El ranking interno empieza desde 2 jugadores activos.
- `DT del grupo` = jugador con más puntos del grupo.
- El ranking de grupos puede verse como preview aunque todavía no sea elegible para premio.
- Premio grupal oficial solo para grupos con 11 o más jugadores activos/pagos.

### Copy

`Cuando llegan a 11 jugadores activos, entran a competir por el premio grupal.`

### Puntaje de grupo sugerido

- promedio de puntos de jugadores activos/pagos.

### Elegibilidad oficial

Solo grupos con 11 o más jugadores activos/pagos compiten por premio grupal oficial.

## 10. Rankings

### A. Ranking individual general

- incluye todos los jugadores activos/pagos;
- ordena por puntos totales;
- muestra alias, puntos y grupo.

### B. Ranking interno del grupo

- muestra jugadores activos/pagos dentro del grupo;
- destaca arriba al `DT del grupo`.

### C. Ranking de grupos

- grupos ordenados por promedio de puntos;
- indicar si el grupo está:
  - `En formación`
  - `Habilitado para premio grupal`

### Estados sugeridos

- `En formación: 6/11 jugadores activos`
- `Habilitado: 11/11 jugadores activos`

### Decisión técnica

Los rankings oficiales deben excluir participantes no activos, aunque el sistema sí pueda mostrar previews o estados de activación a nivel privado.

## 11. Perfil del jugador

### Mínimo necesario

- nombre;
- alias público;
- email;
- WhatsApp;
- código de promotor;
- estado de participación;
- grupo principal;
- puntos base por entrada tardía;
- puntos por pronósticos;
- puntos totales.

### Regla pública

El ranking usa alias público, no datos privados.

## 12. Promotores / alumnos vendedores

### Necesidades

- código de promotor;
- link de promotor;
- cantidad de jugadores registrados por promotor;
- cantidad de participantes activos por promotor;
- monto estimado recaudado por promotor.

### Ejemplos

- `soliprode.com?p=AVRIL`
- `soliprode.com/promotor/AVRIL`

### Decisión de modelado

Conviene registrar `promoter_code`:

- en signup, como atribución de origen;
- en `participation`, como atribución competitiva/comercial efectiva.

Así se conserva:

- origen de registro,
- activación real,
- conversión por promotor.

## 13. Admin mínimo

Antes de cobrar, el admin debe poder:

- ver usuarios;
- ver participaciones pendientes;
- confirmar pagos manuales;
- cambiar precio actual;
- cambiar countdown / precio vigente;
- cargar fixture;
- cargar resultados;
- recalcular puntos;
- ver rankings;
- ver grupos;
- ver promotores;
- revisar grupos con 11 jugadores activos.

### Decisión

No conviene abrir cobro real si primero no existe un panel operativo simple para revisar pagos, fixture y rankings.

## 14. Checklist MVP recaudable

### Bloque A — imprescindible para empezar a cobrar

- [ ] Home clara.
- [ ] Registro.
- [ ] Login.
- [ ] Perfil.
- [ ] Precio inicial visible.
- [ ] Countdown.
- [ ] Activar participación.
- [ ] Pago manual / link.
- [ ] Admin confirma pago.
- [ ] Fixture visible.
- [ ] Pronósticos draft.
- [ ] Reglas de puntuación publicadas.
- [ ] Bloqueo por hora de partido.

### Bloque B — imprescindible para competir

- [ ] Cálculo de puntos.
- [ ] Ranking individual.
- [ ] Ranking interno de grupo.
- [ ] Crear / unirse a grupo.
- [ ] DT del grupo.
- [ ] Ranking de grupos.
- [ ] Regla de 11 jugadores para premio grupal.

### Bloque C — deseable después

- [ ] Mercado Pago automático.
- [ ] Webhook.
- [ ] Dashboard de promotores.
- [ ] Bonus predictions.
- [ ] Export de reportes.

## 15. Orden de implementación recomendado

1. Home estable.
2. Auth + perfil.
3. Fixture.
4. Pronósticos draft.
5. Activar participación.
6. Precio inicial + countdown.
7. Pago manual MVP.
8. Admin confirmar pagos.
9. Reglas de puntuación.
10. Carga de resultados.
11. Cálculo de puntos.
12. Ranking individual.
13. Crear / unirse a grupo.
14. Ranking interno de grupo + DT.
15. Ranking de grupos + regla 11.
16. Promotores.
17. Mercado Pago automático.

## 16. MVP recaudable mínimo

Para empezar a cobrar de forma controlada, SoliProde necesita:

- registro y login estables;
- perfil visible;
- fixture visible;
- pronósticos en draft;
- activación de participación;
- precio vigente + countdown;
- pago manual o link de pago;
- confirmación admin;
- bloqueo por inicio de partido;
- reglas de puntuación publicadas.

## 17. MVP competitivo

Para que el producto ya no solo cobre sino compita de verdad, necesita además:

- cálculo de puntos;
- ranking individual oficial;
- grupos;
- ranking interno de grupo;
- `DT del grupo`;
- ranking de grupos;
- regla oficial de 11 jugadores para premio grupal.

## 18. Post-MVP

- Mercado Pago con activación automática.
- Webhook y reconciliación de pagos.
- Dashboard comercial de promotores.
- Bonus predictions.
- Export de reportes y cierres operativos.
- Optimización de métricas, retención y escalado social.

## Riesgos operativos

- Cobrar sin panel admin suficiente genera cuellos de botella manuales.
- Cobrar sin fixture y locks confiables destruye la legitimidad competitiva.
- Permitir activaciones tardías sin snapshot de baseline genera discusiones de justicia.
- Mezclar comunidades y grupos demasiado pronto agrega complejidad innecesaria.
- Integrar pagos automáticos antes de estabilizar estados de participación aumenta el riesgo de inconsistencias.
- No publicar reglas simples y definitivas antes del cobro abre conflictos posteriores.

## Decisiones confirmadas

- Cuenta gratis, activación paga.
- Pronósticos previos al pago permitidos como draft.
- Cobro después del registro y preferentemente después de cargar pronósticos.
- MVP sin comunidades.
- Grupos como capa social principal.
- Premio grupal oficial recién desde 11 jugadores activos.
- Regla de puntuación simple recomendada para MVP.
- Pago manual / link como primera etapa.

## Decisiones pendientes

- valor inicial exacto;
- duración del countdown;
- premio individual;
- premio grupal;
- fecha límite de inscripción;
- método inicial de cobro;
- si se activan bonus o no.

## Próxima acción

Convertir este plan en épicas de implementación por bloques A, B y C antes de tocar backend o pagos.

## Criterio de cierre

Este plan se cierra cuando:

1. exista una versión desglosada por entregables concretos;
2. el alcance del MVP recaudable esté confirmado por negocio y operación;
3. haya decisión tomada sobre cobro inicial, premios, deadline y regla de bonus.
