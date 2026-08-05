# Primy v17.0.0 — Sports & Horse Recovery

- Validazione rigorosa delle giornate sportive e rimozione dei dati provvisori contaminati.
- La Quiniela torna collegata a una giornata ufficiale identificata e verificabile.
- El Quinigol diventa operativo: selezione 0/1/2/M, anteprima, archivio, acquisto registrato e verifica unificata.
- Nuovo sincronizzatore hípico Supabase, senza dipendenza dal vecchio endpoint Vercel.
- Lototurf e Quíntuple Plus distinguono correttamente “nessuna giornata attiva” da un errore tecnico.
- Trigger PostgreSQL impediscono la persistenza di composizioni incomplete o contaminate.
- Release applicativa aggiornata a 17.0.0.


# Primy v16.9.0 — Unified Fast Verification

- Motore unico di verifica premi per lotterie numeriche, Lotería Nacional, giochi sportivi e giochi ippici.
- Distinzione rigorosa tra categoria confermata, importo ufficiale disponibile e importo ancora in attesa di scrutinio.
- Feed Supabase `primy_verification_events` unificato con trigger, indici, RPC e Realtime.
- Sincronizzazione Fast: ogni 2 minuti nella fascia serale, fallback notturno e controlli diurni.
- Realtime nell’app: una nuova pubblicazione ufficiale avvia automaticamente la verifica delle giocate in attesa.
- Orchestrazione differenziata per evitare sovraccarico: numeriche a ogni ciclo, sportive ogni 5 minuti, ippiche ogni 15 minuti.


# Primy v16.8.1 — Coincidencias ganadoras de alta visibilidad

- Nueva comparación visual entre el boleto y el resultado oficial.
- Los números coincidentes se muestran con relleno intenso, aro dorado y distintivo ✓.
- Los números no coincidentes pierden protagonismo después de la comprobación.
- Se destacan también estrellas, complementario, reintegro, clave o número Sueño cuando corresponden.
- Resumen visible de coincidencias por boleto y por columna.
- Diseño adaptado a móvil, iPad, escritorio, modo oscuro y movimiento reducido.

# Primy v16.8.0 — Immediate Results Verification

- Acción `Comprobar ahora` en cada jugada pendiente.
- Verificación individual por ID de jugada.
- Consulta oficial en vivo cuando el archivo todavía no contiene el sorteo.
- Respuestas de comprobación sin caché negativa.
- Revisión automática en primer plano cada dos minutos.
- Cron SELAE acelerado durante la ventana nocturna.

# Primy v16.7.0 — Módulos operativos de Lototurf y Quíntuple Plus

- Activa la creación de jugadas hípicas sobre jornadas oficiales versionadas.
- Añade UX específica para Lototurf: selección 6/31, dorsales activos, simples y múltiples.
- Añade UX específica para Quíntuple Plus: cinco ganadores, segundo de la quinta, simples y múltiples.
- Conserva coste y apuestas equivalentes sin expandir combinaciones masivas.
- Rechaza dorsales retirados o ausentes de la composición oficial.
- Integra previsualización, borradores, sincronización y Archivo.
- Mantiene bloqueados el registro de compra y el escrutinio monetario hasta validar jornadas reales.

# Primy v16.6.0 — Datos oficiales de apuestas hípicas

- Descubrimiento de programas oficiales PDF de Lototurf y Quíntuple Plus.
- Extracción server-side de texto PDF, incluidos streams FlateDecode.
- Parser de carreras, participantes, dorsales, horarios, distancias y retirados.
- Parser de resultados oficiales por fecha para ambos juegos.
- Archivo Supabase versionado para jornadas hípicas y revisiones documentales.
- Nuevos endpoints `horse-rounds` y `sync-horse-rounds`.
- Validación estricta: Primy bloquea documentos incompletos o no interpretables.
- Lototurf y Quíntuple Plus permanecen sin creación de jugadas hasta completar UX y validación real.

# Primy v16.5.0 — Base matemática de apuestas hípicas

- Implementadas las reglas oficiales de Lototurf vigentes desde junio de 2026.
- Añadida la combinatoria autorizada de 6–10 números y 1–4 caballos.
- Añadidas las siete categorías de Lototurf y el control independiente del reintegro.
- Implementada la sustitución reglamentaria por retirada de caballo.
- Implementadas las reglas de Quíntuple Plus para cinco ganadores y segundo de la quinta carrera.
- Añadido el cálculo de múltiples excluyendo combinaciones imposibles en la quinta carrera.
- Añadidas las cuatro categorías de Quíntuple Plus y el límite de 65.535 apuestas.
- Catálogo hípico actualizado a “Base hípica en validación” sin activar funciones prematuras.
- Nuevas identidades visuales originales para Lototurf y Quíntuple Plus.

# Primy v16.4.1 — Creative icons hotfix

- Replaced placeholder inline icons with dedicated SVG illustration assets.
- Fixed Presupuesto, Mi archivo, Todos los juegos and Próximo sorteo.
- Added dedicated family icons for numbers, national lottery, sports and horse racing.
- Updated icon wrappers so the graphics render large and without the old colored-circle background.


# Primy v16.4.0 — Iconografía creativa y pulido visual

- Nuevo sistema de iconos UI para Presupuesto, Mi archivo, Todos los juegos y Próximo sorteo.
- Nueva iconografía de familia para Loterías de números, Lotería Nacional, Apuestas deportivas y Apuestas hípicas.
- Integración de los nuevos iconos en Home, catálogo de juegos y panel de preparación.
- Release visual de continuidad sobre la base mobile/iPad v16.3.0.


# Primy v16.3.0 — Mobile & iPad UX Redesign

- rifatta l’icona Presupuesto con un simbolo specifico per controllo e configurazione del budget;
- navigazione mobile resa più tattile, compatta e dinamica, con Preparar come azione centrale;
- schermata di preparazione riprogettata mobile-first con selettore giochi leggibile, budget compatto e CTA persistente;
- profilo mobile semplificato con navigazione rapida fra nome, esperienza, limiti e sicurezza;
- archivio mobile trasformato in flusso progressivo con filtri richiudibili e card-timeline;
- breakpoint iPad dedicato per griglie, profilo, catalogo e generatori;
- motion system ampliato per cambi di schermata, selezione gioco, card e contenuti, rispettando prefers-reduced-motion.

# Primy v16.2.0 — Iconos, movimiento, nombre personal y centro legal

- ocho iconos gráficos originales para las familias de juego;
- selector responsive sin nombres partidos ni solapamientos;
- transiciones entre vistas mediante View Transition API con fallback y movimiento reducido;
- animación escalonada de tarjetas, selección de juego y estados;
- nombre obligatorio durante el registro y editable desde Perfil;
- persistencia del nombre en `primy_profiles` y metadatos de autenticación;
- saludo personalizado sin utilizar el correo como nombre;
- condiciones de uso, privacidad y juego responsable accesibles desde la aplicación;
- aviso veraz sobre las jugadas almacenadas para archivo y sincronización;
- número de release visible en todas las pantallas principales.

# Primy v16.1.0 — Creative Restyle

- reconstruido el selector de juegos para evitar solapamientos y mantener nombres legibles en 320 px;
- añadida una identidad cromática centralizada y original para cada juego;
- compactada la pantalla de preparación con coste, límite personal y CTA verde persistente en móvil;
- conectada la experiencia Thinking a una presentación mínima de cuatro segundos;
- convertido el catálogo en una experiencia editorial con menos badges y más jerarquía;
- renovado el Archivo con resumen compacto, acentos por juego y prioridad visual de estados;
- rediseñado el Perfil con hero personal, companion owl, presupuesto responsable y seguridad;
- mantenidos sin cambios los motores matemáticos, reglas, datos y persistencia.

# Primy v16.0.0 — Visual Foundation

- nuovo sistema di token centralizzati per colore, superfici, spaziatura, radius, ombre e movimento;
- design system React ampliato con Button, Card, PageHeader, SectionHeader, StatusNotice, EmptyState, SegmentedControl e ActionMenu;
- ruoli funzionali della mascotte centralizzati: welcome, guide, thinking, confirmation, responsible ed empty;
- base accessibile del rituale di elaborazione Primy in quattro fasi, pronta per l’integrazione nel generatore;
- sidebar desktop semplificata e pannello promozionale duplicato rimosso;
- navigazione “Crear” rinominata “Preparar” per coerenza terminologica;
- home ridotta a hero, stato pendente, ultima attività e accessi rapidi;
- CTA principali uniformate al verde Primy e colori di gioco mantenuti come accenti secondari;
- nessuna modifica ai motori matematici, alle regole di gioco o alla persistenza.

# Primy v15.9.0 — Quiniela simple operativa

- activada la primera experiencia deportiva de Primy sobre la jornada oficial archivada;
- añadidos 14 selectores 1-X-2 y Pleno al 15 con buckets 0, 1, 2 y M;
- coste fijo de una apuesta simple y control del límite mensual;
- nuevo modelo persistente que vincula pronóstico, revisión y huella de la fuente oficial;
- guardado únicamente como borrador no comprado;
- vista específica de Quiniela en el Archivo;
- compra, comprobación, dobles, triples, Elige8, reducidas y condicionadas permanecen bloqueados;
- cache PWA actualizada a v15.9.0.

# Primy v15.8.0 — Datos deportivos oficiales y archivo versionado

- proveedor oficial de composiciones para La Quiniela y El Quinigol;
- parser estricto de 15 y 6 partidos sin completar datos ausentes;
- archivo Supabase `primy_sports_rounds`;
- historial inmutable de revisiones por `source_hash`;
- Edge Function y tareas programadas de sincronización;
- endpoint público de lectura y proxy limitado de actualización;
- juegos deportivos todavía bloqueados hasta completar UX, pronósticos y comprobación.

# Primy v15.7.0 — Fundación matemática de apuestas deportivas

- separada la arquitectura deportiva del motor de loterías numéricas;
- añadido modelo de jornada y partido oficial con validación y fingerprint;
- implementado motor de goles Poisson/Dixon-Coles con probabilidades 1-X-2 y 0-1-2-M;
- añadidas reglas combinatorias de Quiniela, Pleno al 15, Elige8, condiciones y Quinigol;
- catalogadas las reducidas oficiales sin inventar matrices ni garantías todavía no importadas;
- añadidas simulaciones Monte Carlo reproducibles para carteras deportivas;
- añadidas métricas log-loss, Brier, calibración y control de leakage temporal;
- Quiniela y Quinigol permanecen bloqueados hasta completar proveedor oficial, UX, persistencia y verificación;
- 129 pruebas automáticas superadas.

# Primy v15.6.0 — Lotería Nacional + evolución de marca

- Lotería Nacional activa con flujo dedicado para preparar números y registrar décimos comprados.
- números de cinco cifras conservados como texto para respetar ceros iniciales.
- selección dinámica de sorteo, 1–10 décimos, precio unitario, serie y fracción.
- generador uniforme completo o parcial y favoritos locales.
- comprobación de exactos, Premio Especial, aproximaciones, centenas, terminaciones y reintegros.
- parser del listado oficial completo de premios con importes normalizados por décimo.
- estados pendientes cuando SELAE todavía no publica información suficiente; Primy no asigna falsos ceros.
- archivo Supabase y funciones de sincronización ampliados para Lotería Nacional.
- revisión del símbolo Primy, wordmark, favicon, iconos PWA y lenguaje visual de la aplicación.
- cache PWA actualizada a v15.6.0.

# Primy v15.5.3 — Primy Core accesso dalla home

- aggiunto il comando evidente “Cómo funciona Primy Core” nella parte alta della pagina principale
- lo stesso popup informativo è ora condiviso fra home e generatore
- estratto il popup in un componente unico per evitare divergenze future
- mantenuto integralmente l’hotfix v15.5.2 della verifica dei premi EuroDreams
- aggiornate le cache PWA alla v15.5.3

# Primy v15.5.2 — Verificación de sorteos hotfix

- corregida la ventana horaria de sincronización SELAE en Supabase
- reintentos automáticos cada 15 minutos durante la franja de publicación
- corregida la asignación de categorías e importes oficiales de EuroDreams
- corregida la jugada del 30/07/2026: 2 aciertos = 2,50 €
- añadida una prueba de regresión para impedir que vuelva a ocurrir

# Primy v15.5.1 — El Gordo + Primy Core popup refinement

- refuerzo visual y narrativo de Primy Core en la cabecera del generador
- nuevo popup explicativo con copy simplificado, foco en análisis avanzado y comprobación automática de premios
- variante gráfica renovada del bloque con la mascota dentro del popup
- integración final de El Gordo de la Primitiva como juego activo
- soporte para apuestas múltiples de El Gordo (6 y 7 números)
- mejora del panel generador con aviso específico del número clave

# 15.4.0 — Bonoloto completa

- Activa Bonoloto en Crear, Registrar, Archivo, Comprobar e Historial.
- Implementa apuestas sencillas de 2 a 8 columnas, respetando el mínimo de 1 € por boleto.
- Implementa múltiples oficiales de 5, 7, 8, 9, 10 y 11 números con 44, 7, 28, 84, 210 y 462 apuestas equivalentes.
- Conserva las múltiples de forma compacta y desarrolla las combinaciones solo durante la comprobación.
- Solicita el reintegro real al registrar el boleto; Primy no inventa el valor asignado por SELAE.
- Añade categorías 6, 5+C, 5, 4, 3 y reintegro, con agregación correcta de premios múltiples.
- Amplía SELAE/Supabase, calendario diario, catálogo, preferencias, métricas y PWA.
- Añade salvaguarda visual de contraste y pruebas de regresión del flujo de registro.
- Da mayor protagonismo a Primy Core con una cabecera translúcida animada y un acceso «Descubre más».
- Añade un diálogo accesible con copy simple, mascota de apoyo y explicación clara de lo que Primy Core hace y no hace.

# 15.3.1 — Corrección crítica del botón Euromillones

- Corrige la paleta `sky` de Tailwind: la definición anterior sobrescribía la escala completa y evitaba generar clases como `bg-sky-700`.
- Restaura el contraste visible del selector, iconos, paneles, estrellas y botón principal de Euromillones.
- Añade una clase CSS de seguridad para que la acción «Crear mi jugada» no pueda quedar blanca sobre fondo blanco aunque cambie la configuración de Tailwind.
- Añade una etiqueta accesible específica y un identificador de acción por juego.
- Incorpora pruebas de regresión sobre tokens visuales y presencia de la CTA.
- Refuerza el gate del equipo: ningún juego se considera operativo hasta superar reglas, generación, persistencia, comprobación y validación visual real.

# 15.3.0 — Euromillones operativo

- Activa Euromillones en Crear, Registrar, Archivo, Comprobar e Historial.
- Añade cinco números del 1 al 50 y dos estrellas del 1 al 12 por columna.
- Implementa las trece categorías de premio sin inventar importes cuando SELAE no los aporta.
- Amplía el archivo Supabase con `secondary_numbers` y la sincronización oficial del juego `EMIL`.
- Mantiene El Millón como referencia externa: Primy no genera códigos oficiales.
- Incorpora identidad visual azul, validación accesible y pruebas de reglas, persistencia y parsing.

# 15.2.0 — Catálogo completo de juegos

- Nueva página `Juegos` en `/juegos`, con compatibilidad para la ruta anterior `/explorar`.
- Catálogo de los diez juegos principales de SELAE, organizado en cuatro familias: números, Lotería Nacional, deportes e hípicas.
- Buscador y filtros por familia, diseñados para mantener la navegación comprensible al crecer el catálogo.
- Registro declarativo de capacidades por juego: crear, registrar, comprobar, archivo, análisis y datos oficiales.
- Solo La Primitiva y EuroDreams conservan acciones operativas; el resto muestra su ficha de preparación sin simular funciones incompletas.
- Gate de publicación reforzado: ningún juego nuevo se activa sin validación conjunta de UX, arquitectura, reglas y diseño.
- Añadidas pruebas de integridad, agrupación, búsqueda y bloqueo de capacidades del catálogo.

# 15.1.2 — Supabase archive hotfix

- `/api/bootstrap`, `/api/history`, `/api/check-results` e `/api/provider-status` leggono esclusivamente l'archivio `primy_draw_results` in Supabase.
- Le funzioni Vercel non contattano più SELAE direttamente.
- Lettura Supabase disponibile anche senza `SUPABASE_SERVICE_ROLE_KEY`, tramite chiave publishable con sola policy SELECT.
- Gli ultimi risultati verificati restano disponibili quando SELAE o il trasporto di sincronizzazione sono temporaneamente indisponibili.
- Caché PWA versionata per evitare che bootstrap e storico conservino risposte della release precedente.
- Corretto il riferimento all’icona delle notifiche.
- Aggiunto il protocollo di briefing con approvazione incrociata del team per l’estensione a tutti i giochi.

# Changelog

## v15.1.0 — Resultados oficiales SELAE sin cuota comercial

- Sustituida LoteriasAPI por los ficheros oficiales de SELAE para La Primitiva y EuroDreams.
- Eliminada la necesidad de `LOTERIA_API_KEY`.
- Añadido archivo persistente `primy_draw_results` en Supabase, accesible solo desde servidor.
- Sincronización diaria protegida con `CRON_SECRET` y Vercel Cron.
- Comprobación por fecha con caché, validación de fecha, seis números y extras oficiales.
- Importador histórico reanudable `backfill:selae` con omisión de sorteos ya archivados.
- Actualizados los mensajes de Perfil e Historial para reflejar SELAE y el archivo propio.

## v15.0.1 — Eliminación segura de jugadas

- Añadido acceso directo para eliminar cualquier jugada desde el archivo, también cuando está registrada como comprada.
- Confirmación obligatoria antes de eliminar, con aviso específico de que borrar el registro no anula el boleto físico ni la apuesta realizada.
- Acción disponible tanto en la tabla de escritorio como en las tarjetas móviles y en el detalle de la jugada.
- La eliminación conserva la opción de deshacer mediante el aviso posterior.

## v15.0.0 — Architecture, Clarity & Resilience

- `App.jsx` reducido a un entry point de 43 líneas; la orquestación pasa a controladores y capas de vistas/overlays.
- Generación en Web Worker con cancelación, timeout de 30 segundos, invalidación de respuestas tardías y recuperación limpia tras errores.
- Error boundary por vista: un fallo en una pantalla lazy ya no bloquea toda la aplicación.
- Acciones de jugadas y comprobación de resultados separadas en hooks dedicados.
- Identificadores seguros con fallback para navegadores sin `crypto.randomUUID`.
- Inicio simplificado con una CTA principal, resumen mensual, últimas jugadas y dos accesos secundarios.
- Toasts pausables al interactuar y acciones de deshacer visibles durante más tiempo.
- Perfil mejorado: límite mensual con detección de cambios, sincronización accesible y backup v15.
- Laboratorio Monte Carlo traducido al castellano, cancelable y protegido con timeout, sin alterar el modelo estadístico.
- Navegación con gestión de foco, badges accesibles y estados de sincronización anunciados.
- Manifest, iconos, accesos directos y cachés PWA actualizados a v15.
- 54 pruebas automatizadas superadas; 95 archivos JS/JSX validados sintácticamente y ninguna importación local ausente.
- Sin cambios en el motor uniforme, las probabilidades ni las reglas oficiales de los juegos.

## v14.0.1 — Age Gate, History Stability & Brand Icon Fix

- Aplicados los activos definitivos de Michela Brand Core a la app, PWA, favicon y Apple Touch Icon.
- Añadida verificación obligatoria de mayoría de edad antes de acceder a las funciones de Primy.
- La fecha de nacimiento se calcula localmente y no se almacena.
- Reducidas las llamadas a LoteriasAPI cuando el plan solo permite el último sorteo.
- Añadidos caché, enfriamiento de actualización y recuperación silenciosa con la última copia válida.
- Simplificados los avisos de historial y aclarado que no interviene en Primy Core.
- 50 pruebas automatizadas superadas.

## v14.0.0 — Operation Diamond

- Home premium modulare con Hero, azioni rapide, sorteggi pendenti e firma visuale Primy Fold.
- Mascotte responsive su smartphone, tablet e desktop; onboarding e copy aggiornati.
- Create Experience con avanzamento percepibile, animazione Primy Core e presentazione premium della giocata.
- Conferme accessibili per registrazione, scarto ed eliminazione; distinzione chiara fra bozza e giocata acquistata.
- Archivio con filtri rapidi, contatori e ordinamento predefinito “Acción necesaria”.
- Dettaglio delle giocate con stato, costo, data, premi, acerti e importi ufficiali più leggibili.
- Pagina pubblica di gioco responsabile, asset e cache PWA aggiornati.
- 44 test di dominio e matematica superati.
- Nessuna modifica al motore uniforme, alle probabilità o alle regole SELAE.

# Registro de cambios

## v13.0.0 — Primy Core Experience

- Nueva arquitectura de experiencia: Inicio, Crear, Explorar, Archivo y Perfil.
- Home simplificada y orientada a una única acción principal.
- Nuevo flujo continuo `CreateJourney` para configurar, crear y presentar la jugada.
- Resultado y Archivo rediseñados con mejor jerarquía, estados vacíos y acciones accesibles.
- Perfil reorganizado con ajustes avanzados mediante divulgación progresiva.
- Primy Core utiliza generación uniforme independiente del historial.
- Eliminados del flujo de producción los modelos predictivos y el análisis histórico.
- Mejoras de accesibilidad, reduced-motion, navegación por teclado y targets táctiles.
- Rutas, cachés PWA, sincronización y modo offline actualizados a v13.
- 41 pruebas matemáticas y de dominio superadas.

## v12.6.1 — Corrección del generador responsive

- Corregida la superposición y compresión del tutorial al mostrar un boleto generado.
- El generador y el boleto solo se muestran en dos columnas cuando existe anchura real suficiente.
- En vista compacta, la mascota se convierte en un banner horizontal y deja de robar ancho a los controles.
- Añadidas protecciones `min-width: 0` para evitar desbordamientos y texto en columnas verticales.
- El resultado se desplaza debajo del generador en portátiles y pantallas medianas.

## v12.6.0 — Pulido visual, movimiento y sistema de mascota

- Nueva paleta Primy más luminosa y equilibrada: verde principal, mint, ivory, cream, gold, sky, peach y lavender.
- Sistema de mascota con variantes Welcome, Helper, Thinking, Celebration, Empty y Responsible.
- Mascota contextual integrada en autenticación, dashboard, onboarding, generador, estados vacíos, guardado, migración, ajustes y errores.
- Nuevo diseño de acceso y registro más compacto, sin espacio blanco interior innecesario y con pestañas dedicadas.
- Animaciones accesibles para entrada de página, tarjetas, mascota, shimmer, revelado de bolas y feedback de éxito.
- Generador rediseñado con la mascota Thinking durante el procesamiento.
- Estados de vista previa y guardado del boleto enriquecidos con las mascotas Helper y Celebration.
- Manifest PWA y cachés actualizados a la versión v12.6.

## v12.5.4 — Auth layout tightened and rebalanced

- Reducción fuerte del ancho útil del bloque de autenticación para eliminar el espacio blanco excesivo en desktop.
- Columnas de acceso con anchuras controladas y centradas, evitando la sensación de pantalla vacía.
- Mascota, titular y formulario mejor proporcionados entre sí.
- Ajuste de padding vertical para acercar el contenido a la parte alta del viewport.

## v12.5.3 — Reequilibrio visual de acceso y home

- Rediseño completo de login y registro para eliminar espacios vacíos excesivos y mejorar el equilibrio entre hero, mascota y formulario.
- Formulario de acceso desplazado hacia arriba y encapsulado en una tarjeta más clara y compacta.
- Reordenación de textos, jerarquía y bloques informativos en la pantalla de autenticación.
- Ajuste de la página principal/dashboard para reducir altura muerta, compactar la hero y mejorar la distribución de CTAs y contenido.

## v12.5.2 — Mascota extendida en la experiencia

- La mascota de Primy ahora aparece también en el estado vacío de Mis jugadas.
- Integración en la introducción paso a paso para reforzar onboarding y personalidad.
- Integración en la migración de datos locales a la cuenta.
- Nuevo bloque “Consejo de Primy” en Ajustes para reforzar el juego responsable.

## v12.5.1 — Mascota Primy

- Integración de la nueva mascota búho de Primy en las áreas hero.
- Sustitución de la ilustración genérica anterior por una identidad más divertida y memorable.
- Nuevos assets optimizados `primy-mascot.webp` y `primy-mascot-card.webp`.
- La pantalla de acceso y el dashboard usan ahora la mascota como elemento principal de marca.

## v12.4.0 — Cuentas y Supabase

- Registro e inicio de sesión con correo y contraseña.
- Confirmación del correo, reenvío y recuperación de contraseña.
- Base de datos multiusuario con tablas `primy_*`.
- Row Level Security para aislar completamente los datos de cada cuenta.
- Sincronización de jugadas y preferencias entre dispositivos.
- Importación opcional del historial antiguo del navegador.
- Cola local de cambios para periodos sin conexión.
- Sección de cuenta y cierre de sesión.

## v12.3.0 — Localización es-ES

- Interfaz, accesibilidad, mensajes, rutas y documentación convertidos a castellano.
- Rutas principales: `/generar`, `/jugadas` y `/ajustes`.

## v12.2.0 — Reglas SELAE

- Un único Reintegro por resguardo de La Primitiva.
- Un número Sueño por apuesta simple de EuroDreams.
- Límites de ocho apuestas para La Primitiva y seis para EuroDreams.
- Verificación de premios y migración del historial ajustadas al modelo correcto.

## v12.1.0 — Yuma Focused UX

- La página de inicio permite elegir el juego explícitamente.
- Flujo simplificado: juego → presupuesto → generación → registro.
- Detalles técnicos ocultos inicialmente.
- Mejor navegación y enfoque del resultado en móvil.

## v12.0.0 — Refuerzo técnico

- Validación de API, observabilidad, cortacircuitos y barrera global de errores.
- Endpoints serverless endurecidos y pruebas automáticas ampliadas.

## 15.1.1 — 2026-07-30

- Sincronización de resultados trasladada íntegramente a Supabase Edge Functions y `pg_cron`.
- Lectura oficial de SELAE mediante una caché de lectura intermedia para evitar el bloqueo 403 de los centros de datos.
- Una única adquisición externa alimenta el archivo Supabase; las consultas de usuarios no consumen cuota externa.
- Las API de Vercel pasan a ser de solo lectura y ya no requieren `SUPABASE_SERVICE_ROLE_KEY` ni `CRON_SECRET`.
- Añadida doble sincronización diaria con reintento matinal.
