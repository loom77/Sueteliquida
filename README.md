# Primy v16.3.0

Primy es una PWA en castellano para preparar, guardar y comprobar jugadas. La aplicación no vende boletos, no reserva apuestas, no predice resultados como certezas y no garantiza premios.


## Novedad v16.1.0 — Creative Restyle

- Selector de juegos reconstruido sin solapamientos, con tarjetas legibles y color propio por juego.
- Sistema cromático centralizado para Primitiva, Bonoloto, Euromillones, El Gordo, EuroDreams, Lotería Nacional, Quiniela y Quinigol.
- Preparación de jugadas más compacta, con presupuesto, límite y CTA persistente en móvil.
- Secuencia Thinking de cuatro segundos antes de revelar la combinación automática.
- Catálogo editorial con identidad visual, menos etiquetas técnicas y acciones simplificadas.
- Archivo con resumen compacto, acentos por juego y elementos que priorizan las acciones pendientes.
- Perfil rediseñado con hero personal, companion owl, experiencia, juego responsable y seguridad.
- Sin cambios en motores matemáticos, reglas, datos o persistencia.


## Novedad v16.0.0 — Visual Foundation

- Design system centralizado y coherente con el nuevo logo Primy.
- Sidebar y navegación simplificadas.
- Home más corta, con una acción principal dominante.
- Roles funcionales de la mascota y base del ritual de preparación en cuatro fases.
- Sin cambios en motores matemáticos, reglas, datos o persistencia.


## Novedad v15.9.0 — Quiniela simple operativa

- Jornada oficial SELAE cargada desde el archivo deportivo versionado.
- Boleto dedicado con 14 selectores `1-X-2` y Pleno al 15 `0-1-2-M`.
- Una apuesta simple a 0,75 €, con coste visible y control del límite mensual.
- El pronóstico conserva jornada, revisión, `source_hash` y composición completa.
- Guardado como borrador no comprado en el Archivo de Primy.
- Vista de detalle deportiva propia; compra, escrutinio, múltiples, Elige8, reducidas y condicionadas siguen bloqueados.

## Novedad v15.8.0

La Quiniela y El Quinigol disponen de proveedor oficial de composición y archivo versionado de jornadas. Las acciones de juego siguen desactivadas hasta completar su UX y verificador.

## Novedades de v15.7.0

- Primera base deportiva aislada completamente del motor de loterías numéricas.
- Modelo formal de jornadas y partidos oficiales para La Quiniela y El Quinigol.
- Motor probabilístico de goles Poisson con ajuste Dixon-Coles y snapshots versionados.
- Conversión de una misma matriz de marcadores a probabilidades `1-X-2`, Pleno al 15 y casillas `0-1-2-M`.
- Combinatoria y coste de apuestas directas, dobles, triples, Elige8 y múltiples de Quinigol.
- Condiciones por variantes, empates y victorias visitantes.
- Simulación Monte Carlo reproducible para evaluar carteras sin prometer resultados.
- Métricas científicas de log-loss, Brier, calibración y detección de fuga temporal.
- La Quiniela y El Quinigol siguen bloqueados en producción hasta completar jornadas oficiales, UX, persistencia y comprobación.

## Juegos operativos

- **La Primitiva**
- **Bonoloto**
- **Euromillones**
- **EuroDreams**
- **El Gordo de la Primitiva**
- **Lotería Nacional**
- **La Quiniela**, limitada en v15.9.0 a una apuesta simple preparada como borrador

El Quinigol mantiene la base matemática y el archivo oficial en validación, sin acciones operativas. En La Quiniela todavía permanecen bloqueados compra, comprobación, múltiples, Elige8, reducidas y condicionadas. Los juegos hípicos continúan en fase de arquitectura.

## Modelo específico de Lotería Nacional

Lotería Nacional no reutiliza el modelo de combinaciones de bolas. Cada registro conserva:

```js
{
  gameId: 'loteria-nacional',
  drawDateKey: '2026-08-01',
  drawType: 'special',
  drawName: 'Extra de Agosto',
  nationalNumber: '07360',
  ticketQuantity: 1,
  pricePerDecimo: 15,
  totalCost: 15,
  series: null,
  fraction: null,
  purchased: true
}
```

Preparar un número no lo compra ni confirma su disponibilidad. La disponibilidad solo puede verificarse en los canales oficiales o puntos de venta autorizados.

## Resultados oficiales

SELAE es la fuente oficial. Supabase sincroniza y conserva los resultados verificados en `primy_draw_results`; las sesiones de usuario leen ese archivo y no multiplican las consultas externas.

```text
SELAE resultados + listado oficial de premios
                    │
                    ▼
Supabase Cron → Edge Functions → validación estricta
                                      │
                                      ▼
                             primy_draw_results
                                      │
                                      ▼
                             API de lectura Primy
```

Para Lotería Nacional el resumen del sorteo no siempre basta. Primy intenta incorporar el listado oficial completo y conserva un indicador de integridad. Si el listado no está disponible, la comprobación queda pendiente.

## Primy Core

Primy Core usa un motor inteligente de análisis avanzado para aplicar reglas, organizar estadísticas descriptivas y automatizar comprobaciones. Las estadísticas no alteran la probabilidad del próximo sorteo y Primy no asegura ninguna ganancia.

## Configuración de Vercel

Variables públicas requeridas:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Opcionales para las API de lectura:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
RESULT_CACHE_TTL_MINUTES
```

No se necesitan claves comerciales de lotería en Vercel.

## Desarrollo

```bash
npm install
npm run dev
npm test
npm run build
```

Requiere Node.js 20–24.

## Scanner

El scanner de boletos permanece en beta limitada: captura referencias compatibles con el navegador, pero los números, la serie y la fracción deben confirmarse manualmente hasta disponer de reconocimiento oficial fiable.