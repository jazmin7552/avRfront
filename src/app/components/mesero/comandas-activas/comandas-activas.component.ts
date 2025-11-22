import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ComandaService } from '../../../services/comanda.service';
import { Comanda } from '../../../models/comanda.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-comandas-activas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comandas-activas.component.html',
  styleUrls: ['./comandas-activas.component.css'],
})
export class ComandasActivasComponent implements OnInit {
  comandas: Comanda[] = [];
  comandasFiltradas: Comanda[] = [];
  loading: boolean = true;
  filtroEstado: string = 'TODAS';

  contadores = {
    pendientes: 0,
    listas: 0,
    total: 0,
  };

  constructor(
    private comandaService: ComandaService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarComandas();
  }

  cargarComandas(): void {
    this.loading = true;

    // ✅ Usa el endpoint /api/comandas/mis-comandas-activas
    // El backend extrae el meseroId del token JWT automáticamente
    this.comandaService.getMisComandasActivas().subscribe({
      next: (comandas: Comanda[]) => {
        console.log('📦 MIS COMANDAS ACTIVAS RECIBIDAS:', comandas);

        // 🔥 Normalizar el estadoNombre por si viene diferente
        this.comandas = comandas.map((c) => ({
          ...c,
          estadoNombre: this.normalizarEstado(c.estadoNombre || c.estadoId),
        }));

        this.calcularContadores();
        this.aplicarFiltro();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar comandas activas:', err);
        this.loading = false;

        // Manejar error 401/403 (no autorizado)
        if (err.status === 401 || err.status === 403) {
          alert('Sesión expirada. Por favor inicia sesión nuevamente.');
          this.router.navigate(['/login']);
        } else {
          alert('Error al cargar las comandas activas');
        }
      },
    });
  }

  /**
   * 🔥 Normaliza el estado según los IDs del backend:
   * - 4 = PENDIENTE
   * - 5 = LISTA
   * - 6 = ENTREGADA
   * - 7 = CANCELADA
   */
  normalizarEstado(estado: string | number | undefined): string {
    if (typeof estado === 'number') {
      const mapeoIds: { [key: number]: string } = {
        4: 'PENDIENTE',
        5: 'LISTA',
        6: 'ENTREGADA',
        7: 'CANCELADA',
      };
      return mapeoIds[estado] || 'DESCONOCIDO';
    }

    if (typeof estado === 'string') {
      // Normalizar variaciones comunes
      const estadoUpper = estado.toUpperCase().trim();
      if (estadoUpper.includes('PENDIENTE')) return 'PENDIENTE';
      if (estadoUpper.includes('LISTA')) return 'LISTA';
      if (estadoUpper.includes('ENTREGADA')) return 'ENTREGADA';
      if (estadoUpper.includes('CANCELADA')) return 'CANCELADA';
      return estadoUpper;
    }

    return 'DESCONOCIDO';
  }

  calcularContadores(): void {
    // 🔥 Solo contamos PENDIENTE y LISTA (los estados activos según el backend)
    this.contadores.pendientes = this.comandas.filter((c) => c.estadoNombre === 'PENDIENTE').length;

    this.contadores.listas = this.comandas.filter((c) => c.estadoNombre === 'LISTA').length;

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
    if (comanda.mesaId) {
      this.router.navigate(['/mesero/ver-cuenta', comanda.mesaId]);
    } else if (comanda.comandaId) {
      // Alternativa: ir por ID de comanda
      this.router.navigate(['/mesero/comanda', comanda.comandaId]);
    }
  }

  getEstadoClase(estado: string): string {
    const clases: { [key: string]: string } = {
      PENDIENTE: 'estado-pendiente',
      LISTA: 'estado-lista',
      ENTREGADA: 'estado-entregada',
      CANCELADA: 'estado-cancelada',
    };
    return clases[estado] || '';
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      PENDIENTE: 'Pendiente',
      LISTA: 'Lista para Entregar',
      ENTREGADA: 'Entregada',
      CANCELADA: 'Cancelada',
    };
    return textos[estado] || estado;
  }

  getEstadoIcono(estado: string): string {
    const iconos: { [key: string]: string } = {
      PENDIENTE: '⏳',
      LISTA: '✅',
      ENTREGADA: '🎉',
      CANCELADA: '❌',
    };
    return iconos[estado] || '📋';
  }

  calcularTotalComanda(comanda: Comanda): number {
    if (comanda.detalles && Array.isArray(comanda.detalles)) {
      return comanda.detalles.reduce((sum, detalle) => sum + (detalle.subtotal || 0), 0);
    }
    return comanda.total || 0;
  }

  volver(): void {
    this.router.navigate(['/mesero/dashboard']);
  }

  refrescar(): void {
    this.cargarComandas();
  }
}
