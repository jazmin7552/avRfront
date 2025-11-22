import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Usuario {
  nombre: string;
  rol: string;
}

interface EntityCard {
  id: string;
  title: string;
  badge: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
})
export class DashboardAdminComponent implements OnInit {

  // 👤 Usuario
  usuario: Usuario = {
    nombre: 'Administrador',
    rol: 'Admin Principal'
  };

  userInitial: string = 'A';

  // ✨ Partículas
  particles: Array<{ left: number; top: number; delay: number; duration: number }> = [];

  // 🎯 AQUÍ ESTÁN LAS 9 TARJETAS - ESTO ES LO IMPORTANTE
  entities: EntityCard[] = [
    {
      id: 'categoria',
      title: 'Categorías',
      badge: 'Menú',
      description: 'Organiza y clasifica los productos del menú en categorías específicas',
      icon: 'M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z',
      route: '/categorias', // ✅ CORREGIDO
    },
    {
      id: 'comanda',
      title: 'Comandas',
      badge: 'Pedidos',
      description: 'Gestiona los pedidos activos y el historial de comandas del restaurante',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      route: '/comandas', // ✅ CORREGIDO
    },
    {
      id: 'detalle-comanda',
      title: 'Detalle Comanda',
      badge: 'Detalles',
      description: 'Administra los productos y cantidades específicas de cada pedido',
      icon: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 18v-2h8v2H8zm0-4v-2h8v2H8z',
      route: '/detalle-comanda', // ✅ CORREGIDO
    },
    {
      id: 'estado',
      title: 'Estados',
      badge: 'Control',
      description: 'Define y controla los diferentes estados del flujo de comandas',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      route: '/estados', // ✅ CORREGIDO - ESTE ERA EL PROBLEMA
    },
    {
      id: 'mesa',
      title: 'Mesas',
      badge: 'Espacio',
      description: 'Administra la distribución y disponibilidad de mesas del local',
      icon: 'M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z',
      route: '/mesas', // ✅ CORREGIDO
    },
    {
      id: 'producto',
      title: 'Productos',
      badge: 'Inventario',
      description: 'Gestiona el catálogo completo de platillos y bebidas disponibles',
      icon: 'M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z',
      route: '/productos', // ✅ CORREGIDO
    },
    {
      id: 'rol',
      title: 'Roles',
      badge: 'Seguridad',
      description: 'Define permisos y niveles de acceso para usuarios del sistema',
      icon: 'M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83V6.31l6-2.12 6 2.12v4.78z',
      route: '/roles', // ✅ CORREGIDO
    },
    {
      id: 'telefono',
      title: 'Teléfonos',
      badge: 'Contacto',
      description: 'Administra los números de contacto y comunicación del restaurante',
      icon: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
      route: '/telefonos', // ✅ CORREGIDO
    },
    {
      id: 'usuario',
      title: 'Usuarios',
      badge: 'Personal',
      description: 'Gestiona las cuentas de empleados y administradores del sistema',
      icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      route: '/usuarios', // ✅ CORREGIDO
    },
  ];

  constructor(private router: Router) {
    console.log('🎯 DashboardAdminComponent constructor');
    console.log('📦 Entities:', this.entities.length);
  }

  ngOnInit(): void {
    console.log('🚀 DashboardAdminComponent ngOnInit');
    console.log('📦 Total entities:', this.entities.length);
    this.loadUserData();
    this.generateParticles();
  }

  generateParticles(): void {
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 15,
        duration: Math.random() * 10 + 10,
      });
    }
    console.log('✨ Partículas generadas:', this.particles.length);
  }

  loadUserData(): void {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      try {
        const usuarioTemp = JSON.parse(usuarioStr);
        if (usuarioTemp && usuarioTemp.nombre) {
          this.usuario = {
            nombre: usuarioTemp.nombre,
            rol: usuarioTemp.rol || 'Administrador'
          };
          this.userInitial = this.usuario.nombre.charAt(0).toUpperCase();
        }
      } catch (e) {
        console.error('Error al cargar usuario:', e);
      }
    }
    console.log('👤 Usuario cargado:', this.usuario);
  }

  navigateTo(route: string): void {
    console.log('🔗 Navegando a:', route);
    if (route) {
      this.router.navigate([route]);
    }
  }

  logout(): void {
    const confirmar = confirm('¿Estás seguro que deseas cerrar sesión?');
    if (confirmar) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      this.router.navigate(['/login']);
    }
  }
}
