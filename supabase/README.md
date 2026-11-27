# Configurar Supabase para El Bosc

La app ya no decide quién entra ni quién es profesora: lo decide Supabase. Hay que hacer estos pasos **una vez** en el panel de Supabase (proyecto `cuigobpxeyzigialyiwc`, región Frankfurt) antes de publicar la nueva versión.

## 1. Crear las tablas y las reglas

1. Abre **SQL Editor → New query**.
2. Pega el contenido de `migrations/001_acces_i_rols.sql` y pulsa **Run**.
3. Repite, en orden, con el resto: `002_practiques_i_privacitat.sql`, `003_cataleg.sql`, `004_xat.sql`, `005_enduriment.sql` (y los que se añadan después).

> En el proyecto `cuigobpxeyzigialyiwc` ya están aplicadas del 001 al 005.

Se pueden volver a ejecutar sin romper nada si alguno falla a medias.

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

## 4. Direcciones permitidas (hecho)

Ya configurado en el proyecto: Site URL `https://joekss.github.io/yoga-el-bosc/`, redirecciones a esa dirección y a `localhost:5000` / `localhost:5001`, y código de acceso de 6 cifras.

## 5. Correo con código y sin límite de 2 por hora (pendiente: Resend)

En el plan gratuito, Supabase no deja cambiar la plantilla del correo con su servicio por defecto, y solo envía 2 correos por hora. Sin plantilla propia, el correo solo lleva el enlace: en iPhone se abre en Safari y no en la app instalada.

Cuando tengáis el dominio a mano:

1. **resend.com** → crear cuenta → **Domains → Add Domain** → copiar los registros DNS en el proveedor del dominio hasta que salga **Verified**.
2. **Settings → Integrations → Supabase → Connect** → proyecto `joelreintegra@gmail.com's Project`, remitente `hola@<dominio>`, nombre `El Bosc`.
3. Aplicar la plantilla (`supabase/email/acces.html`) y subir el límite a 60 correos/hora:

```bash
SUPABASE_ACCESS_TOKEN=<token> bash scripts/configurar-correu.sh
```

El token se crea en supabase.com → Account → Access Tokens (con permiso de escritura de *Project Admin*). Bórralo al terminar.

## Probar en local sin Supabase

```bash
npm start
```

```bash
npm test
```

Las pruebas (`tests/smoke.spec.js`) usan un Supabase simulado (`tests/fake-supabase.js`), así que no tocan los datos reales.

## Antes de publicar: rellenar la política de privacidad

`privacitat.html` tiene campos marcados en amarillo que hay que completar: nombre de la responsable y correo de contacto (la región ya está: Frankfurt).
