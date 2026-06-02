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

## Regla de voz del MVP

La voz pública del producto tiene que respetar `SoliProde Voice & Copy System`:

- competitiva;
- directa;
- futbolera;
- mobile-first;
- enfocada en premio, grupo y ranking;
- con solidaridad como respaldo, no como protagonista.

Documento de referencia:

`src/content/docs/voice-and-copy-soliprode.md`

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

### Flujo principal del producto

- Pago online con Mercado Pago como camino principal.
- El usuario debe ver desde Home, Dashboard y Matches:
  - cuánto cuesta;
  - que la cuenta es gratis;
  - que el pago destraba la competencia oficial;
  - que Mercado Pago es el medio principal.

### Fallback operativo MVP

- Activación manual solo si el pago online falla o no puede completarse.
- Usuario informa referencia o comprobante.
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

El cobro debe seguir siendo una activación competitiva, pero el producto no debe esconder que el flujo principal es pagar online con Mercado Pago.

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

## 13. Competencia interna de promotores

### Regla de producto

La competencia de promotores es interna del equipo de tesis y no debe mezclarse con:

- ranking de jugadores;
- ranking de grupos;
- premio individual;
- premio grupal.

Dentro de SoliProde conviven tres competencias distintas:

1. Jugadores: quién sabe más de fútbol.
2. Grupos: qué equipo de 11 rinde mejor.
3. Promotores: qué alumno trajo más jugadores activos.

### Modelo operativo

- Cada miembro del equipo de tesis funciona como promotor.
- El equipo espera operar con 13 promotores iniciales.
- Cada promotor debe tener:
  - código propio;
  - link propio;
  - jugadores registrados;
  - jugadores activos/pagos;
  - recaudación bruta atribuida.
- El usuario puede llegar por link de promotor o ingresar un código de promotor en el registro.
- El `promoter_code` debe quedar asociado al perfil y/o a la participación para trazabilidad comercial real.

### Objetivo interno

El equipo debe poder ver con claridad:

- quién está traccionando jugadores nuevos;
- quién convierte mejor a pago;
- quién aporta más a la recaudación efectiva;
- quién no está moviendo jugadores activos reales.

### Regla de ranking de promotores

El ranking principal de promotores debe ordenarse por:

1. cantidad de participantes activos/pagos;
2. recaudación bruta atribuida;
3. tasa de conversión registrado → pago.

No conviene ordenar primero por cantidad de registrados, porque el objetivo real es medir tracción efectiva y no solo volumen superficial.

### Métricas mínimas del panel admin futuro

Por promotor:

- código;
- nombre;
- link;
- registrados;
- participantes activos/pagos;
- pagos pendientes;
- recaudación bruta atribuida;
- tasa de conversión registrado → pago;
- posición en ranking de promotores.

### Copy interno sugerido

- `Ranking de promotores`
- `Jugadores activos captados`
- `Recaudación atribuida`
- `Conversión a pago`

### Ejemplo de lectura

AVRIL
23 registrados
17 activos
$85.000 atribuidos

### Liquidación final

No hace falta automatizar la liquidación interna en el MVP.

Debe quedar documentado como proceso operativo manual:

- recaudación total atribuida;
- menos gastos operativos;
- dividido o distribuido entre promotores según el criterio que defina el equipo.

Esta liquidación:

- no debe mostrarse al jugador común;
- vive en Admin / Promotores;
- depende de capturar bien la atribución desde registro y participación.

### Decisión de modelado

Aunque la liquidación final quede manual, el MVP debe capturar desde el principio los datos que después permitan reconstruirla:

- promotor de origen;
- jugadores registrados por promotor;
- jugadores activos/pagos por promotor;
- pagos pendientes por promotor;
- recaudación bruta atribuida por promotor.

Eso evita perder trazabilidad comercial desde la primera ola de registros.

## 14. Admin mínimo

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

## 15. Checklist MVP recaudable

### Bloque A — imprescindible para empezar a cobrar

- [ ] Home clara.
- [ ] Registro.
- [ ] Login.
- [ ] Perfil.
- [ ] Precio inicial visible.
- [ ] Countdown.
- [ ] Activar participación.
- [ ] Pago online visible con Mercado Pago.
- [ ] Fallback manual operativo.
- [ ] Admin confirma pago.
- [ ] Fixture visible.
- [ ] Pronósticos draft.
- [ ] Reglas de puntuación publicadas.
- [ ] Bloqueo por hora de partido.
- [ ] Código de promotor capturable en registro.
- [ ] Link de promotor.
- [ ] `participation` / `profile` asociada al promotor.

### Bloque B — imprescindible para competir

- [ ] Cálculo de puntos.
- [ ] Ranking individual.
- [ ] Ranking interno de grupo.
- [ ] Crear / unirse a grupo.
- [ ] DT del grupo.
- [ ] Ranking de grupos.
- [ ] Regla de 11 jugadores para premio grupal.
- [ ] Vista admin de promotores.
- [ ] Cantidad de registrados por promotor.
- [ ] Cantidad de activos/pagos por promotor.
- [ ] Recaudación atribuida.

### Bloque C — deseable después

- [ ] Mercado Pago automático.
- [ ] Webhook.
- [ ] Bonus predictions.
- [ ] Export de reportes.
- [ ] Liquidación interna.
- [ ] Export de reporte de promotores.
- [ ] Ranking avanzado por conversión.

## 16. Orden de implementación recomendado

1. Home estable.
2. Auth + perfil.
3. Fixture.
4. Pronósticos draft.
5. Activar participación.
6. Precio inicial + countdown.
7. Pago online visible con Mercado Pago.
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

## 17. MVP recaudable mínimo

Para empezar a cobrar de forma controlada, SoliProde necesita:

- registro y login estables;
- perfil visible;
- fixture visible;
- pronósticos en draft;
- activación de participación;
- precio vigente + countdown;
- pago online visible con Mercado Pago;
- fallback manual utilizable;
- confirmación admin;
- bloqueo por inicio de partido;
- reglas de puntuación publicadas.

## 18. MVP competitivo

Para que el producto ya no solo cobre sino compita de verdad, necesita además:

- cálculo de puntos;
- ranking individual oficial;
- grupos;
- ranking interno de grupo;
- `DT del grupo`;
- ranking de grupos;
- regla oficial de 11 jugadores para premio grupal.

## 19. Post-MVP

- Checkout real de Mercado Pago con activación automática.
- Webhook y reconciliación de pagos.
- Vista avanzada de promotores.
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
- Mercado Pago / pago online como flujo principal.
- Activación manual solo como fallback operativo.
- MVP sin comunidades.
- Grupos como capa social principal.
- Premio grupal oficial recién desde 11 jugadores activos.
- Regla de puntuación simple recomendada para MVP.
- Mercado Pago online-first con fallback manual operativo.
- Competencia de promotores separada del juego principal.
- Ranking principal de promotores ordenado por jugadores activos/pagos.
- Recaudación atribuida como métrica secundaria de promotores.
- Liquidación interna fuera de la experiencia pública principal.

## Decisiones pendientes

- valor inicial exacto;
- duración del countdown;
- premio individual;
- premio grupal;
- fecha límite de inscripción;
- método inicial de cobro;
- si se activan bonus o no;
- lista final de los 13 promotores;
- códigos oficiales de cada promotor;
- criterio final de reparto interno;
- qué gastos operativos se descuentan;
- si el reparto será igualitario, proporcional o mixto.

## 20. Desglose por épicas ejecutables

### Épica A — Activación recaudable

Objetivo: permitir que un jugador pase de cuenta creada a participación competitiva activa.

Incluye:

- estado visible de participación;
- precio vigente;
- countdown;
- CTA principal de pago online;
- presencia visible de Mercado Pago en Home, Dashboard y Matches;
- carga de comprobante o referencia como fallback;
- confirmación admin;
- cambio de `pending` a `paid`.

Resultado esperado:

- el usuario puede crear cuenta, cargar picks y activar su participación de forma operable;
- el admin puede procesar pagos manuales sin salir del sistema.
- el tono visible del producto ya habla de competir, pagar y jugar, no de procesos administrativos.

### Épica B — Fixture + pronósticos válidos

Objetivo: convertir SoliProde en juego usable antes del scoring completo.

Incluye:

- fixture visible;
- pronósticos draft;
- lock por horario;
- distinción entre borrador y pronóstico competitivo;
- control de partidos futuros vs iniciados.

Resultado esperado:

- el usuario entiende qué partidos puede jugar y cuáles ya cerraron;
- el sistema evita inconsistencias de tiempo.

### Épica C — Scoring + ranking oficial

Objetivo: transformar la participación activa en competencia real.

Incluye:

- carga de resultados;
- cálculo de puntos;
- ranking individual oficial;
- exclusión de participantes no activos;
- baseline para entrada tardía.

Resultado esperado:

- existe un ranking legítimo y defendible;
- los puntos oficiales reflejan partidos realmente jugados y cobrados.

### Épica D — Grupos competitivos

Objetivo: habilitar la segunda competencia de SoliProde.

Incluye:

- crear grupo;
- unirse a grupo;
- grupo principal del jugador;
- ranking interno;
- `DT del grupo`;
- ranking de grupos;
- regla oficial de 11 activos para premio grupal.

Resultado esperado:

- además del ranking individual, el juego ya puede mover competencia social real.

### Épica E — Promotores operativos

Objetivo: habilitar la tercera competencia interna del proyecto de tesis.

Incluye:

- capturar `promoter_code` en registro;
- soportar link de promotor;
- asociar promotor a perfil y/o participación;
- vista admin de promotores;
- métricas por promotor;
- ranking interno de promotores por activos/pagos.

Resultado esperado:

- el equipo de tesis puede saber quién trae jugadores pagos y quién no;
- queda trazabilidad suficiente para liquidación manual posterior.

### Épica F — Operación comercial post-MVP

Objetivo: escalar la capa recaudable cuando el MVP ya sea confiable.

Incluye:

- Mercado Pago;
- webhook;
- reconciliación de pagos;
- export de reportes;
- liquidación interna;
- ranking avanzado de promotores por conversión.

Resultado esperado:

- menos fricción operativa;
- mejor visibilidad comercial;
- cierre manual y financiero más ordenado.

## 21. Datos mínimos que hay que capturar

### Para juego y cobro

- usuario;
- perfil;
- participación;
- estado de pago;
- referencia/comprobante;
- precio snapshot;
- baseline de entrada tardía;
- horario de lock por partido.

### Para grupos

- grupo principal;
- cantidad de jugadores activos por grupo;
- puntos individuales;
- promedio de grupo;
- elegibilidad 11/11.

### Para promotores

- código de promotor;
- link o fuente de atribución;
- usuario registrado por promotor;
- usuario activo/pago por promotor;
- pago pendiente por promotor;
- recaudación bruta atribuida por promotor.

### Regla de trazabilidad

Si esos datos no se capturan desde el principio:

- no se puede reconstruir bien el ranking de promotores;
- no se puede liquidar con justicia;
- no se puede separar adquisición superficial de adquisición efectiva.

## 22. Tickets técnicos sugeridos

### Bloque inmediato — scoring + ranking oficial

#### Ticket C1 — Modelo de scoring MVP

Objetivo:

- dejar fija la regla operativa `5 / 3 / 0`;
- definir qué evento recalcula puntos;
- definir qué estados finales necesita un pronóstico.

Entregable esperado:

- documento técnico corto con algoritmo, edge cases y criterio de idempotencia.

#### Ticket C2 — Carga de resultados admin

Objetivo:

- permitir que admin cargue score final;
- estandarizar transición `scheduled/live/finished`;
- definir cuándo un partido queda listo para scoring.

Entregable esperado:

- flujo admin mínimo para publicar resultado final sin ambigüedad.

#### Ticket C3 — Recalcular `predictions.points`

Objetivo:

- recalcular los puntos de cada pronóstico cuando un partido termina;
- evitar doble cómputo o resultados inconsistentes.

Entregable esperado:

- proceso reproducible de scoring sobre un partido terminado.

#### Ticket C4 — Poblar `rankings_cache`

Objetivo:

- reconstruir ranking oficial solo con jugadores `paid`;
- definir `ranking_type` oficial para la tabla general;
- ordenar por puntos y posición.

Entregable esperado:

- ranking individual oficial estable, recalculable y visible.

### Bloque siguiente — grupos competitivos

#### Ticket D1 — Grupo principal del jugador

Objetivo:

- definir cómo un jugador crea o elige su grupo principal;
- dejar claro qué pasa si todavía no tiene grupo.

Entregable esperado:

- flujo de pertenencia claro y consistente con la competencia grupal.

#### Ticket D2 — Ranking interno del grupo

Objetivo:

- mostrar solo jugadores activos/pagos del grupo;
- marcar al `DT del grupo`;
- soportar grupos en formación.

Entregable esperado:

- ranking interno utilizable desde 2 jugadores activos.

#### Ticket D3 — Ranking de grupos

Objetivo:

- calcular promedio por grupo;
- distinguir preview vs elegibilidad oficial;
- aplicar regla de 11 activos.

Entregable esperado:

- ranking grupal interpretable y defendible para premio oficial.

### Bloque siguiente — promotores operativos

#### Ticket E1 — Captura de atribución

Objetivo:

- aceptar código de promotor en registro;
- aceptar llegada por link de promotor;
- dejar trazabilidad en perfil y/o participación.

Entregable esperado:

- atribución consistente desde el primer contacto del jugador.
- esa atribución no se pierde si el usuario entra con Google OAuth.

#### Ticket E2 — Vista admin de promotores

Objetivo:

- exponer métricas mínimas por promotor;
- listar registrados, activos/pagos y pendientes;
- mostrar recaudación bruta atribuida.

Entregable esperado:

- panel interno legible para el equipo de tesis.

#### Ticket E3 — Ranking interno de promotores

Objetivo:

- ordenar promotores por activos/pagos;
- dejar recaudación y conversión como métricas secundarias;
- preparar el terreno para liquidación manual posterior.

Entregable esperado:

- ranking de promotores accionable para operación y seguimiento.

## 23. Dependencias críticas

### Dependencias del ranking oficial

- scoring definido;
- resultados finales confiables;
- exclusión de participaciones no activas;
- proceso claro de recalcular cache.

### Dependencias del ranking de grupos

- grupo principal definido;
- jugadores activos identificados;
- ranking individual ya disponible;
- criterio claro de promedio y elegibilidad.

### Dependencias del ranking de promotores

- captura de `promoter_code`;
- participación asociada al promotor;
- precio o recaudación atribuible por participación;
- distinción entre registrado, pendiente y activo.

## 24. Criterios de aceptación por bloque

### Para considerar “recaudable”

- un usuario puede registrarse;
- puede cargar pronósticos;
- puede activar participación;
- un admin puede confirmar pago;
- el estado cambia de forma visible y operable.

### Para considerar “competitivo”

- existe scoring reproducible;
- hay ranking oficial solo para `paid`;
- los partidos futuros pueden pronosticarse y los iniciados no;
- las reglas publicadas coinciden con el comportamiento real.

### Para considerar “operable para tesis”

- existe trazabilidad por promotor;
- el admin puede comparar promotores por activos y recaudación;
- la información capturada alcanza para una liquidación manual posterior.

## 25. Secuencia recomendada de ejecución

### Fase 1 — Cerrar el circuito recaudable base

Orden:

1. activar participación;
2. precio + countdown;
3. referencia/comprobante;
4. confirmación admin;
5. estado visible en dashboard y matches.

Meta:

- poder cobrar y activar sin ambigüedad operativa;
- evitar que el producto cobre antes de poder administrar pagos manuales.

### Fase 2 — Cerrar legitimidad competitiva

Orden:

1. scoring oficial;
2. carga de resultados;
3. lock confiable por partido;
4. ranking individual oficial;
5. baseline de entrada tardía.

Meta:

- que el juego no solo cobre, sino que tenga reglas y resultados defendibles.

### Fase 3 — Abrir competencia social

Orden:

1. grupo principal;
2. ranking interno del grupo;
3. `DT del grupo`;
4. ranking de grupos;
5. elegibilidad oficial 11/11.

Meta:

- habilitar la segunda competencia sin mezclarla prematuramente con comunidades.

### Fase 4 — Abrir competencia interna de promotores

Orden:

1. captura de código/link de promotor;
2. trazabilidad sobre perfil/participación;
3. vista admin de promotores;
4. ranking interno por activos/pagos;
5. recaudación atribuida y conversión.

Meta:

- que el equipo de tesis pueda ver tracción real y no solo registros superficiales.

### Fase 5 — Escalado comercial post-MVP

Orden:

1. checkout automático;
2. webhook;
3. reconciliación;
4. exportables;
5. liquidación interna;
6. ranking avanzado de promotores.

Meta:

- bajar trabajo manual y profesionalizar el cierre operativo.

## 26. Bloqueadores de negocio previos al go-live

Antes de abrir cobro real, producto/operación tiene que cerrar:

- precio inicial;
- duración del countdown;
- fecha límite de inscripción;
- premio individual;
- premio grupal;
- método inicial de cobro;
- regla de bonus sí/no;
- lista final de promotores;
- códigos oficiales de promotor.

Si esas decisiones no están cerradas:

- el usuario recibe mensajes ambiguos;
- el admin opera con criterios variables;
- se vuelve más probable discutir justicia de cobro, premios o atribución.

## 27. Checklist de salida a producción del MVP recaudable

### Producto

- copy pública coherente sobre activación;
- reglas de puntuación publicadas;
- premio y deadline definidos;
- flujo de activación entendible para el jugador.

### Operación

- admin puede confirmar pagos;
- admin puede cargar fixture;
- admin puede cargar resultados;
- admin puede identificar promotor de cada jugador;
- existe proceso claro para resolver incidencias manuales.

### Datos

- locks por partido funcionan;
- scoring recalcula sin inconsistencias;
- ranking oficial excluye no activos;
- la atribución de promotor queda guardada.

### Comercial

- precio vigente confirmado;
- canal de cobro inicial definido;
- política de liquidación interna al menos acordada en borrador;
- criterio de reparto no ambiguo para el equipo.

## 28. Definición de go-live

SoliProde está listo para salir a cobrar cuando se cumplan al mismo tiempo estas cuatro condiciones:

1. el jugador puede registrarse, pronosticar y activar participación sin trabas operativas;
2. el admin puede procesar pagos, fixture y resultados desde un flujo simple;
3. el ranking oficial es consistente con scoring, locks y estado de pago;
4. la atribución comercial por promotor ya queda registrada desde el primer registro.

Si falta una de esas cuatro, el sistema todavía puede ser demo, pero no MVP recaudable confiable.

## 29. Matriz mínima de ownership

### Producto

Responsable de definir:

- propuesta pública;
- copy de activación;
- premio individual;
- premio grupal;
- deadline de inscripción;
- reglas publicadas del juego.

### Operación

Responsable de definir y sostener:

- método inicial de cobro;
- proceso de revisión manual;
- carga de fixture;
- carga de resultados;
- resolución de incidencias;
- protocolo de cierre operativo.

### Técnica

Responsable de implementar y mantener:

- estados de participación;
- locks por horario;
- scoring reproducible;
- ranking oficial;
- trazabilidad de grupos;
- trazabilidad de promotores.

### Equipo de tesis / promotores

Responsable de acordar:

- listado oficial de promotores;
- códigos oficiales;
- criterio de reparto interno;
- gastos operativos deducibles;
- lectura interna del ranking de promotores.

## 30. Decisiones que no deben quedar implícitas

Antes de avanzar a producción, el equipo tiene que decidir explícitamente:

- si el precio inicial se congela hasta una fecha o puede cambiar manualmente en cualquier momento;
- si la entrada tardía tiene fecha límite absoluta o solo depende del admin;
- si el premio grupal es dinero, trofeo o reconocimiento;
- si el reparto interno de promotores se calcula sobre bruto o neto;
- si los pagos fallidos o refacciones se computan para ranking de promotores;
- si un jugador puede cambiar de grupo después de activar participación.

Si esas decisiones quedan implícitas, terminan reapareciendo como conflictos operativos cuando el sistema ya está cobrando.

## 31. Matriz de riesgos y respuesta

### Riesgo: se cobra antes de tener scoring confiable

Impacto:

- baja la legitimidad competitiva;
- aparecen discusiones sobre justicia del torneo.

Respuesta recomendada:

- no abrir ranking oficial ni comunicación de premios hasta cerrar scoring + resultados + locks.

### Riesgo: la atribución de promotor queda incompleta

Impacto:

- no se puede medir tracción real;
- la liquidación interna queda discutible.

Respuesta recomendada:

- capturar código/link de promotor desde registro y preservar atribución en participación.

### Riesgo: grupos se habilitan antes de definir regla de 11

Impacto:

- el premio grupal se vuelve confuso;
- aparecen expectativas incorrectas en grupos chicos.

Respuesta recomendada:

- habilitar ranking interno temprano, pero comunicar elegibilidad oficial recién con 11 activos.

### Riesgo: admin depende de planillas externas para operar todo

Impacto:

- sube el error manual;
- baja trazabilidad;
- se vuelve lento confirmar pagos o resultados.

Respuesta recomendada:

- priorizar admin mínimo dentro del producto antes de escalar el cobro.

### Riesgo: solidaridad tapa la propuesta principal

Impacto:

- baja la conversión;
- el producto se percibe menos competitivo.

Respuesta recomendada:

- mantener la solidaridad como capa de contexto y destino de fondos, no como mensaje principal de entrada.

## Próxima acción

Desglosar estas épicas en tickets técnicos concretos, empezando por:

1. scoring + ranking oficial;
2. grupos competitivos;
3. promotores operativos.

## Criterio de cierre

Este plan se cierra cuando:

1. exista una versión desglosada por entregables concretos;
2. el alcance del MVP recaudable esté confirmado por negocio y operación;
3. haya decisión tomada sobre cobro inicial, premios, deadline y regla de bonus.
