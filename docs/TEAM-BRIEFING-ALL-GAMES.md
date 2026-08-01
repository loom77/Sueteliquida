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

## Decisión aprobada — v15.2

El briefing ha aprobado e implementado la primera capa:

- página `Juegos`;
- agrupación en cuatro familias;
- diez fichas de catálogo;
- capacidades declarativas;
- acciones bloqueadas hasta validación completa;
- búsqueda y filtros;
- ruta `/juegos` con compatibilidad `/explorar`.

La implementación de motores individuales sigue sujeta al gate original. El catálogo no equivale a que todos los juegos estén ya operativos.


## Gate obligatorio antes de declarar un juego operativo

A partir de v15.3.1 ningún juego puede publicarse como operativo solo porque el motor matemático tenga pruebas. La aprobación conjunta exige:

1. **David/Euler — reglas:** rangos, selecciones, extras, coste, calendario, apuestas simples/múltiples y categorías de premio contrastados con SELAE.
2. **Alvaro — flujo completo:** crear, registrar, persistir, repetir, eliminar, comprobar y recuperar errores sin rutas muertas.
3. **Yuma — UX y accesibilidad:** CTA principal visible y accionable en móvil/escritorio, estados loading/error, foco, contraste y copia inequívoca.
4. **Nico — sistema visual:** todos los tokens existen en la compilación final; no se admiten clases de color inexistentes ni controles invisibles.
5. **QA cruzado:** captura o revisión visual real en tema claro y oscuro, más pruebas automatizadas del contrato del juego.

Una capacidad permanece bloqueada en el catálogo hasta que las cinco comprobaciones estén aprobadas.
