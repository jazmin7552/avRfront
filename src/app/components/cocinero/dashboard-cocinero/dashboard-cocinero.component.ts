import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ComandaService } from '../../../services/comanda.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard-cocinero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-cocinero.component.html',
  styleUrls: ['./dashboard-cocinero.component.css'],
})
export class DashboardCocineroComponent implements OnInit {
  comandasPendientes: any[] = [];
  comandasEnPreparacion: any[] = [];
  cocineroNombre: string = '';
  cocineroId: string = '';
  loading: boolean = true;

  estadisticas = {
    comandasPendientes: 0,
    comandasEnPreparacion: 0,
    comandasCompletadas: 0,
    totalPreparando: 0,
  };

  constructor(
    private comandaService: ComandaService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerDatosCocinero();
    this.cargarDatos();
  }

  obtenerDatosCocinero(): void {
    const usuario = this.authService.getUsuario();

    if (!usuario) {
      console.error('⚠️ No se encontró usuario autenticado');
      alert('Error: No se pudo identificar al cocinero. Por favor, inicia sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }

    this.cocineroNombre = usuario.nombre || 'Cocinero';
    this.cocineroId = (usuario.idUsuario ?? '').toString();

    console.log('👨‍🍳 Datos del cocinero cargados:', {
      nombre: this.cocineroNombre,
      id: this.cocineroId,
    });

    if (!this.cocineroId) {
      console.error('⚠️ El usuario NO tiene ID');
      alert('Error: No se pudo obtener el ID del cocinero.');
    }
  }

  cargarDatos(): void {
    this.loading = true;

    // 🔹 Comandas pendientes
    this.comandaService.obtenerComandasPendientes().subscribe({
      next: (pendientes: any[]) => {
        this.comandasPendientes = pendientes;
        this.estadisticas.comandasPendientes = pendientes.length;
        console.log('✅ Comandas pendientes cargadas:', this.comandasPendientes);
      },
      error: (err) => {
        console.error('❌ Error al cargar comandas pendientes:', err);
        this.loading = false;
      },
    });

    // 🔹 Comandas en preparación
    this.comandaService.obtenerComandasEnPreparacion().subscribe({
      next: (preparacion: any[]) => {
        this.comandasEnPreparacion = preparacion;
        this.estadisticas.comandasEnPreparacion = preparacion.length;
        this.calcularEstadisticas();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar comandas en preparación:', err);
        this.loading = false;
      },
    });
  }

  calcularEstadisticas(): void {
    // Comandas completadas hoy (asumiendo que LISTA significa completada para cocinero)
    this.estadisticas.comandasCompletadas = this.comandasEnPreparacion.filter(
      (c) => c.estadoNombre === 'LISTA'
    ).length;

    // Total de productos siendo preparados
    this.estadisticas.totalPreparando = this.comandasEnPreparacion.reduce(
      (total, comanda) => total + (comanda.detalles?.length || 0),
      0
    );
  }

  // ===================== NAVEGACIÓN =====================

  verComandasPendientes(): void {
    this.router.navigate(['/cocinero/comandas-pendientes']);
  }

  verComandasEnPreparacion(): void {
    this.router.navigate(['/cocinero/comandas-pendientes'], {
      queryParams: { filtro: 'EN_PREPARACION' }
    });
  }

  verDetalleComanda(comandaId: number): void {
    if (comandaId) {
      this.router.navigate(['/cocinero/detalle-comanda', comandaId]);
    }
  }

  // ===================== ACCIONES RÁPIDAS =====================

  iniciarPreparacion(comanda: any): void {
    if (!this.cocineroId) {
      alert('Error: No se pudo identificar al cocinero');
      return;
    }

    if (confirm(`¿Iniciar preparación de la comanda #${comanda.comandaId}?`)) {
      // Primero asignar cocinero
      this.comandaService.asignarCocinero(comanda.comandaId, this.cocineroId).subscribe({
        next: () => {
          // Luego cambiar estado a EN_PREPARACION (estado 2)
          this.comandaService.cambiarEstadoComanda(comanda.comandaId, 2).subscribe({
            next: () => {
              alert(`✅ Comanda #${comanda.comandaId} en preparación`);
              this.cargarDatos(); // Recargar datos
            },
            error: (err) => {
              console.error('❌ Error al cambiar estado:', err);
              alert('❌ Error al iniciar preparación');
            },
          });
        },
        error: (err) => {
          console.error('❌ Error al asignar cocinero:', err);
          alert('❌ Error al asignar cocinero');
        },
      });
    }
  }

  marcarComoLista(comanda: any): void {
    if (confirm(`¿Marcar como lista la comanda #${comanda.comandaId}?`)) {
      this.comandaService.cambiarEstadoComanda(comanda.comandaId, 3).subscribe({
        next: () => {
          alert(`✅ Comanda #${comanda.comandaId} marcada como lista`);
          this.cargarDatos();
        },
        error: (err) => {
          console.error('❌ Error al marcar como lista:', err);
          alert('❌ Error al actualizar estado');
        },
      });
    }
  }

  // ===================== ESTILO / COLORES =====================

  getEstadoClase(estado: string): string {
    const clases: any = {
      PENDIENTE: 'estado-pendiente',
      EN_PREPARACION: 'estado-preparacion',
      LISTA: 'estado-lista',
    };
    return clases[estado] || '';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      PENDIENTE: 'Pendiente',
      EN_PREPARACION: 'En Preparación',
      LISTA: 'Lista',
    };
    return textos[estado] || estado;
  }

  getEstadoIcono(estado: string): string {
    const iconos: any = {
      PENDIENTE: '⏳',
      EN_PREPARACION: '👨‍🍳',
      LISTA: '✅',
    };
    return iconos[estado] || '📋';
  }

  calcularTotalComanda(comanda: any): number {
    if (comanda.detalles && Array.isArray(comanda.detalles)) {
      return comanda.detalles.reduce((sum: number, detalle: any) => sum + (detalle.subtotal || 0), 0);
    }
    return comanda.total || 0;
  }

  refrescar(): void {
    this.cargarDatos();
  }

  cerrarSesion(): void {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
