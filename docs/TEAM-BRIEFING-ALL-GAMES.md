# Briefing de equipo — Incorporación de todos los juegos SELAE

## Mandato de producto

Antes de modificar la arquitectura o implementar reglas de nuevos juegos, el equipo debe acordar la estructura de navegación, selección y presentación que permita a una persona acceder a cualquier juego admitido sin aumentar la confusión de la interfaz.

## Regla de coordinación obligatoria

Ninguna propuesta pasa a desarrollo por decisión aislada. Cada cambio debe superar cuatro validaciones:

1. **Producto y UX (Yuma):** comprensible, accesible, mobile-first y coherente con el flujo completo.
2. **Arquitectura y entrega (Alvaro):** viable, mantenible, seguro, comprobable y compatible con Vercel/Supabase.
3. **Reglas y modelo (David/Euler):** reglas del juego, validación de boletos, premios y límites representados sin afirmaciones predictivas.
4. **Marca y sistema visual (Nico):** coherencia visual, jerarquía y escalabilidad del design system.

Si uno de los cuatro bloques detecta un riesgo crítico, la propuesta vuelve al briefing y no se implementa.

## Primera decisión pendiente

Definir una página de selección de juegos que responda, antes de entrar en motores específicos, a estas preguntas:

- ¿Cómo se agrupan los juegos para que la lista sea comprensible?
- ¿Qué información mínima necesita cada tarjeta de juego?
- ¿Cómo se distingue entre crear, registrar, comprobar y analizar una jugada?
- ¿Cómo se evitan pantallas sobrecargadas cuando aumente el catálogo?
- ¿Qué juegos admiten generación de combinaciones y cuáles requieren otros tipos de entrada?
- ¿Qué datos oficiales están disponibles y con qué frecuencia se sincronizan?
- ¿Qué funciones deben permanecer desactivadas hasta disponer de validación completa?

## Gate de entrada al desarrollo

No se crea código de un juego nuevo hasta disponer de:

- ficha funcional aprobada;
- reglas y rangos verificados;
- calendario y cierre definidos;
- modelo de boleto normalizado;
- estrategia de resultados oficiales;
- estados UX completos;
- pruebas mínimas acordadas;
- aprobación conjunta del equipo.
