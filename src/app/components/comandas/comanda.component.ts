import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

// 📦 Interface para Comanda (según el backend real)
interface Comanda {
  idComanda?: number;
  fecha?: string;
  mesaId: number;
  mesaUbicacion?: string;
  meseroId: string;
  meseroNombre?: string;
  cocineroId: string;
  cocineroNombre?: string;
  estadoId: number;
  estadoNombre?: string;
  detalles?: any[];
  total: number;
}

// Interface para crear comanda
interface ComandaCreate {
  fecha: string;
  mesaId: number;
  mesaUbicacion: string;
  meseroId: string;
  meseroNombre: string;
  cocineroId: string;
  cocineroNombre: string;
  estadoId: number;
  estadoNombre: string;
  detalles: any[];
  total: number;
}

interface Mesa {
  idMesa: number;
  ubicacion: string;
  capacidad: number;
  estadoId?: number;
  estado?: string;
}

interface Usuario {
  idUsuario?: number;
  id?: string;
  nombre: string;
  rol?: string;
  rolId?: number;
  rolNombre?: string; // 👈 CAMPO CORRECTO del backend
}

interface Estado {
  idEstado: number;
  nombre: string;
}

interface Filtros {
  estadoId: string;
  mesaId: string;
  meseroId: string;
}

@Component({
  selector: 'app-comanda',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './comanda.component.html',
  styleUrls: ['./comanda.component.css'],
})
export class ComandaComponent implements OnInit {
  // 📋 Listas principales
  comandas: Comanda[] = [];
  comandasFiltradas: Comanda[] = [];

  // 📋 Listas para ComboBox
  mesas: Mesa[] = [];
  mesasDisponibles: Mesa[] = [];
  meseros: Usuario[] = [];
  cocineros: Usuario[] = [];
  estados: Estado[] = [];

  // 🎯 Objetos para modales
  nuevaComanda: Comanda = {
    mesaId: 0,
    meseroId: '',
    cocineroId: '',
    estadoId: 0,
    total: 0,
  };

  comandaEditando: Comanda | null = null;
  comandaEliminar: Comanda | null = null;
  comandaEstado: Comanda | null = null;
  estadoSeleccionado: number = 0;

  // 🔍 Filtros
  filtros: Filtros = {
    estadoId: '',
    mesaId: '',
    meseroId: '',
  };

  // 🎨 Estados
  mostrarModalCrear: boolean = false;
  mostrarModalEditar: boolean = false;
  mostrarModalEliminar: boolean = false;
  mostrarModalEstado: boolean = false;
  loading: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';

  // 🌐 URLs API
  private apiComandas =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/comandas';
  private apiMesas =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/mesas';
  private apiUsuarios =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/usuarios';
  private apiEstados =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/estados';

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    console.log('🍽️ Componente Comanda iniciado');
    this.cargarDatosIniciales();
  }

  // 🔑 Método auxiliar para obtener headers con token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (token) {
      return new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  // 🔄 CARGAR todos los datos iniciales
  cargarDatosIniciales(): void {
    this.loading = true;
    this.cargarMesas();
    this.cargarUsuarios();
    this.cargarEstados();
    this.cargarComandas();
  }

  // 📥 CARGAR Mesas (para ComboBox)
  cargarMesas(): void {
    this.http.get<any[]>(this.apiMesas, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        console.log('📥 Mesas recibidas del backend:', data);

        this.mesas = data.map((mesa) => ({
          ...mesa,
          estado: this.convertirEstadoMesa(mesa.estadoId),
        }));

        this.mesasDisponibles = this.mesas.filter((m) => m.estado === 'DISPONIBLE');
        console.log(
          '✅ Mesas cargadas:',
          this.mesas.length,
          '| Disponibles:',
          this.mesasDisponibles.length
        );
      },
      error: (error) => {
        console.error('❌ Error al cargar mesas:', error);
        this.mostrarMensaje('Error al cargar las mesas', 'error');
      },
    });
  }

  // Convertir estadoId de mesa a texto
  private convertirEstadoMesa(estadoId: any): string {
    const estados: { [key: number]: string } = {
      1: 'DISPONIBLE',
      2: 'OCUPADA',
      3: 'RESERVADA',
    };
    return typeof estadoId === 'number' ? estados[estadoId] || 'DISPONIBLE' : 'DISPONIBLE';
  }

  // 📥 CARGAR Usuarios (Meseros y Cocineros) - ✅ ARREGLADO
  cargarUsuarios(): void {
    this.authService.getAllUsuarios().subscribe({
      next: (data) => {
        console.log('📥 Usuarios recibidos del backend:', data);

        // Filtrar meseros y cocineros usando rolNombre (el campo correcto)
        this.meseros = data.filter((u) => {
          const rol = u.rolNombre || u.rol || '';
          return rol.toUpperCase().includes('MESERO');
        });

        this.cocineros = data.filter((u) => {
          const rol = u.rolNombre || u.rol || '';
          return rol.toUpperCase().includes('COCINERO');
        });

        console.log('✅ Meseros cargados:', this.meseros.length);
        console.log('✅ Cocineros cargados:', this.cocineros.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios:', error);
        this.meseros = [];
        this.cocineros = [];
      },
    });
  }

  // 📥 CARGAR Estados (para ComboBox)
  cargarEstados(): void {
    this.http.get<Estado[]>(this.apiEstados, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        // Filtrar solo estados de COMANDA (IDs: 4, 5, 6, 7, 9)
        const estadosComandaIds = [4, 5, 6, 7, 9];
        this.estados = data.filter((e) => estadosComandaIds.includes(e.idEstado));

        console.log('✅ Estados de comanda cargados:', this.estados.length, this.estados);
      },
      error: (error) => {
        console.error('❌ Error al cargar estados:', error);
        this.mostrarMensaje('Error al cargar los estados', 'error');
      },
    });
  }

  // 📥 CARGAR Comandas
  cargarComandas(): void {
    this.http.get<Comanda[]>(this.apiComandas, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        console.log('📥 Comandas recibidas del backend:', data);
        this.comandas = data;
        this.comandasFiltradas = data;
        this.loading = false;
        console.log('✅ Comandas cargadas:', data.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar comandas:', error);
        this.mostrarMensaje(
          'Error al cargar las comandas: ' + (error.error?.message || error.message),
          'error'
        );
        this.loading = false;
      },
    });
  }

  // 📊 Estadísticas calculadas
  get comandasActivas(): number {
    if (!this.comandas || this.comandas.length === 0) return 0;
    return this.comandas.filter((c) => {
      const estadoNombre = (c.estadoNombre || '').toLowerCase();
      return !estadoNombre.includes('pagada') && !estadoNombre.includes('cancelada');
    }).length;
  }

  get comandasHoy(): number {
    if (!this.comandas || this.comandas.length === 0) return 0;
    const hoy = new Date().toISOString().split('T')[0];
    return this.comandas.filter((c) => c.fecha && c.fecha.startsWith(hoy)).length;
  }

  get comandasPendientes(): number {
    if (!this.comandas || this.comandas.length === 0) return 0;
    return this.comandas.filter((c) => {
      const estadoNombre = (c.estadoNombre || '').toLowerCase();
      return estadoNombre.includes('pendiente');
    }).length;
  }

  // 🎨 Métodos auxiliares para mostrar nombres
  getNombreMesa(mesaId: number): string {
    const mesa = this.mesas.find((m) => m.idMesa === mesaId);
    return mesa ? mesa.ubicacion : '-';
  }

  getNombreMesero(meseroId: string): string {
    const mesero = this.meseros.find((m) => (m.id || m.idUsuario?.toString()) === meseroId);
    return mesero ? mesero.nombre : '-';
  }

  getNombreCocinero(cocineroId: string): string {
    const cocinero = this.cocineros.find((c) => (c.id || c.idUsuario?.toString()) === cocineroId);
    return cocinero ? cocinero.nombre : '-';
  }

  getNombreEstado(estadoId: number): string {
    const estado = this.estados.find((e) => e.idEstado === estadoId);
    return estado ? estado.nombre : '-';
  }

  getBadgeClass(estadoNombre: string | undefined): string {
    if (!estadoNombre) return 'badge-pendiente';
    const nombre = estadoNombre.toLowerCase();
    if (nombre.includes('pendiente')) return 'badge-pendiente';
    if (nombre.includes('preparacion') || nombre.includes('preparación'))
      return 'badge-preparacion';
    if (nombre.includes('lista') || nombre.includes('listo')) return 'badge-lista';
    if (nombre.includes('entregada') || nombre.includes('servida')) return 'badge-entregada';
    if (nombre.includes('pagada')) return 'badge-pagada';
    return 'badge-pendiente';
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // 🔍 FILTROS
  aplicarFiltros(): void {
    if (!this.comandasFiltradas || this.comandasFiltradas.length === 0) {
      this.cargarComandas();
      return;
    }

    this.comandas = this.comandasFiltradas.filter((c) => {
      const coincideEstado = this.filtros.estadoId
        ? c.estadoId.toString() === this.filtros.estadoId
        : true;

      const coincideMesa = this.filtros.mesaId ? c.mesaId.toString() === this.filtros.mesaId : true;

      const coincideMesero = this.filtros.meseroId ? c.meseroId === this.filtros.meseroId : true;

      return coincideEstado && coincideMesa && coincideMesero;
    });

    console.log('🔍 Filtros aplicados. Comandas encontradas:', this.comandas.length);
  }

  limpiarFiltros(): void {
    this.filtros = { estadoId: '', mesaId: '', meseroId: '' };
    this.cargarComandas();
  }

  verActivas(): void {
    if (!this.comandasFiltradas || this.comandasFiltradas.length === 0) {
      this.cargarComandas();
      return;
    }

    this.comandas = this.comandasFiltradas.filter((c) => {
      const estadoNombre = (c.estadoNombre || '').toLowerCase();
      return !estadoNombre.includes('pagada') && !estadoNombre.includes('cancelada');
    });

    console.log('👁️ Mostrando activas:', this.comandas.length);

    if (this.comandas.length === 0) {
      this.mostrarMensaje('No hay comandas activas en este momento', 'error');
    } else {
      this.mostrarMensaje(`Mostrando ${this.comandas.length} comandas activas`, 'success');
    }
  }

  // ➕ CREAR Comanda
  abrirModalCrear(): void {
    this.nuevaComanda = {
      mesaId: 0,
      meseroId: '',
      cocineroId: '',
      estadoId: this.estados.length > 0 ? this.estados[0].idEstado : 0,
      total: 0,
    };
    this.mostrarModalCrear = true;
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
  }

  crearComanda(): void {
    if (!this.validarComanda(this.nuevaComanda)) return;

    this.loading = true;

    // Buscar nombres para enviar
    const mesa = this.mesas.find((m) => m.idMesa === this.nuevaComanda.mesaId);
    const mesero = this.meseros.find(
      (m) => (m.id || m.idUsuario?.toString()) === this.nuevaComanda.meseroId
    );
    const cocinero = this.cocineros.find(
      (c) => (c.id || c.idUsuario?.toString()) === this.nuevaComanda.cocineroId
    );
    const estado = this.estados.find((e) => e.idEstado === this.nuevaComanda.estadoId);

    const comandaParaEnviar: ComandaCreate = {
      fecha: new Date().toISOString(),
      mesaId: this.nuevaComanda.mesaId,
      mesaUbicacion: mesa?.ubicacion || '',
      meseroId: this.nuevaComanda.meseroId,
      meseroNombre: mesero?.nombre || '',
      cocineroId: this.nuevaComanda.cocineroId,
      cocineroNombre: cocinero?.nombre || '',
      estadoId: this.nuevaComanda.estadoId,
      estadoNombre: estado?.nombre || '',
      detalles: [],
      total: 0,
    };

    console.log('📤 Enviando comanda:', comandaParaEnviar);

    this.http
      .post<Comanda>(this.apiComandas, comandaParaEnviar, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          console.log('✅ Comanda creada:', response);
          this.mostrarMensaje('Comanda creada exitosamente', 'success');
          this.cerrarModalCrear();

          this.filtros = { estadoId: '', mesaId: '', meseroId: '' };
          this.cargarComandas();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al crear comanda:', error);
          this.mostrarMensaje(
            'Error al crear la comanda: ' + (error.error?.message || error.message),
            'error'
          );
          this.loading = false;
        },
      });
  }

  // ✏️ EDITAR Comanda
  abrirModalEditar(comanda: Comanda): void {
    this.comandaEditando = { ...comanda };
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.comandaEditando = null;
  }

  actualizarComanda(): void {
    if (!this.comandaEditando || !this.validarComanda(this.comandaEditando)) return;

    const url = `${this.apiComandas}/${this.comandaEditando.idComanda}`;
    this.loading = true;

    // Buscar nombres actualizados
    const mesa = this.mesas.find((m) => m.idMesa === this.comandaEditando!.mesaId);
    const mesero = this.meseros.find(
      (m) => (m.id || m.idUsuario?.toString()) === this.comandaEditando!.meseroId
    );
    const cocinero = this.cocineros.find(
      (c) => (c.id || c.idUsuario?.toString()) === this.comandaEditando!.cocineroId
    );
    const estado = this.estados.find((e) => e.idEstado === this.comandaEditando!.estadoId);

    const comandaParaEnviar = {
      ...this.comandaEditando,
      mesaUbicacion: mesa?.ubicacion || this.comandaEditando.mesaUbicacion,
      meseroNombre: mesero?.nombre || this.comandaEditando.meseroNombre,
      cocineroNombre: cocinero?.nombre || this.comandaEditando.cocineroNombre,
      estadoNombre: estado?.nombre || this.comandaEditando.estadoNombre,
    };

    this.http.put<Comanda>(url, comandaParaEnviar, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('✅ Comanda actualizada:', response);
        this.mostrarMensaje('Comanda actualizada exitosamente', 'success');
        this.cerrarModalEditar();

        this.filtros = { estadoId: '', mesaId: '', meseroId: '' };
        this.cargarComandas();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al actualizar comanda:', error);
        this.mostrarMensaje(
          'Error al actualizar la comanda: ' + (error.error?.message || error.message),
          'error'
        );
        this.loading = false;
      },
    });
  }

  // 🔄 CAMBIAR Estado
  abrirModalEstado(comanda: Comanda): void {
    this.comandaEstado = comanda;
    this.estadoSeleccionado = comanda.estadoId;
    this.mostrarModalEstado = true;
  }

  cerrarModalEstado(): void {
    this.mostrarModalEstado = false;
    this.comandaEstado = null;
  }

  seleccionarEstado(idEstado: number): void {
    this.estadoSeleccionado = idEstado;
  }

  cambiarEstado(): void {
    if (!this.comandaEstado) return;

    const estado = this.estados.find((e) => e.idEstado === this.estadoSeleccionado);

    const comandaActualizada = {
      ...this.comandaEstado,
      estadoId: this.estadoSeleccionado,
      estadoNombre: estado?.nombre || this.comandaEstado.estadoNombre,
    };

    const url = `${this.apiComandas}/${this.comandaEstado.idComanda}`;
    this.loading = true;

    this.http.put<Comanda>(url, comandaActualizada, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.mostrarMensaje('Estado cambiado exitosamente', 'success');
        this.cerrarModalEstado();

        this.filtros = { estadoId: '', mesaId: '', meseroId: '' };
        this.cargarComandas();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cambiar estado:', error);
        this.mostrarMensaje(
          'Error al cambiar el estado: ' + (error.error?.message || error.message),
          'error'
        );
        this.loading = false;
      },
    });
  }

  // 🗑️ ELIMINAR Comanda
  abrirModalEliminar(comanda: Comanda): void {
    this.comandaEliminar = comanda;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.comandaEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.comandaEliminar?.idComanda) return;

    const url = `${this.apiComandas}/${this.comandaEliminar.idComanda}`;
    this.loading = true;

    this.http.delete(url, { headers: this.getHeaders() }).subscribe({
      next: () => {
        console.log('✅ Comanda eliminada');
        this.mostrarMensaje('Comanda eliminada exitosamente', 'success');
        this.cerrarModalEliminar();

        this.filtros = { estadoId: '', mesaId: '', meseroId: '' };
        this.cargarComandas();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al eliminar comanda:', error);
        this.mostrarMensaje(
          'Error al eliminar la comanda: ' + (error.error?.message || error.message),
          'error'
        );
        this.loading = false;
      },
    });
  }

  // ✅ VALIDAR Comanda
  validarComanda(comanda: Comanda): boolean {
    if (!comanda.mesaId || comanda.mesaId === 0) {
      this.mostrarMensaje('Debe seleccionar una mesa', 'error');
      return false;
    }

    if (!comanda.meseroId || comanda.meseroId === '') {
      this.mostrarMensaje('Debe seleccionar un mesero', 'error');
      return false;
    }

    if (!comanda.cocineroId || comanda.cocineroId === '') {
      this.mostrarMensaje('Debe seleccionar un cocinero', 'error');
      return false;
    }

    if (!comanda.estadoId || comanda.estadoId === 0) {
      this.mostrarMensaje('Debe seleccionar un estado', 'error');
      return false;
    }

    return true;
  }

  // 💬 Mostrar mensajes
  mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;

    setTimeout(() => {
      this.mensaje = '';
      this.tipoMensaje = '';
    }, 4000);
  }

  // 🔙 Volver al dashboard
  volverAlDashboard(): void {
    this.router.navigate(['/dashboard-admin']);
  }
}
