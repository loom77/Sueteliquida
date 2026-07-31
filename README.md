# Primy v15.6.0

Primy es una PWA en castellano para preparar, guardar y comprobar jugadas. La aplicación no vende boletos, no reserva números, no predice sorteos y no garantiza premios.

## Novedades de v15.6.0

- Lotería Nacional operativa con una experiencia propia, separada del modelo de columnas numéricas.
- Preparación de números de cinco cifras, preservando ceros iniciales como `00742`.
- Elección de sorteo, generación uniforme, bloqueo parcial de cifras y números favoritos.
- Registro de 1 a 10 décimos con coste dinámico, serie y fracción opcionales.
- Comprobación por número, aproximaciones, centenas, terminaciones, reintegros y Premio Especial.
- Lectura del listado oficial completo de premios cuando SELAE lo publica; si falta, Primy mantiene la jugada pendiente y no inventa un resultado.
- Archivo Supabase y sincronización oficial ampliados para Lotería Nacional.
- Evolución de marca: símbolo Primy simplificado, wordmark revisado, iconos PWA renovados y una interfaz más diferenciada por juego.

## Juegos operativos

- **La Primitiva**
- **Bonoloto**
- **Euromillones**
- **EuroDreams**
- **El Gordo de la Primitiva**
- **Lotería Nacional**

Los juegos deportivos e hípicos permanecen en fase de arquitectura y no exponen funciones incompletas.

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
