# OvalPlan · App para entrenadores de rugby

## La idea

Una app que ayuda a los **entrenadores de rugby a planificar los entrenamientos**: el entrenador cuenta con qué cuenta y qué quiere trabajar, y la app le propone ejercicios y le arma la sesión. Después sirve para seguir cómo avanza el equipo y cada jugador.

La propuso **Juan, cuñado de Santiago**, a partir de un problema que tiene él en el día a día ("mis problemas de día"). **Juan es el primer usuario y la mejor fuente para validar.**

## Lo que pidió Juan (resumen de su audio)

1. **Datos de entrada:** las **edades o la categoría** del grupo, la **cantidad de jugadores** y los **temas que quiere trabajar** (por ejemplo: tackle, pase, ruck, line-out, defensa).
   - **Confirmado: son jugadores, "cantidad de chicos".** Juan entrena chicos, así que el foco inicial es el **rugby infantil y juvenil**. También conviene sumar los **recursos disponibles** (pelotas, conos, escudos, cancha).
2. **Propuesta de ejercicios** acordes a eso, con buenos recursos: **explicación y video** (o un diagrama o una animación).
3. **Planificación de la sesión completa:** por ejemplo, de 90 minutos, repartida en bloques (entrada en calor, técnica, juego, cierre). Que se pueda elegir el enfoque: **más juegos o más ejercicios**, etc.
4. **Planner:** calendario de entrenamientos de la temporada o del mes.
5. **Seguimiento:** ir marcando qué se hizo y cómo avanza el equipo.
6. **Jugadores:** cargar a cada jugador con sus características, y que la **IA proponga mejoras** o ejercicios para cada uno.

## Primeras preguntas para Juan

- ¿Qué categorías entrena (infantiles, juveniles, plantel superior)? ¿Cuántos jugadores tiene y cuántos entrenadores son?
- ¿Cómo planifica hoy? ¿Papel, Excel, WhatsApp? ¿Cuánto tiempo le lleva?
- ¿Qué es lo que más le cuesta: encontrar ejercicios nuevos, armar la sesión, adaptar a la edad, o seguir a cada jugador?
- ¿De dónde saca hoy los ejercicios y los videos?
- ¿Lo usaría desde el celular en la cancha?
- ¿Su club o la unión pagaría por una herramienta así? ¿Cuánto?

## Temas a tener en cuenta

- **Rugby infantil y juvenil:** los ejercicios tienen que respetar las reglas y la progresión por edad (contacto, tackle, scrum). La app no debería proponer algo inadecuado para la categoría. Conviene basarse en las guías de World Rugby y de la unión local (en Argentina, la UAR).
- **Videos:** usar videos propios, enlazar videos públicos (por ejemplo, de YouTube) sin copiarlos, o generar diagramas o animaciones de los ejercicios. No descargar ni republicar videos ajenos.
- **IA:** sirve para armar la sesión a partir de una biblioteca de ejercicios bien cargada, no para inventar ejercicios sin control. Lo que propone tiene que ser revisable y editable por el entrenador.
- **Datos de jugadores:** si hay menores, cuidar los datos personales y no guardar más de lo necesario.

## Cómo seguir

- **Validar con Juan antes de programar:** con las preguntas de arriba, y si se puede, con 3 a 5 entrenadores más de su club.
- **Prototipo mínimo:** biblioteca de ejercicios (unos 30 a 50, cargados con Juan) → el entrenador elige categoría, cantidad de jugadores, tiempo y temas → la app arma una sesión editable. El seguimiento y la parte de jugadores con IA, después.
- Stack sugerido, el mismo que usa Santiago: React + Vite + Tailwind, con un backend en Node o Python. Pensado para el **celular**, porque se usa en la cancha.

## Nombre

**OvalPlan** ("plan" más la pelota ovalada). Elegido el 13/11/2026 entre OvalPlan, OvalPlanner, Ovalito y otros: es corto, se entiende en castellano y en inglés, y "plan" abarca la sesión, la semana y la temporada. Ese día estaban libres `ovalplan.com`, `ovalplan.app`, `ovalplanner.com` y `ovalplanner.app`. Pendiente: registrar `ovalplan.com` (y opcionalmente `ovalplanner.com`, para que redirija), buscar la marca en el INPI y revisar las tiendas de apps.

## Contexto de Santiago

Desarrollador full stack (React, Node, Python). Tiene una búsqueda laboral activa y otros proyectos en paralelo (PAM, Dibuya, una web de servicios), así que conviene avanzar con prototipos chicos y validar antes de invertir mucho tiempo.
