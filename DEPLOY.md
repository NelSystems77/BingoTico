# 🚀 GUÍA DE DESPLIEGUE - BingoTico PWA

## 📋 PRE-REQUISITOS

- [x] Node.js 18+ instalado
- [x] Cuenta de Firebase (gratis)
- [x] Cuenta de Vercel/Netlify (gratis) - opcional

---

## 🔧 PASO 1: CONFIGURAR FIREBASE

### 1.1 Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto"
3. Nombre: `bingotico-pwa` (o el que prefieras)
4. Desactiva Google Analytics (opcional)
5. Click en "Crear proyecto"

### 1.2 Habilitar Firestore

1. En el menú lateral, click en "Firestore Database"
2. Click en "Crear base de datos"
3. Selecciona "Modo de producción"
4. Selecciona ubicación: `us-central1` (o la más cercana)
5. Click en "Habilitar"

### 1.3 Configurar Reglas de Seguridad

En la pestaña "Reglas" de Firestore, pega:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Eventos: lectura pública, escritura autenticada (o pública si no hay auth)
    match /eventos/{eventoId} {
      allow read: if true;
      allow write: if true; // Cambiar a autenticación si implementas Auth
    }
    
    // Partidas: lectura/escritura pública
    match /partidas/{partidaId} {
      allow read, write: if true;
    }
    
    // Cartones: lectura/escritura pública
    match /cartones/{cartonId} {
      allow read, write: if true;
    }
  }
}
```

Click en "Publicar"

### 1.4 Obtener Credenciales

1. Click en el ícono de engranaje ⚙️ → "Configuración del proyecto"
2. Scroll down hasta "Tus apps"
3. Click en el ícono de Web `</>`
4. Nombre de la app: `BingoTico Web`
5. **NO** marcar "Firebase Hosting"
6. Click en "Registrar app"
7. Copia las credenciales que aparecen:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 📁 PASO 2: CONFIGURAR PROYECTO LOCAL

### 2.1 Descomprimir ZIP

```bash
# Windows (PowerShell)
Expand-Archive -Path BingoTico-PWA-v1.0.0.zip -DestinationPath C:\Proyectos\bingotico

# macOS/Linux
unzip BingoTico-PWA-v1.0.0.zip -d ~/proyectos/bingotico
cd ~/proyectos/bingotico
```

### 2.2 Instalar Dependencias

```bash
npm install
```

### 2.3 Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales de Firebase
nano .env  # o usar cualquier editor
```

Pega tus credenciales en `.env`:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 2.4 Probar en Desarrollo

```bash
npm run dev
```

Abre http://localhost:5173 y prueba:
1. Seleccionar Bingo 90
2. Crear evento
3. Generar 1 cartón
4. Verificar que se guarda en Firebase (ve a Firebase Console → Firestore)

---

## 🌐 PASO 3: DESPLEGAR A PRODUCCIÓN

### Opción A: Vercel (Recomendado)

#### 3.1 Instalar Vercel CLI

```bash
npm install -g vercel
```

#### 3.2 Login

```bash
vercel login
```

#### 3.3 Deploy

```bash
# Desde la raíz del proyecto
vercel

# Responde las preguntas:
# ? Set up and deploy? [Y/n] Y
# ? Which scope? Tu cuenta
# ? Link to existing project? [y/N] N
# ? What's your project's name? bingotico-pwa
# ? In which directory is your code located? ./
# ? Want to modify these settings? [y/N] N
```

#### 3.4 Configurar Variables de Entorno en Vercel

```bash
# Opción 1: Via CLI
vercel env add VITE_FIREBASE_API_KEY
# Pega el valor cuando te lo pida
# Selecciona: Production, Preview, Development (todas)

# Repite para cada variable:
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
```

**Opción 2: Via Dashboard**

1. Ve a https://vercel.com/dashboard
2. Click en tu proyecto
3. Settings → Environment Variables
4. Agrega cada variable

#### 3.5 Deploy Final

```bash
vercel --prod
```

Tu app estará en: `https://bingotico-pwa.vercel.app`

---

### Opción B: Netlify

#### 3.1 Build Local

```bash
npm run build
```

#### 3.2 Instalar Netlify CLI

```bash
npm install -g netlify-cli
```

#### 3.3 Login y Deploy

```bash
netlify login
netlify deploy --prod

# Responde:
# ? Publish directory: dist
```

#### 3.4 Configurar Variables de Entorno

1. Ve a https://app.netlify.com
2. Click en tu sitio
3. Site settings → Build & deploy → Environment
4. Agrega cada variable `VITE_FIREBASE_*`

#### 3.5 Re-deploy

```bash
netlify deploy --prod
```

---

### Opción C: Firebase Hosting

#### 3.1 Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

#### 3.2 Login

```bash
firebase login
```

#### 3.3 Inicializar Hosting

```bash
firebase init hosting

# Selecciona:
# ? Use an existing project
# ? What do you want to use as your public directory? dist
# ? Configure as a single-page app? Yes
# ? Set up automatic builds? No
```

#### 3.4 Build y Deploy

```bash
npm run build
firebase deploy --only hosting
```

Tu app estará en: `https://tu-proyecto.web.app`

---

## ✅ PASO 4: VERIFICAR DESPLIEGUE

### 4.1 Tests Post-Deploy

1. Abre la URL de producción
2. Selecciona "Bingo 90"
3. Click en "Comenzar"
4. Crea un evento: "Test Producción"
5. Genera 2 cartones
6. Descarga PDF
7. Verifica que los cartones tienen:
   - Header con "BINGOTICO"
   - Código único (8 caracteres)
   - Números en formato 3×9
   - QR code
8. Comparte el enlace (cópialo)
9. Abre el enlace en otra pestaña
10. Verifica que carga el evento
11. Genera otro cartón desde el enlace compartido
12. Ve a Firebase Console → Firestore
13. Verifica que existen:
    - 1 evento en `eventos/`
    - 3 cartones en `cartones/`

### 4.2 Test de Juego

1. Desde Home, click en "Comenzar"
2. Crear evento "Test Juego"
3. En lugar de generar cartones, ve a `/juego` (agrega `/juego` a la URL)
4. Presiona "INICIAR"
5. Verifica:
   - Extracción automática funciona
   - Síntesis de voz funciona
   - Tablero se actualiza
   - Barra de progreso avanza
6. Presiona "PAUSAR"
7. Verifica que se detiene
8. Presiona "CONTINUAR"
9. Verifica que retoma

---

## 🔒 PASO 5: SEGURIDAD (Post-Deploy)

### 5.1 Proteger Firebase (Opcional)

Si solo quieres que la app pueda escribir en Firebase:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.headers.origin.matches('https://tu-dominio.vercel.app');
    }
  }
}
```

### 5.2 Dominio Personalizado (Opcional)

**En Vercel:**
1. Settings → Domains
2. Agrega tu dominio
3. Configura DNS según instrucciones

**En Netlify:**
1. Domain settings → Add custom domain
2. Configura DNS

---

## 📊 PASO 6: MONITOREO (Opcional)

### 6.1 Firebase Analytics

1. En Firebase Console → Analytics
2. Click en "Empezar"
3. Sigue el wizard
4. En tu código, agrega:

```typescript
// src/services/firebase.ts
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics(app);

// Usar en eventos:
logEvent(analytics, 'carton_generado', { tipo: 'bingo90' });
```

### 6.2 Vercel Analytics

1. En Vercel Dashboard → Analytics
2. Enable Analytics
3. Ya funciona automáticamente

---

## 🐛 TROUBLESHOOTING

### Error: "Firebase not initialized"
**Solución:** Verifica que las variables `VITE_FIREBASE_*` estén configuradas correctamente

### Error: "Permission denied" en Firestore
**Solución:** Revisa las reglas de seguridad en Firestore

### Error: "Voz no funciona"
**Solución:** Safari requiere HTTPS. Verifica que estés en producción (https://)

### PDF no se genera
**Solución:** Verifica que jsPDF esté instalado: `npm list jspdf`

### Cartones duplicados
**Solución:** Esto NO debería pasar. Verifica que estés usando CartonGenerator correctamente

---

## 📝 CHECKLIST FINAL

- [ ] Firebase proyecto creado
- [ ] Firestore habilitado
- [ ] Reglas de seguridad publicadas
- [ ] Variables de entorno configuradas
- [ ] Proyecto funciona en local (`npm run dev`)
- [ ] Build exitoso (`npm run build`)
- [ ] Desplegado en Vercel/Netlify/Firebase Hosting
- [ ] Variables de entorno configuradas en hosting
- [ ] URL de producción accesible
- [ ] Test: Crear evento funciona
- [ ] Test: Generar cartones funciona
- [ ] Test: PDF se descarga
- [ ] Test: Compartir enlace funciona
- [ ] Test: Juego funciona (cantado + tablero)
- [ ] Firestore tiene datos (eventos, cartones)
- [ ] SSL activo (https://)

---

## 🎉 ¡LISTO!

Tu app BingoTico PWA está en producción y lista para usar.

**URL de producción:** `https://tu-dominio.vercel.app`

**Próximos pasos:**
1. Compartir con jugadores
2. Generar cartones para eventos
3. Jugar Bingo

---

**Soporte:**  
Si algo falla, revisa:
1. Console del navegador (F12)
2. Firebase Console → Firestore (datos)
3. Vercel/Netlify logs

**¡Pura Vida! 🇨🇷**
