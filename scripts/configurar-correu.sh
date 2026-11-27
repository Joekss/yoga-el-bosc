#!/usr/bin/env bash
# Aplica a Supabase la plantilla del correo d'accés (amb el codi de 6 xifres)
# i puja el límit de correus per hora.
#
# Requisit: Resend (o un altre SMTP) ja connectat al projecte. Sense SMTP propi,
# el pla gratuït de Supabase no deixa canviar les plantilles.
#
# Ús:  SUPABASE_ACCESS_TOKEN=... bash scripts/configurar-correu.sh
#      (a les sessions de Claude el token l'injecta el proxy: posa-hi "proxy-injected")
set -euo pipefail
PROJECT="${SUPABASE_PROJECT:-cuigobpxeyzigialyiwc}"
: "${SUPABASE_ACCESS_TOKEN:?Falta SUPABASE_ACCESS_TOKEN}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

BODY="$(python3 - "$DIR/supabase/email/acces.html" <<'PY'
import json, sys
tpl = open(sys.argv[1]).read()
subject = "El teu accés a El Bosc · Tu acceso a El Bosc"
print(json.dumps({
  "mailer_subjects_magic_link": subject,
  "mailer_subjects_confirmation": subject,
  "mailer_templates_magic_link_content": tpl,
  "mailer_templates_confirmation_content": tpl,
  "mailer_otp_length": 6,
  "rate_limit_email_sent": 60,
}))
PY
)"

curl -sS -m 30 -X PATCH "https://api.supabase.com/v1/projects/$PROJECT/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  --data "$BODY" | python3 -c '
import json, sys
d = json.load(sys.stdin)
if "site_url" not in d:
    print("Error:", d); sys.exit(1)
ok = "{{ .Token }}" in (d.get("mailer_templates_magic_link_content") or "")
print("Plantilla amb codi:", "sí" if ok else "NO")
print("Correus per hora:", d.get("rate_limit_email_sent"))
print("SMTP:", d.get("smtp_host") or "per defecte de Supabase")'
