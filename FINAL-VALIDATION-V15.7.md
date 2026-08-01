# Validación final — Primy v15.7.0

## Resultado

- 129 pruebas automáticas superadas.
- Base deportiva separada del motor numérico.
- Quiniela y Quinigol permanecen sin capacidades operativas públicas.
- Matrices de reducidas no inventadas: continúan pendientes de importación oficial.
- Simulaciones reproducibles mediante semilla.
- Métricas probabilísticas y control de leakage temporal incluidos.

## Cobertura deportiva

- jornadas de 15 partidos para Quiniela y 6 para Quinigol;
- probabilidades Poisson/Dixon-Coles;
- agregación `1-X-2` y `0-1-2-M`;
- combinatoria de dobles, triples y Pleno al 15;
- Elige8;
- condiciones por variantes, empates y signos `2`;
- múltiples y comprobación de Quinigol;
- Monte Carlo de cartera;
- log-loss, Brier y calibración.

## Limitación de build

La suite Node se ejecutó correctamente. La build Vite completa requiere instalar las dependencias. En este entorno el registro npm interno no distribuye `@supabase/supabase-js@2.57.4` y el intento con el registro público agotó el tiempo disponible, por lo que no se afirma una build local que no se ha completado.
