# Primy v13 — Limitaciones conocidas antes del lanzamiento

## Validación de frontend pendiente

La build Vite no se ha podido ejecutar en el entorno de trabajo porque la instalación de dependencias npm no finalizó. No se ha detectado un error de código específico, pero la release no debe publicarse sin completar este gate.

## Dependencia de proveedores externos

La consulta de sorteos y resultados depende de servicios externos. Primy conserva estados de error, caché local y reintento, pero no puede garantizar la disponibilidad de terceros.

## Funcionamiento offline

La creación y consulta de datos locales pueden continuar en modo offline, pero la sincronización de cuenta y la comprobación de resultados requieren conectividad.

## Alcance matemático

Primy no predice sorteos ni aumenta la probabilidad física de una combinación. Las estadísticas históricas son descriptivas y permanecen separadas de la generación.
