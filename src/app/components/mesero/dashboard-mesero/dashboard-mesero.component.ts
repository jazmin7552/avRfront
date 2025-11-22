import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Mesa } from '../../../models/mesa.model';
import { MesaService } from '../../../services/mesa.service';
import { ComandaService } from '../../../services/comanda.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard-mesero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-mesero.component.html',
  styleUrls: ['./dashboard-mesero.component.css'],
})
export class DashboardMeseroComponent implements OnInit {
  mesas: Mesa[] = [];
  comandasActivas: any[] = [];
  meseroNombre: string = '';
  meseroId: string = '';
  loading: boolean = true;

  estadisticas = {
    mesasAtendidas: 0,
    comandasPendientes: 0,
    comandasCompletadas: 0,
    totalVendido: 0,
  };

  constructor(
    private mesaService: MesaService,
    private comandaService: ComandaService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerDatosMesero();
    this.cargarDatos();
  }

  obtenerDatosMesero(): void {
    const usuario = this.authService.getUsuario();

    if (!usuario) {
      console.error('⚠️ No se encontró usuario autenticado');
      alert('Error: No se pudo identificar al mesero. Por favor, inicia sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }

    this.meseroNombre = usuario.nombre || 'Mesero';
    this.meseroId = (usuario.idUsuario ?? '').toString();

    console.log('👤 Datos del mesero cargados:', {
      nombre: this.meseroNombre,
      id: this.meseroId,
    });

    if (!this.meseroId) {
      console.error('⚠️ El usuario NO tiene ID');
      alert('Error: No se pudo obtener el ID del mesero.');
    }
  }

  cargarDatos(): void {
    this.loading = true;

    // 🔹 Mesas
    this.mesaService.getAll().subscribe({
      next: (mesas: any[]) => {
        this.mesas = mesas.map((m) => ({
          ...m,
          estado: this.convertirEstadoIdATexto(m.estadoId || m.estado),
        })) as Mesa[];
        console.log('✅ Mesas cargadas:', this.mesas);
      },
      error: (err) => {
        console.error('❌ Error al cargar mesas:', err);
        alert('Error al cargar las mesas.');
        this.loading = false;
      },
    });

    // 🔹 Comandas del mesero (SOLO PARA ESTADÍSTICAS Y LISTADO)
    if (!this.meseroId) {
      console.error('No se pudo obtener el ID del mesero');
      this.loading = false;
      return;
    }

    // 🔥 CAMBIO: Usar endpoint específico del mesero
    this.comandaService.getMisComandasActivas().subscribe({
      next: (comandas: any[]) => {
        this.comandasActivas = comandas;
        this.calcularEstadisticas();
        this.loading = false;
        console.log('✅ Mis comandas activas:', this.comandasActivas);
      },
      error: (err) => {
        console.error('❌ Error al cargar comandas:', err);
        this.loading = false;
      },
    });
  }

  // ===================== ESTADOS MESA =====================

  private convertirEstadoIdATexto(estadoId: any): 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' {
    if (estadoId === 1 || estadoId === 'DISPONIBLE') return 'DISPONIBLE';
    if (estadoId === 2 || estadoId === 'OCUPADA') return 'OCUPADA';
    if (estadoId === 3 || estadoId === 'RESERVADA') return 'RESERVADA';
    return 'DISPONIBLE';
  }

  private convertirEstadoTextoAId(estado: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA'): number {
    const mapa: { [key: string]: number } = { DISPONIBLE: 1, OCUPADA: 2, RESERVADA: 3 };
    return mapa[estado] || 1;
  }

  convertirEstadoTextoAIdPublico(
    estado: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | undefined
  ): number {
    if (!estado) return 1;
    return this.convertirEstadoTextoAId(estado);
  }

  // ===================== VALIDACIÓN FRONT =====================

  /**
   * 🔥 CORREGIDO: Ahora verifica contra el estado REAL de la mesa desde el backend
   * Solo puede cambiar estado si la mesa está DISPONIBLE o RESERVADA
   * Si está OCUPADA, significa que hay comandas activas (propias o de otros meseros)
   */
  puedeCambiarEstado(mesa: Mesa): boolean {
    if (!mesa || !mesa.idMesa) return false;

    // 🔥 Si la mesa está OCUPADA, NO se puede cambiar (tiene comandas activas)
    return mesa.estado === 'DISPONIBLE' || mesa.estado === 'RESERVADA';
  }

  cambiarEstadoDesdSelect(event: Event, mesa: Mesa): void {
    event.stopPropagation();
    const select = event.target as HTMLSelectElement;
    const nuevoEstadoId = parseInt(select.value, 10);
    const nuevoEstadoTexto = this.convertirEstadoIdATexto(nuevoEstadoId);

    if (mesa.estado === nuevoEstadoTexto) return;

    // 🔥 SIMPLIFICADO: Solo verifica el estado actual
    if (mesa.estado === 'OCUPADA') {
      alert(`❌ No puedes cambiar el estado. Esta mesa tiene comandas activas.`);
      // Devolver el select a su valor original
      select.value = this.convertirEstadoTextoAId(mesa.estado as any).toString();
      return;
    }

    this.cambiarEstadoMesaInterno(mesa, nuevoEstadoTexto);
  }

  cambiarEstadoMesa(
    event: Event,
    mesa: Mesa,
    nuevoEstado: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 1 | 2 | 3
  ): void {
    event.stopPropagation();
    let estadoTexto: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA';

    if (typeof nuevoEstado === 'number') {
      estadoTexto = this.convertirEstadoIdATexto(nuevoEstado);
    } else {
      estadoTexto = nuevoEstado;
    }

    if (mesa.estado === estadoTexto) return;

    // 🔥 SIMPLIFICADO: Solo verifica si está ocupada
    if (mesa.estado === 'OCUPADA') {
      alert(`❌ No puedes cambiar el estado. Esta mesa tiene comandas activas.`);
      return;
    }

    const nombreMesa = (mesa as any).numeroMesa || `Mesa ${mesa.idMesa}`;
    if (!confirm(`¿Cambiar ${nombreMesa} de ${mesa.estado} a ${estadoTexto}?`)) return;

    this.cambiarEstadoMesaInterno(mesa, estadoTexto);
  }

  private cambiarEstadoMesaInterno(
    mesa: Mesa,
    estadoTexto: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA'
  ): void {
    const estadoIdParaBackend = this.convertirEstadoTextoAId(estadoTexto);

    this.mesaService.cambiarEstado(mesa.idMesa!, estadoIdParaBackend).subscribe({
      next: () => {
        mesa.estado = estadoTexto;
        alert(`✅ Mesa actualizada a ${estadoTexto}`);
      },
      error: (err) => {
        console.error('❌ Error al cambiar estado:', err);
        alert('❌ Error al cambiar el estado de la mesa.');
        this.cargarDatos();
      },
    });
  }

  // ===================== ESTADÍSTICAS =====================

  calcularEstadisticas(): void {
    this.estadisticas.comandasPendientes = this.comandasActivas.filter(
      (c) => c.estadoNombre === 'PENDIENTE' || c.estadoNombre === 'EN_PREPARACION'
    ).length;

    this.estadisticas.comandasCompletadas = this.comandasActivas.filter(
      (c) => c.estadoNombre === 'LISTA' || c.estadoNombre === 'SERVIDO'
    ).length;

    this.estadisticas.totalVendido = this.comandasActivas.reduce(
      (total, comanda) => total + (comanda.total || 0),
      0
    );

    const mesasUnicas = new Set(
      this.comandasActivas.map((c) => c.mesaId).filter((id) => id !== null)
    );
    this.estadisticas.mesasAtendidas = mesasUnicas.size;
  }

  // ===================== ESTILO / COLORES =====================

  getEstadoMesa(mesa: Mesa): string {
    if (mesa.estado === 'OCUPADA') return 'ocupada';
    else if (mesa.estado === 'RESERVADA') return 'reservada';
    return 'disponible';
  }

  getMesaColor(mesa: Mesa): string {
    if (mesa.estado === 'OCUPADA') return 'occupied';
    else if (mesa.estado === 'RESERVADA') return 'reserved';
    return 'available';
  }

  // ===================== NAVEGACIÓN =====================

  abrirMesa(mesa: Mesa): void {
    if (!mesa.idMesa) {
      alert('Error: Mesa sin ID');
      return;
    }

    if (mesa.estado === 'DISPONIBLE' || mesa.estado === 'RESERVADA') {
      this.router.navigate(['/mesero/tomar-comanda', mesa.idMesa]);
    } else if (mesa.estado === 'OCUPADA') {
      this.verComanda(mesa.idMesa);
    }
  }

  verComanda(idMesa: number | undefined): void {
    if (idMesa) {
      this.router.navigate(['/mesero/ver-cuenta', idMesa]);
    }
  }

  nuevaComanda(): void {
    const mesasDisponibles = this.mesas.filter((m) => m.estado === 'DISPONIBLE');

    if (mesasDisponibles.length === 0) {
      alert('No hay mesas disponibles.');
      return;
    }

    let mensaje = `✅ Hay ${mesasDisponibles.length} mesa(s) disponible(s):\n\n`;
    mesasDisponibles.forEach((mesa: any) => {
      mensaje += `- ${mesa.numeroMesa || 'Mesa ' + mesa.idMesa} (Capacidad: ${mesa.capacidad})\n`;
    });
    alert(mensaje);
  }

  verComandasActivas(): void {
    this.router.navigate(['/mesero/comandas-activas']);
  }

  cerrarSesion(): void {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
