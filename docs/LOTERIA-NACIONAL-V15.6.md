# Lotería Nacional — especificación v15.6

## Alcance

La implementación cubre preparación de números, registro de décimos comprados, archivo, repetición, variantes y comprobación de premios.

## Reglas de dominio

- El número se conserva como cadena de exactamente cinco dígitos.
- La cantidad admitida es de 1 a 10 décimos.
- El coste se deriva del sorteo seleccionado; no existe un precio universal.
- Serie y fracción son opcionales, pero necesarias para confirmar un Premio Especial cuando el número coincide.
- Preparar un número no equivale a comprarlo ni reservarlo.

## Comprobación

El motor admite reglas normalizadas de tipo:

- premio exacto;
- Premio Especial;
- aproximación;
- centena;
- extracción o terminación de cuatro, tres y dos cifras;
- terminación del primer premio;
- reintegro.

Los importes publicados por billete se convierten a importe por décimo. Cuando solo existe un resumen parcial y no se puede descartar un premio, la jugada permanece pendiente de nueva comprobación.

## Datos

La API conserva el resultado y sus metadatos de integridad en `primy_draw_results.metadata`. El campo `nationalCompleteness` distingue, entre otros estados, un resumen parcial de un listado oficial completo.

## Seguridad de producto

Primy no vende décimos, no confirma disponibilidad comercial, no predice el número ganador y no garantiza premios.
