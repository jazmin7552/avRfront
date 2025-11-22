import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ComandaService } from '../../../services/comanda.service';
import { Comanda } from '../../../models/comanda.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-comandas-pendientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comandas-pendientes.component.html',
  styleUrls: ['./comandas-pendientes.component.css'],
})
export class ComandasPendientesComponent implements OnInit {
  comandas: Comanda[] = [];
  comandasFiltradas: Comanda[] = [];
  loading: boolean = true;
  filtroEstado: string = 'TODAS';
  cocineroId: string = '';

  contadores = {
    pendientes: 0,
    preparacion: 0,
    total: 0,
  };

  constructor(
    private comandaService: ComandaService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerDatosCocinero();
    this.route.queryParams.subscribe(params => {
      this.filtroEstado = params['filtro'] || 'TODAS';
      this.cargarComandas();
    });
  }

  obtenerDatosCocinero(): void {
    const usuario = this.authService.getUsuario();
    if (usuario) {
      this.cocineroId = (usuario.idUsuario ?? '').toString();
    }
  }

  cargarComandas(): void {
    this.loading = true;

    // Cargar comandas pendientes y en preparación
    this.comandaService.obtenerComandasPendientes().subscribe({
      next: (pendientes: Comanda[]) => {
        this.comandaService.obtenerComandasEnPreparacion().subscribe({
          next: (preparacion: Comanda[]) => {
            // Combinar ambas listas
            this.comandas = [...pendientes, ...preparacion];

            // Cargar detalles para las comandas
            this.cargarDetallesComandas();

            this.calcularContadores();
            this.aplicarFiltro();
            this.loading = false;
          },
          error: (err) => {
            console.error('Error al cargar comandas en preparación:', err);
            // Si falla la segunda, al menos mostrar las pendientes
            this.comandas = pendientes;

            // Cargar detalles para las comandas
            this.cargarDetallesComandas();

            this.calcularContadores();
            this.aplicarFiltro();
            this.loading = false;
          },
        });
      },
      error: (err) => {
        console.error('Error al cargar comandas pendientes:', err);
        this.loading = false;
        alert('Error al cargar las comandas');
      },
    });
  }

  cargarDetallesComandas(): void {
    this.comandaService.obtenerTodosLosDetalles().subscribe({
      next: (todosDetalles: any[]) => {
        console.log('✅ Todos los detalles cargados para comandas pendientes:', todosDetalles);

        // Asignar detalles a cada comanda
        this.comandas.forEach((comanda: any) => {
          comanda.detalles = todosDetalles;
          console.log(`📋 Detalles asignados a comanda ${comanda.comandaId}:`, comanda.detalles);
        });
      },
      error: (err: any) => {
        console.error('❌ Error al cargar todos los detalles para comandas pendientes:', err);
        // Asignar arrays vacíos
        this.comandas.forEach((comanda: any) => {
          comanda.detalles = [];
        });
      },
    });
  }

  calcularContadores(): void {
    this.contadores.pendientes = this.comandas.filter((c) => c.estadoNombre === 'PENDIENTE').length;
    this.contadores.preparacion = this.comandas.filter((c) => c.estadoNombre === 'EN_PREPARACION').length;
    this.contadores.total = this.comandas.length;
  }

  filtrarPorEstado(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    if (this.filtroEstado === 'TODAS') {
      this.comandasFiltradas = [...this.comandas];
    } else {
      this.comandasFiltradas = this.comandas.filter((c) => c.estadoNombre === this.filtroEstado);
    }
  }

  verDetalleComanda(comanda: Comanda): void {
    if (comanda.comandaId) {
      this.router.navigate(['/cocinero/detalle-comanda', comanda.comandaId]);
    }
  }

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

  calcularTotalComanda(comanda: Comanda): number {
    if (comanda.detalles && Array.isArray(comanda.detalles)) {
      return comanda.detalles.reduce((sum, detalle) => sum + (detalle.subtotal || 0), 0);
    }
    return comanda.total || 0;
  }

  // ===================== ACCIONES DEL COCINERO =====================

  iniciarPreparacion(comanda: Comanda): void {
    if (!this.cocineroId) {
      alert('Error: No se pudo identificar al cocinero');
      return;
    }

    if (confirm(`¿Iniciar preparación de la comanda #${comanda.comandaId}?`)) {
      // Primero asignar cocinero
      this.comandaService.asignarCocinero(comanda.comandaId!, this.cocineroId).subscribe({
        next: () => {
          // Luego cambiar estado a EN_PREPARACION (estado 2)
          this.comandaService.cambiarEstadoComanda(comanda.comandaId!, 2).subscribe({
            next: () => {
              alert(`✅ Comanda #${comanda.comandaId} en preparación`);
              this.cargarComandas(); // Recargar datos
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

  marcarComoLista(comanda: Comanda): void {
    if (confirm(`¿Marcar como lista la comanda #${comanda.comandaId}?`)) {
      this.comandaService.cambiarEstadoComanda(comanda.comandaId!, 3).subscribe({
        next: () => {
          alert(`✅ Comanda #${comanda.comandaId} marcada como lista`);
          this.cargarComandas();
        },
        error: (err) => {
          console.error('❌ Error al marcar como lista:', err);
          alert('❌ Error al actualizar estado');
        },
      });
    }
  }

  volver(): void {
    this.router.navigate(['/cocinero/dashboard']);
  }

  refrescar(): void {
    this.cargarComandas();
  }
}
