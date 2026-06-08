# PagaloSeguro

PagaloSeguro es un laboratorio de integración de pagos desarrollado para practicar el flujo completo de una pasarela de pago usando una arquitectura web moderna. El proyecto permite crear órdenes de pago, redirigir al usuario a Mercado Pago Checkout Pro en modo sandbox, recibir eventos mediante webhooks, actualizar el estado de las órdenes y monitorear la operación desde un panel administrativo.

El objetivo principal del proyecto no es construir un ecommerce completo, sino aprender y validar los procesos técnicos asociados a una integración de pagos segura, incluyendo separación entre frontend y backend, manejo de variables sensibles, Edge Functions, roles, RLS, auditoría y despliegue en producción.

## Tecnologías utilizadas

* React
* Vite
* Supabase Auth
* Supabase PostgreSQL
* Supabase Row Level Security
* Supabase Edge Functions
* Mercado Pago Checkout Pro Sandbox
* Vercel
* GitHub

## Funcionalidades principales

### Autenticación

* Registro de usuarios.
* Inicio de sesión.
* Cierre de sesión.
* Rutas protegidas para usuarios autenticados.
* Separación entre usuario normal y administrador mediante roles.

### Productos demo

* Listado de productos o servicios de prueba.
* Visualización de productos activos.
* Uso de productos demo para generar órdenes de pago.
* El monto de pago se obtiene desde la base de datos, no desde el frontend.

### Órdenes de pago

* Creación de órdenes con estado inicial `pending`.
* Asociación de cada orden a un usuario autenticado.
* Asociación de cada orden a un producto.
* Registro del monto, moneda, proveedor y estado.
* Almacenamiento del `provider_preference_id` generado por Mercado Pago.
* Almacenamiento del `provider_payment_id` cuando el pago es confirmado.
* Visualización de órdenes propias por usuario.
* Visualización del detalle de una orden.
* Separación entre vista de cliente y vista administrativa.

### Integración con Mercado Pago

* Creación de preferencias de pago mediante Edge Function.
* Redirección al checkout externo de Mercado Pago.
* Configuración de URLs de retorno:

  * Pago exitoso.
  * Pago fallido.
  * Pago pendiente.
* Uso de Mercado Pago Checkout Pro en modo sandbox.
* Configuración de webhook público para recibir eventos de pago.
* Consulta del pago real en Mercado Pago antes de actualizar una orden.

### Webhooks

* Recepción de eventos enviados por Mercado Pago.
* Registro de eventos en la tabla `payment_events`.
* Procesamiento de eventos tipo `payment`.
* Registro informativo de eventos `merchant_order`.
* Manejo de eventos duplicados o repetidos.
* Manejo de errores sin perder el payload recibido.
* Actualización automática de órdenes cuando el pago es confirmado.
* Soporte para modo sandbox mediante `SKIP_MP_SIGNATURE_VALIDATION`.

### Panel de administración

Disponible solo para usuarios con rol `admin`.

Incluye:

* Visualización global de órdenes.
* Visualización del detalle administrativo de cualquier orden.
* Visualización de eventos de pago recibidos.
* Visualización de logs de auditoría.
* Sincronización manual de pagos cuando una orden ya tiene `provider_payment_id`.
* Monitoreo de pagos aprobados, pendientes, rechazados o con error.

### Auditoría

El sistema registra acciones importantes en la tabla `audit_logs`, como:

* Creación de checkout.
* Confirmación de pago aprobado.
* Sincronización manual de pago.
* Cambios relevantes asociados al flujo de pago.

## Roles

El sistema maneja dos roles principales:

### `user`

Usuario normal del sistema.

Puede:

* Ver productos activos.
* Crear órdenes de pago.
* Ver sus propias órdenes.
* Ver el detalle de sus propias órdenes.
* Continuar el checkout si una orden sigue pendiente.

No puede:

* Ver órdenes de otros usuarios.
* Ver eventos de pago.
* Ver logs de auditoría.
* Acceder al panel administrativo.
* Modificar manualmente estados de pago.

### `admin`

Administrador del sistema.

Puede:

* Ver todas las órdenes.
* Ver eventos de pago.
* Ver logs de auditoría.
* Ver detalle administrativo de órdenes.
* Ejecutar sincronización manual de pagos.
* Acceder a rutas administrativas protegidas.

## Estados de una orden

Las órdenes pueden tener los siguientes estados:

* `pending`: la orden fue creada y el pago aún no está confirmado.
* `approved`: Mercado Pago confirmó el pago.
* `rejected`: el pago fue rechazado.
* `cancelled`: el pago fue cancelado.
* `expired`: el intento de pago expiró.
* `refunded`: el pago fue reembolsado.
* `error`: ocurrió un error técnico durante el flujo.

## Estructura del proyecto

```txt
pagalo-seguro-app/
  src/
    components/
      auth/
        AdminRoute.jsx
        ProtectedRoute.jsx
      layout/
        AppLayout.jsx
        Navbar.jsx
        Sidebar.jsx

    context/
      AuthContext.jsx

    lib/
      supabaseClient.js

    pages/
      admin/
        AdminEvents.jsx
        AdminLogs.jsx
        AdminOrderDetail.jsx
        AdminOrders.jsx
      Dashboard.jsx
      Login.jsx
      NotFound.jsx
      OrderDetail.jsx
      Orders.jsx
      PaymentFailure.jsx
      PaymentPending.jsx
      PaymentSuccess.jsx
      Products.jsx
      Register.jsx

    router/
      AppRouter.jsx

    services/
      adminService.js
      ordersService.js
      productsService.js

    styles/
      global.css

    main.jsx

  supabase/
    config.toml
    functions/
      create-checkout/
        index.ts
      payment-webhook/
        index.ts
      sync-payment-status/
        index.ts

  vercel.json
  vite.config.js
  package.json
  .env.example
```

## Base de datos principal

El sistema utiliza las siguientes tablas en Supabase.

### `profiles`

Guarda información extendida de los usuarios registrados.

Campos principales:

* `id`
* `full_name`
* `role`
* `created_at`
* `updated_at`

### `products`

Guarda productos o servicios demo que pueden ser pagados mediante Mercado Pago.

Campos principales:

* `id`
* `name`
* `description`
* `price`
* `currency`
* `is_active`
* `created_at`
* `updated_at`

### `orders`

Guarda las órdenes de pago generadas por los usuarios.

Campos principales:

* `id`
* `user_id`
* `product_id`
* `amount`
* `currency`
* `status`
* `provider`
* `provider_preference_id`
* `provider_payment_id`
* `checkout_url`
* `created_at`
* `updated_at`

### `payment_events`

Guarda los eventos recibidos desde Mercado Pago.

Campos principales:

* `id`
* `order_id`
* `provider`
* `event_type`
* `provider_event_id`
* `raw_payload`
* `processed`
* `error_message`
* `created_at`

### `audit_logs`

Guarda acciones importantes del sistema.

Campos principales:

* `id`
* `user_id`
* `action`
* `entity_type`
* `entity_id`
* `metadata`
* `created_at`

## Edge Functions

### `create-checkout`

Función encargada de crear una orden y generar una preferencia de pago en Mercado Pago.

Responsabilidades:

* Validar usuario autenticado.
* Recibir `product_id`.
* Consultar el producto activo desde la base de datos.
* Crear una orden con estado `pending`.
* Crear una preferencia de pago en Mercado Pago.
* Guardar `provider_preference_id`.
* Guardar `checkout_url`.
* Registrar auditoría con `checkout_created`.

### `payment-webhook`

Función encargada de recibir eventos de Mercado Pago.

Responsabilidades:

* Recibir notificaciones de pago.
* Registrar eventos en `payment_events`.
* Clasificar eventos `payment`, `merchant_order`, IPN o desconocidos.
* Consultar el pago real en Mercado Pago.
* Usar `external_reference` para asociar el pago a una orden.
* Actualizar el estado de la orden.
* Guardar `provider_payment_id`.
* Registrar auditoría con acciones como `payment_approved`.

### `sync-payment-status`

Función administrativa para sincronizar manualmente una orden con Mercado Pago.

Responsabilidades:

* Validar usuario autenticado.
* Validar que el usuario tenga rol `admin`.
* Recibir `order_id`.
* Consultar el pago en Mercado Pago usando `provider_payment_id`.
* Actualizar el estado de la orden.
* Registrar auditoría con `manual_sync_executed`.

## Seguridad

El proyecto aplica una separación clara entre frontend, backend y base de datos.

### Reglas generales

* El frontend no define el monto final del pago.
* El frontend no puede marcar una orden como aprobada.
* El frontend no maneja tokens privados de Mercado Pago.
* El `MERCADOPAGO_ACCESS_TOKEN` solo se usa en Supabase Edge Functions.
* El estado de una orden se actualiza únicamente desde backend.
* El webhook consulta Mercado Pago antes de actualizar una orden.
* El panel admin está protegido por frontend y backend.
* Las tablas sensibles están protegidas con Row Level Security.

### Row Level Security

El proyecto utiliza RLS en Supabase.

Reglas generales:

* Los usuarios solo pueden ver sus propios perfiles.
* Los usuarios pueden ver productos activos.
* Los usuarios solo pueden ver sus propias órdenes.
* Los usuarios normales no pueden ver eventos de pago.
* Los usuarios normales no pueden ver logs de auditoría.
* Los administradores pueden ver todas las órdenes.
* Los administradores pueden ver eventos de pago.
* Los administradores pueden ver logs de auditoría.
* Las actualizaciones sensibles se realizan desde Edge Functions con `service_role`.

## Variables de entorno

### Frontend

Crear un archivo `.env.local` tomando como base `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_NAME=PagaloSeguro
```

Estas variables también deben configurarse en Vercel.

### Supabase Edge Functions

Configurar los secrets mediante Supabase CLI:

```bash
supabase secrets set APP_URL="https://tu-dominio.vercel.app"
supabase secrets set MERCADOPAGO_ACCESS_TOKEN="tu_access_token"
supabase secrets set MERCADOPAGO_WEBHOOK_URL="https://tu-proyecto.supabase.co/functions/v1/payment-webhook"
supabase secrets set MERCADOPAGO_WEBHOOK_SECRET="tu_webhook_secret"
supabase secrets set SKIP_MP_SIGNATURE_VALIDATION="true"
```

Para ambiente sandbox se usa:

```env
SKIP_MP_SIGNATURE_VALIDATION=true
```

Para producción real debe usarse:

```env
SKIP_MP_SIGNATURE_VALIDATION=false
```

## Nota sobre la firma del webhook

La validación estricta de firma de Mercado Pago fue implementada y probada, pero en el ambiente sandbox utilizado durante el desarrollo la firma calculada no coincidía con `v1`, aun recibiendo `data.id`, `ts` y `x-request-id`.

Por este motivo, para el entorno de práctica se mantiene:

```env
SKIP_MP_SIGNATURE_VALIDATION=true
```

Aun con esta configuración, el sistema no actualiza órdenes confiando únicamente en el payload del webhook. Antes de modificar una orden, la Edge Function consulta directamente el pago real en Mercado Pago usando el `payment_id`.

Antes de usar este proyecto con pagos reales, se debe resolver la validación estricta de firma y configurar:

```env
SKIP_MP_SIGNATURE_VALIDATION=false
```

## Instalación

Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd pagalo-seguro-app
```

Instalar dependencias:

```bash
npm install
```

Crear archivo de entorno local:

```bash
cp .env.example .env.local
```

Configurar las variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_NAME=PagaloSeguro
```

Ejecutar en desarrollo:

```bash
npm run dev
```

## Scripts disponibles

```bash
npm run dev
```

Ejecuta el proyecto en modo desarrollo.

```bash
npm run build
```

Genera la versión de producción.

```bash
npm run preview
```

Permite previsualizar la versión generada.

```bash
npm run lint
```

Ejecuta la revisión de código con ESLint.

## Configuración en Supabase

Para que el proyecto funcione correctamente, se debe configurar:

* Supabase Auth.
* Tablas principales.
* Triggers para creación automática de perfiles.
* Row Level Security.
* Policies por rol.
* Edge Functions.
* Secrets de Supabase.
* URL pública del webhook.
* Roles de usuario en la tabla `profiles`.

## Configuración en Mercado Pago

Para ambiente sandbox:

1. Crear una aplicación en Mercado Pago Developers.
2. Obtener credenciales de prueba.
3. Configurar el Access Token de prueba en Supabase secrets.
4. Configurar el webhook de prueba.
5. Seleccionar el evento `Pagos`.
6. Usar cuentas de prueba para comprador y vendedor.
7. Usar tarjetas de prueba para validar pagos.

Webhook recomendado:

```txt
https://tu-proyecto.supabase.co/functions/v1/payment-webhook
```

## Despliegue

### Frontend en Vercel

Pasos generales:

1. Subir el proyecto a GitHub.
2. Importar el repositorio en Vercel.
3. Configurar el framework como Vite.
4. Configurar variables de entorno:

   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
   * `VITE_APP_NAME`
5. Ejecutar despliegue.

### Edge Functions en Supabase

Vincular el proyecto:

```bash
supabase link --project-ref <project-ref>
```

Desplegar funciones:

```bash
supabase functions deploy create-checkout
supabase functions deploy payment-webhook
supabase functions deploy sync-payment-status
```

## Estado del proyecto

El proyecto se encuentra en versión MVP funcional.

Incluye:

* Autenticación.
* Productos demo.
* Creación de órdenes.
* Checkout con Mercado Pago Sandbox.
* Webhook de pagos.
* Actualización automática de órdenes.
* Panel administrativo.
* Eventos de pago.
* Logs de auditoría.
* Sincronización manual.
* RLS fuerte.
* Separación de variables públicas y privadas.
* Despliegue en Vercel y Supabase.

## Limitaciones conocidas

* La integración está configurada para Mercado Pago Sandbox.
* La validación estricta de firma del webhook queda pendiente para producción real.
* No genera boleta o comprobante.
* No implementa reembolsos desde el panel.
* No implementa gestión CRUD de productos desde el panel admin.
* No implementa Checkout Bricks ni Checkout API personalizado.
* No implementa Stripe como proveedor alternativo.

## Próximas mejoras

Posibles mejoras futuras:

* Resolver validación estricta de firma de Mercado Pago.
* Implementar comprobante o boleta de pago.
* Implementar gestión administrativa de productos.
* Implementar reembolsos.
* Implementar Checkout Bricks para una experiencia más personalizada.
* Implementar Checkout API para mayor control del flujo.
* Agregar Stripe como proveedor alternativo.
* Implementar arquitectura multi-provider.
* Agregar métricas de conversión de pagos.
* Mejorar visualización del panel administrativo.
* Agregar filtros avanzados en órdenes, eventos y logs.
* Agregar exportación CSV de órdenes y eventos.

## Autor

Desarrollado por Axel Pariona como proyecto de integración de pagos, seguridad, webhooks y Mercado Pago.
