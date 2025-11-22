import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },

  // ========================================
  // 🎯 RUTAS ADMIN
  // ========================================
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard-admin/dashboard-admin.component').then(
        (m) => m.DashboardAdminComponent
      ),
  },
  {
    path: 'dashboard-admin',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./components/crear-categoria/crear-categoria.component').then(
        (m) => m.CrearCategoriaComponent
      ),
  },
  {
    path: 'estados',
    loadComponent: () =>
      import('./components/estados/estados.component').then((m) => m.EstadosComponent),
  },
  {
    path: 'telefonos',
    loadComponent: () =>
      import('./components/telefonos/telefonos.component').then((m) => m.TelefonosComponent),
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./components/productos/productos.component').then((m) => m.CrearProductoComponent),
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./components/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
  },
  {
    path: 'roles',
    loadComponent: () => import('./components/roles/roles.component').then((m) => m.RolesComponent),
  },
  {
    path: 'detalle-comanda',
    loadComponent: () =>
      import('./components/detalle-comanda/detalle-comanda.component').then(
        (m) => m.DetalleComandaComponent
      ),
  },
  {
    path: 'mesas',
    loadComponent: () => import('./components/mesas/mesa.component').then((m) => m.MesaComponent),
  },
  {
    path: 'comandas',
    loadComponent: () =>
      import('./components/comandas/comanda.component').then((m) => m.ComandaComponent),
  },

  // ========================================
  // 🍽️ RUTAS MESERO
  // ========================================
  {
    path: 'mesero/dashboard',
    loadComponent: () =>
      import('./components/mesero/dashboard-mesero/dashboard-mesero.component').then(
        (m) => m.DashboardMeseroComponent
      ),
  },
  {
    path: 'mesero/tomar-comanda',
    loadComponent: () =>
      import('./components/mesero/tomar-comanda/tomar-comanda.component').then(
        (m) => m.TomarComandaComponent
      ),
  },
  {
    path: 'mesero/tomar-comanda/:idMesa',
    loadComponent: () =>
      import('./components/mesero/tomar-comanda/tomar-comanda.component').then(
        (m) => m.TomarComandaComponent
      ),
  },
  {
    path: 'mesero/comandas-activas',
    loadComponent: () =>
      import('./components/mesero/comandas-activas/comandas-activas.component').then(
        (m) => m.ComandasActivasComponent
      ),
  },
  {
    path: 'mesero/ver-cuenta/:idMesa',
    loadComponent: () =>
      import('./components/mesero/ver-cuenta/ver-cuenta.component').then(
        (m) => m.VerCuentaComponent
      ),
  },

  // ========================================
  // 👨‍🍳 RUTAS COCINERO
  // ========================================
  {
    path: 'cocinero/dashboard',
    loadComponent: () =>
      import('./components/cocinero/dashboard-cocinero/dashboard-cocinero.component').then(
        (m) => m.DashboardCocineroComponent
      ),
  },
  {
    path: 'cocinero/comandas-pendientes',
    loadComponent: () =>
      import('./components/cocinero/comandas-pendientes/comandas-pendientes.component').then(
        (m) => m.ComandasPendientesComponent
      ),
  },
  {
    path: 'cocinero/detalle-comanda/:id',
    loadComponent: () =>
      import('./components/cocinero/detalle-comanda/detalle-comanda.component').then(
        (m) => m.DetalleComandaComponent
      ),
  },

  // Redirección por defecto
  { path: '**', redirectTo: '/login' },
];
