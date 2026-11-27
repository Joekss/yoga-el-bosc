# Configurar Supabase para El Bosc

La app ya no decide quién entra ni quién es profesora: lo decide Supabase. Hay que hacer estos pasos **una vez** en el panel de Supabase (proyecto `nvyjdjznmavukxhesiqd`) antes de publicar la nueva versión.

## 1. Crear las tablas y las reglas

1. Abre **SQL Editor → New query**.
2. Pega el contenido de `migrations/001_acces_i_rols.sql` y pulsa **Run**.
3. Repite con cada archivo nuevo de `migrations/` en orden (001, 002, …).

## 2. Hacer profesora a Cèlia

1. Cèlia entra una vez en la app con su correo (le llegará el correo de acceso).
2. Verá "Este correo no está en la lista": es normal.
3. En **SQL Editor** ejecuta (con su correo real):

```sql
update public.profiles set role = 'teacher' where email = 'correo-de-celia@ejemplo.com';
```

4. Cèlia pulsa **Volver a probar** o recarga: ya entra como profesora y ve **Ajustes → Alumnas y acceso**.

## 3. Añadir alumnas

Desde la app: **Ajustes → Alumnas y acceso → Añadir alumna**. Solo los correos de esa lista pueden entrar. "Poner en pausa" corta el acceso al momento, desde cualquier dispositivo.

## 4. Correo de acceso con código (importante para iPhone)

En el iPhone, el enlace del correo se abre en Safari y no en la app instalada. Por eso la app también acepta el código de 6 cifras. Para que el correo lo incluya:

1. **Authentication → Emails → Magic Link**.
2. Sustituye la plantilla por algo así:

```html
<h2>Entra a El Bosc</h2>
<p>Tu código: <strong style="font-size:22px;letter-spacing:4px">{{ .Token }}</strong></p>
<p>O toca este enlace desde el mismo dispositivo: <a href="{{ .ConfirmationURL }}">Entrar</a></p>
```

## 5. Direcciones permitidas

En **Authentication → URL Configuration**:

- **Site URL**: la dirección pública de la app (p. ej. `https://elbosc.netlify.app/`).
- **Redirect URLs**: añade esa misma dirección y `http://localhost:5000/` para probar en local.

## 6. Limitar el envío de correos (recomendado)

El correo de Supabase por defecto está limitado a pocos mensajes por hora. Para uso real conecta un SMTP propio en **Authentication → Emails → SMTP Settings** (Resend, Brevo, etc.).

## Probar en local sin Supabase

```bash
npm start
```

```bash
npm test
```

Las pruebas (`tests/smoke.spec.js`) usan un Supabase simulado (`tests/fake-supabase.js`), así que no tocan los datos reales.
