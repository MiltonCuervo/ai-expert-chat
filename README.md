# AI Expert Chat

Aplicación universitaria Full Stack para conversar con un asistente especializado en programación. Incluye modo simulado para el Taller 2 y OpenAI para el Proyecto IA.

**Integrantes:** completar con los nombres del equipo.  
**Repositorio:** completar al publicar en GitHub.  
**Aplicación:** completar después del despliegue en Vercel.

## Arquitectura y decisiones

`Navegador → componentes React → Route Handler / Server Actions → servicios → Supabase PostgreSQL / proveedor de IA`. App Router renderiza páginas y consulta datos en el servidor; el formulario y el chat son componentes cliente por su interactividad. Las Server Actions realizan mutaciones de conversaciones y administración. El Route Handler valida la sesión y la propiedad antes de construir el contexto en el servidor. `AIProvider` separa el proveedor de la interfaz; implementar otro adaptador y registrarlo en `getAIProvider` permite usar Gemini, Groq u Ollama. Ollama debe estar disponible en una dirección alcanzable desde el servidor de despliegue.

Supabase Auth administra `auth.users`, contraseñas y sesiones; `profiles` conserva el rol. El middleware de Next.js 15 renueva cookies y protege las páginas; cada acción o endpoint comprueba nuevamente al usuario y los permisos. RLS limita conversaciones y mensajes al propietario; la función de roles comprueba ADMIN en PostgreSQL. `service_role` se usa exclusivamente en servidor para insertar respuestas y contar datos generales, tras verificar identidad o rol. Nunca debe enviarse al navegador. El modelo recibe el prompt activo y hasta 20 mensajes previos; no se implementa streaming de tokens: los mensajes aparecen al completar la respuesta.

```text
src/app/            páginas, acciones, callback y API
src/components/     interfaz interactiva
src/lib/supabase/   clientes SSR, navegador y privilegiado
src/lib/ai/         contrato y adaptadores de IA
src/middleware.ts   renovación de sesión y redirección
supabase/schema.sql tablas, índices, trigger, funciones y RLS
```

El esquema usa `auth.users` → `profiles` (1:1) → `conversations` (1:N) → `messages` (1:N), con borrado en cascada. `assistant_settings` contiene una sola configuración global. Índices optimizan historial por usuario y mensajes por conversación. La clave y los datos de Auth se gestionan en `auth.users`, no en una tabla pública duplicada.

## Instalación

1. Instala Node.js 20 o superior y crea un proyecto Supabase.
2. En SQL Editor ejecuta una vez `supabase/schema.sql` en un proyecto vacío.
3. Copia `.env.example` a `.env.local` y completa URL, clave pública y `SUPABASE_SERVICE_ROLE_KEY` desde la configuración de API de Supabase. La clave service role es secreta y omite RLS. No la compartas ni uses el prefijo `NEXT_PUBLIC_`.
4. Configura en Supabase Auth la URL del sitio como `http://localhost:3000` y permite `http://localhost:3000/auth/callback` en Redirect URLs. Habilita correo/contraseña y configura SMTP para una entrega de correo fiable.
5. Ejecuta `npm install` y `npm run dev`; visita http://localhost:3000. Con `AI_PROVIDER=mock` funciona sin una clave de IA. Para Gemini, crea una clave en Google AI Studio y configura `AI_PROVIDER=gemini`, `GEMINI_API_KEY` y `GEMINI_MODEL=gemini-flash-lite-latest`. Para OpenAI usa `AI_PROVIDER=openai`, `OPENAI_API_KEY` y opcionalmente `OPENAI_MODEL=gpt-4o-mini`. Reinicia el servidor cuando cambies `.env.local`. El alias latest puede cambiar de modelo y disponibilidad; revisa la cuota y los precios de tu proyecto en Google AI Studio.
6. Registra y confirma el primer usuario. Para establecer el primer administrador, ejecuta en el SQL Editor de confianza: `update public.profiles set role = 'ADMIN' where email = 'correo-del-administrador';`. Los cambios posteriores se hacen desde el panel. La aplicación impide cambiar el propio rol.

`npm run typecheck` comprueba TypeScript y `npm run build` genera la aplicación. El archivo `.env.local` nunca debe subirse a Git.

## Vercel

Publica el código en GitHub e importa el repositorio en Vercel con el preset Next.js. Añade las variables necesarias de `.env.example` en Project Settings → Environment Variables, incluyendo los secretos como variables de servidor. Selecciona `AI_PROVIDER=gemini` y configura `GEMINI_API_KEY` para la demostración real, o usa OpenAI. Configura la URL pública como Site URL y añade `https://TU-DOMINIO/auth/callback` a las URLs permitidas de Supabase Auth. Actualiza `NEXT_PUBLIC_APP_URL` con la URL pública. Comprueba registro, confirmación, recuperación, chat y administración en el dominio desplegado. Las URLs de vista previa necesitan sus propios redirects permitidos.

## Prompt y evaluación

El prompt inicial está en `supabase/schema.sql`; identifica al asistente, limita el dominio a programación, pide explicaciones técnicas y ejemplos y exige reconocer incertidumbre. El administrador puede editarlo. Las instrucciones del modelo son orientación, no una garantía absoluta: evalúa respuestas reales y registra fecha, modelo, pregunta, resultado y observaciones antes de la entrega.

Casos mínimos de evaluación:

1. Explica la diferencia entre `let`, `const` y `var`.
2. ¿Cómo funciona una promesa en JavaScript? Incluye código.
3. Explica este error: `TypeError: Cannot read properties of undefined`.
4. Diseña una consulta SQL con JOIN entre usuarios y conversaciones.
5. ¿Cómo evitar una inyección SQL?
6. ¿Qué diferencia hay entre Server Components y Client Components?
7. ¿Qué hace este código? `const x = [1,2].map(n => n * 2)`.
8. ¿Cuál será el clima mañana? (fuera de dominio).
9. Recomiéndame una receta de pasta. (fuera de dominio).
10. ¿Por qué falla mi aplicación? No te doy código ni errores. (debe pedir contexto y reconocer incertidumbre).

Verifica además el aislamiento entre dos usuarios, el rechazo de ADMIN a un usuario normal, el historial tras recargar, el borrado en cascada, la recuperación de contraseña y los estados de error. Si falla la IA después de guardar la pregunta, el mensaje permanece en el historial; antes de reintentar, recarga y revisa el contenido.

## Límites y trabajo posterior

Esta base académica no implementa límites de tasa, cuotas, moderación, streaming, paginación administrativa ni una cola transaccional para reintentos. Para producción añade controles de abuso, observabilidad, gestión de concurrencia y costes, auditoría de roles, y pruebas de integración contra un proyecto Supabase aislado. Las estadísticas cuentan todos los mensajes y conversaciones. El panel permite listar usuarios y cambiar roles; el borrado de cuentas se realiza en Supabase, no desde el panel.
