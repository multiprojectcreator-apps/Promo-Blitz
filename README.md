# 🎟️ Sistema de Rifa Profesional

Un sistema de rifas de clase empresarial, escalable y modular. Cuenta con un diseño responsivo basado en **Material Design 3**, una arquitectura de alto rendimiento con sincronización en tiempo real y soporte nativo para **Supabase** y fall-back de base de datos en memoria.

---

## 🚀 Guía Oficial de Despliegue (GitHub + Vercel)

Esta guía te guiará paso a paso para inicializar tu repositorio en **GitHub**, desplegar el Front-End en **Vercel** de forma optimizada y configurar el servidor persistente para mantener la experiencia de WebSockets y sincronización en tiempo real.

---

### 📦 Paso 1: Preparar y Subir a GitHub

Para subir tu código a un repositorio de GitHub, sigue estos comandos en tu terminal local:

1. **Inicializa el repositorio Git local:**
   ```bash
   git init
   ```

2. **Añade todos los archivos del proyecto:**
   ```bash
   git add .
   ```

3. **Crea el primer commit:**
   ```bash
   git commit -m "feat: inicialización del Sistema de Rifa Profesional"
   ```

4. **Crea un repositorio vacío en GitHub** (público o privado) y copia la URL del repositorio (ej. `https://github.com/tu-usuario/sistema-rifa-profesional.git`).

5. **Asocia el origen remoto y sube a la rama principal (`main`):**
   ```bash
   git branch -M main
   git remote add origin https://github.com/tu-usuario/sistema-rifa-profesional.git
   git push -u origin main
   ```

---

### ⚡ Paso 2: Despliegue en Vercel (Front-End)

Vercel es la plataforma idónea para servir el Front-End estático de alto rendimiento del **Sistema de Rifa Profesional** de manera ultra veloz.

1. **Inicia sesión en Vercel** y haz clic en **"Add New"** > **"Project"**.
2. **Importa tu repositorio de GitHub** recién creado.
3. **Configuración de Proyecto:**
   - **Framework Preset:** `Vite` (Vercel lo detectará automáticamente).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Variables de Entorno (Environment Variables):**
   Agrega las siguientes variables en la sección de configuración de Vercel (si vas a usar integraciones directas o URLs personalizadas):
   - `SUPABASE_URL`: Tu URL de proyecto Supabase.
   - `SUPABASE_KEY`: Tu clave anónima pública de Supabase.
5. Haz clic en **"Deploy"**.

> 🛠️ **Soporte SPA integrado:** El repositorio cuenta con un archivo `vercel.json` pre-configurado en la raíz del proyecto. Este archivo asegura que todas las rutas internas de la SPA de React (como `/comprador`, `/vendedor`, etc.) se enruten correctamente al `index.html` sin generar molestos errores **404 Page Not Found** al recargar la página.

---

### 🔌 Paso 3: Despliegue del Servidor (Express + WebSockets)

El **Sistema de Rifa Profesional** utiliza conexiones persistentes de **WebSockets** (`ws://`) y sincronización de base de datos local en memoria con Supabase para garantizar un rendimiento instantáneo. 

> ⚠️ **Nota sobre Vercel Serverless:** Las funciones Serverless de Vercel son *stateless* (sin estado) y se apagan automáticamente después de unos segundos, por lo que **no son compatibles con conexiones WebSockets persistentes**. 

#### Opción Recomendada: Despliegue en Railway o Render (Back-End Persistente)

Para que el módulo de WebSockets en tiempo real y la sincronización funcionen de forma impecable las 24 horas del día, te sugerimos desplegar el backend en un servicio con soporte de procesos persistentes como **Railway.app** o **Render.com**.

1. **Crear Servicio Web de Node.js:**
   - Importa tu repositorio desde GitHub en **Railway** o **Render**.
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start` (ejecutará el servidor compilado ultra rápido en `dist/server.cjs`).
2. **Configura las Variables de Entorno en tu Dashboard de Railway/Render:**
   ```env
   PORT=3000
   NODE_ENV=production
   GEMINI_API_KEY="tu_clave_de_gemini"
   SUPABASE_URL="tu_url_de_supabase"
   SUPABASE_KEY="tu_clave_de_supabase"
   ```

El servidor detectará la configuración de producción y levantará la API REST y el servidor de WebSockets de manera sincronizada y robusta.

---

### 🗄️ Paso 4: Inicialización de la Base de Datos (Supabase)

Si deseas utilizar almacenamiento en la nube de Supabase en lugar del sistema auto-recuperable en memoria local:

1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. Ve a la sección **SQL Editor** de tu panel de Supabase.
3. Copia y pega el contenido del archivo `/supabase_schema.sql` (disponible en la raíz del proyecto) y haz clic en **Run**. Esto creará automáticamente las tablas optimizadas (`raffles`, `sellers`, `sales`, `audit_logs`, `app_configs`, `announcements`, etc.) con sus índices correspondientes.
4. Vincula tu base de datos configurando las variables de entorno `SUPABASE_URL` y `SUPABASE_KEY` en tu hosting del Front-End (Vercel) y Back-End (Railway/Render).

---

## 🎨 Características de Diseño & Marca

- **Tipografía de Display:** Space Grotesk (moderna, tecnológica e imponente).
- **Tipografía de Cuerpo:** Inter (legibilidad de precisión).
- **Paleta Corporativa:** Slate Slate (Fondo sutil de alta gama) con acentos en Azul Eléctrico y Esmeralda en Material Design 3.
- **Sincronización Bifásica:** El sistema funciona en memoria local de alta disponibilidad y se sincroniza en segundo plano de manera inmutable con la nube corporativa.

---
© 2026 **Sistema de Rifa Profesional, Inc.** Todos los derechos reservados.
