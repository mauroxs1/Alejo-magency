# Guía de deploy — Alejo (Magency)

## 1. Datos pendientes que necesitás antes de deployar

| Variable | Dónde conseguirla |
|---|---|
| `META_ACCESS_TOKEN` | Meta for Developers > tu App > WhatsApp > Configuración API > System User Token permanente |
| `PHONE_NUMBER_ID` | Meta for Developers > tu App > WhatsApp > Configuración API > Phone Number ID |
| `WABA_ID` | Misma pantalla, WhatsApp Business Account ID |
| `MAURO_PHONE` | Número de Mauro sin + ni espacios (ej: `5492614001234`) |
| `ROBERTO_PHONE` | Número de Roberto (mismo formato) |
| `KIT_LANDING_URL` | URL final de la landing del Kit Live Commerce |

---

## 2. Crear el repo en GitHub

```bash
cd alejo-magency
git init
git add .
git commit -m "feat: alejo magency backend inicial"
# Creá el repo en github.com/new (privado recomendado) y luego:
git remote add origin https://github.com/TU_USUARIO/alejo-magency.git
git push -u origin main
```

---

## 3. Conectar a Vercel

1. Entrá a **vercel.com** → New Project → Import desde GitHub.
2. Seleccionás el repo `alejo-magency`.
3. Framework: **Other** (no es Next.js).
4. Build Command: `npm run build` (o dejarlo vacío, Vercel detecta automáticamente).
5. Output Directory: dejarlo vacío.
6. Click en **Deploy**.

---

## 4. Configurar variables de entorno en Vercel

En el dashboard de tu proyecto en Vercel:
**Settings → Environment Variables**

Agregá estas variables (copialas del `.env.example`):

```
ANTHROPIC_API_KEY          sk-ant-...
META_ACCESS_TOKEN          token permanente de Meta
PHONE_NUMBER_ID            ID del número
WABA_ID                    ID de la cuenta de WhatsApp Business
WEBHOOK_VERIFY_TOKEN       cualquier string que elijas (ej: alejo_magency_2025)
SHEETS_WEBHOOK_URL         https://script.google.com/macros/s/...exec
MAURO_PHONE                54926XXXXXXXX
ROBERTO_PHONE              54926XXXXXXXX
KIT_LANDING_URL            https://...
```

Después de agregar las variables, **redeploy** el proyecto.

---

## 5. Configurar el webhook en Meta for Developers

1. Entrá a **developers.facebook.com** → tu App Magency → WhatsApp → Configuración.
2. En "Webhook", hacé click en **Editar**.
3. URL de callback: `https://TU-PROYECTO.vercel.app/api/webhook`
4. Token de verificación: el mismo valor que pusiste en `WEBHOOK_VERIFY_TOKEN`.
5. Click en **Verificar y guardar**.
6. En la sección de campos, suscribite al campo **messages**.

---

## 6. Probar que funciona

Mandá un mensaje de WhatsApp al número de Magency. Deberías recibir la respuesta de Alejo.

Para ver los logs: **Vercel Dashboard → tu proyecto → Deployments → Functions → webhook**.

---

## 7. Notas técnicas

- El historial de conversación se guarda en memoria del servidor. Con Vercel serverless esto funciona bien para volumen normal; si querés persistencia total entre reinicios del servidor, se puede agregar Redis (Upstash, que tiene free tier en Vercel).
- La deduplicación de mensajes también es en memoria; igual funciona en producción con el volumen de un WhatsApp Business.
