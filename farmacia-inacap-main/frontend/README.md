# Frontend - Sistema de Farmacia Privada Comercial INACAP

Aplicación SPA responsiva construida con React 19, TypeScript, Vite y React Router v7 conectada al backend transaccional de Farmacia INACAP.

---

## 1. Configuración de Entorno (`VITE_API_URL`)

Crea un archivo `.env` o `.env.local` en el directorio `frontend/`:

```env
VITE_API_URL=http://localhost:3000/api
```

Para iniciar el servidor de desarrollo en `http://localhost:5173`:

```powershell
npm install
npm run dev
```

---

## 2. Estructura de Rutas y Permisos (`AuthContext`)

- **Autenticación y Sesión (`src/context/AuthContext.tsx`)**:
  - Administra el ciclo de vida del token de acceso JWT y la renovación transparente mediante `refreshToken` en interceptores de Axios (`src/lib/api.ts`).
- **Control de Acceso Basado en Roles (`src/lib/access.ts` y `src/components/auth/ProtectedRoute.tsx`)**:
  - Filtra tanto las rutas de navegación en el `Sidebar` como el acceso directo a las páginas según los permisos asignados al usuario autenticado (`sales.create`, `inventory.read`, `prescriptions.read`, `settings.update`, etc.).

---

## 3. Flujo de Trabajo en POS e Inventario

- **Punto de Venta (`PosPage` y `src/components/pos/`)**:
  - Búsqueda de catálogo y selección de lotes disponibles ordenados por vencimiento (**FEFO**).
  - Cálculo en tiempo real de subtotales, descuentos manuales o por convenios de salud (`Agreement`) y validación de recetas médicas en productos controlados.
  - Emisión de venta con múltiples medios de pago (efectivo, débito, crédito, transferencia) y generación de documento tributario (DTE).
- **Gestión de Inventario y Compras (`InventoryPage`, `PurchasesPage` y `src/components/inventory/`)**:
  - Monitoreo de existencias por ubicación, estados de lote y alertas tempranas de vencimiento o stock crítico.
  - Creación de órdenes de compra a proveedores y recepción de mercadería con incorporación inmediata de lotes.
- **Gestión Clínica y Caja (`src/components/clinical/` y `src/components/cash/`)**:
  - Registro de recetas médicas vinculadas a pacientes y facultativos, libro de trazabilidad de psicotrópicos/estupefacientes y panel de apertura/cierre y movimientos de caja.

---

## 4. Despliegue en Producción (`vercel.json`)

El proyecto incluye configuración de reescritura SPA en `frontend/vercel.json` para que todas las rutas sean manejadas por `index.html`:

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Variable de Entorno Requerida**:
  - `VITE_API_URL=https://TU-BACKEND-RAILWAY.up.railway.app/api`
