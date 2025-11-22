import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

// 📦 Interface para visualización (siempre texto)
interface Mesa {
  idMesa?: number;
  ubicacion: string;
  capacidad: number;
  estadoId?: number;
  estado?: string;
}

// Interface para crear/editar (números)
interface MesaAPI {
  idMesa?: number;
  ubicacion: string;
  capacidad: number;
  estadoId: 1 | 2 | 3;
}

interface Filtros {
  numero: string;
  estado: string;
  capacidadMin: number | null;
}

// 🔄 Mapeo de estados: API usa números, UI usa texto
const ESTADO_A_NUMERO: { [key: string]: number } = {
  DISPONIBLE: 1,
  OCUPADA: 2,
  RESERVADA: 3,
};

const NUMERO_A_ESTADO: { [key: number]: string } = {
  1: 'DISPONIBLE',
  2: 'OCUPADA',
  3: 'RESERVADA',
};

@Component({
  selector: 'app-mesa',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './mesa.component.html',
  styleUrls: ['./mesa.component.css'],
})
export class MesaComponent implements OnInit {
  // 📋 Listas
  mesas: Mesa[] = [];
  mesasFiltradas: Mesa[] = [];

  // 🎯 Objetos para modales
  nuevaMesa: MesaAPI = {
    ubicacion: '',
    capacidad: 1,
    estadoId: 1 as 1 | 2 | 3, // 1 = DISPONIBLE
  };

  mesaEditando: MesaAPI | null = null;
  mesaEliminar: Mesa | null = null;

  // 🔍 Filtros
  filtros: Filtros = {
    numero: '',
    estado: '',
    capacidadMin: null,
  };

  // 🎨 Estados
  mostrarModalCrear: boolean = false;
  mostrarModalEditar: boolean = false;
  mostrarModalEliminar: boolean = false;
  loading: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';

  // 👁️ Vista actual
  vistaActual: 'cuadricula' | 'tabla' = 'cuadricula';

  // 🌐 URL API
  private apiUrl = 'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/mesas';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    console.log('🍽️ Componente Mesa iniciado');
    this.cargarMesas();
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

  // 🔄 Método auxiliar para convertir estado de número a texto
  private convertirEstadoParaUI(estadoId: any): string {
    if (typeof estadoId === 'number') {
      return NUMERO_A_ESTADO[estadoId] || 'SIN ESTADO';
    }
    return 'SIN ESTADO';
  }

  // 📥 CARGAR Mesas
  cargarMesas(): void {
    this.loading = true;

    this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        console.log('📥 Datos recibidos del backend:', data);

        // Convertir números a texto para la UI
        this.mesas = data.map((mesa) => ({
          ...mesa,
          estado: this.convertirEstadoParaUI(mesa.estadoId),
        }));

        this.mesasFiltradas = this.mesas;
        this.loading = false;
        console.log('✅ Mesas cargadas y convertidas:', this.mesas.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar mesas:', error);
        this.mostrarMensaje(
          'Error al cargar las mesas: ' + (error.error?.message || error.message),
          'error'
        );
        this.loading = false;
      },
    });
  }

  // 📊 Estadísticas calculadas
  get mesasDisponibles(): number {
    if (!this.mesas || this.mesas.length === 0) return 0;
    return this.mesas.filter((m) => m.estado === 'DISPONIBLE').length;
  }

  get mesasOcupadas(): number {
    if (!this.mesas || this.mesas.length === 0) return 0;
    return this.mesas.filter((m) => m.estado === 'OCUPADA').length;
  }

  get mesasReservadas(): number {
    if (!this.mesas || this.mesas.length === 0) return 0;
    return this.mesas.filter((m) => m.estado === 'RESERVADA').length;
  }

  // 🎨 Badge CSS dinámico
  getBadgeClass(estado: string | undefined): string {
    if (!estado) return '';

    switch (estado) {
      case 'DISPONIBLE':
        return 'badge-disponible';
      case 'OCUPADA':
        return 'badge-ocupada';
      case 'RESERVADA':
        return 'badge-reservada';
      default:
        return '';
    }
  }

  // 🔍 FILTROS
  aplicarFiltros(): void {
    if (!this.mesasFiltradas || this.mesasFiltradas.length === 0) {
      this.cargarMesas();
      return;
    }

    this.mesas = this.mesasFiltradas.filter((m) => {
      const coincideNumero = this.filtros.numero
        ? m.ubicacion.toLowerCase().includes(this.filtros.numero.toLowerCase())
        : true;

      const coincideEstado = this.filtros.estado ? m.estado === this.filtros.estado : true;

      const coincideCapacidad = this.filtros.capacidadMin
        ? m.capacidad >= this.filtros.capacidadMin
        : true;

      return coincideNumero && coincideEstado && coincideCapacidad;
    });

    console.log('🔍 Filtros aplicados. Mesas encontradas:', this.mesas.length);
  }

  limpiarFiltros(): void {
    this.filtros = {
      numero: '',
      estado: '',
      capacidadMin: null,
    };
    this.cargarMesas();
  }

  verDisponibles(): void {
    if (!this.mesasFiltradas || this.mesasFiltradas.length === 0) {
      this.cargarMesas();
      return;
    }

    this.mesas = this.mesasFiltradas.filter((m) => m.estado === 'DISPONIBLE');
    console.log('👁️ Mostrando disponibles:', this.mesas.length);

    if (this.mesas.length === 0) {
      this.mostrarMensaje('No hay mesas disponibles en este momento', 'error');
    } else {
      this.mostrarMensaje(`Mostrando ${this.mesas.length} mesas disponibles`, 'success');
    }
  }

  // ➕ CREAR Mesa
  abrirModalCrear(): void {
    this.nuevaMesa = {
      ubicacion: '',
      capacidad: 1,
      estadoId: 1 as 1 | 2 | 3, // 1 = DISPONIBLE
    };
    this.mostrarModalCrear = true;
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
  }

  crearMesa(): void {
    if (!this.validarMesa(this.nuevaMesa)) return;

    this.loading = true;

    // Asegurar que estadoId sea un número válido (1, 2, o 3)
    const estadoIdNumero = parseInt(String(this.nuevaMesa.estadoId), 10);

    if (![1, 2, 3].includes(estadoIdNumero)) {
      this.mostrarMensaje('Estado inválido. Debe ser 1, 2 o 3', 'error');
      this.loading = false;
      return;
    }

    // Enviar con los nombres correctos del backend
    const mesaParaEnviar = {
      ubicacion: this.nuevaMesa.ubicacion.trim(),
      capacidad: parseInt(String(this.nuevaMesa.capacidad), 10),
      estadoId: estadoIdNumero,
    };

    console.log('📤 Enviando a crear:', mesaParaEnviar);
    console.log('📤 Tipo de estadoId:', typeof mesaParaEnviar.estadoId);
    console.log('📤 Valor de estadoId:', mesaParaEnviar.estadoId);

    this.http.post<any>(this.apiUrl, mesaParaEnviar, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('✅ Mesa creada:', response);
        this.mostrarMensaje('Mesa creada exitosamente', 'success');
        this.cerrarModalCrear();

        this.filtros = {
          numero: '',
          estado: '',
          capacidadMin: null,
        };

        this.cargarMesas();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al crear mesa:', error);
        console.error('❌ Error completo:', error.error);
        console.error('❌ Status:', error.status);
        console.error('❌ Mensaje:', error.error?.message);
        this.mostrarMensaje(
          'Error al crear la mesa: ' + (error.error?.message || error.message),
          'error'
        );
        this.loading = false;
      },
    });
  }

  // ✏️ EDITAR Mesa
  abrirModalEditar(mesa: Mesa): void {
    this.mesaEditando = {
      idMesa: mesa.idMesa,
      ubicacion: mesa.ubicacion,
      capacidad: mesa.capacidad,
      estadoId: (mesa.estadoId || 1) as 1 | 2 | 3,
    };
    console.log('📝 Editando mesa:', this.mesaEditando);
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.mesaEditando = null;
  }

  actualizarMesa(): void {
    if (!this.mesaEditando || !this.validarMesa(this.mesaEditando)) return;

    const url = `${this.apiUrl}/${this.mesaEditando.idMesa}`;
    this.loading = true;

    // Asegurar que estadoId sea un número válido
    const estadoIdNumero = parseInt(String(this.mesaEditando.estadoId), 10);

    if (![1, 2, 3].includes(estadoIdNumero)) {
      this.mostrarMensaje('Estado inválido. Debe ser 1, 2 o 3', 'error');
      this.loading = false;
      return;
    }

    // Enviar con los nombres correctos del backend
    const mesaParaEnviar = {
      ubicacion: this.mesaEditando.ubicacion.trim(),
      capacidad: parseInt(String(this.mesaEditando.capacidad), 10),
      estadoId: estadoIdNumero,
    };

    console.log('📤 Enviando a actualizar:', mesaParaEnviar);

    this.http.put<any>(url, mesaParaEnviar, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('✅ Mesa actualizada:', response);
        this.mostrarMensaje('Mesa actualizada exitosamente', 'success');
        this.cerrarModalEditar();

        this.filtros = {
          numero: '',
          estado: '',
          capacidadMin: null,
        };

        this.cargarMesas();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al actualizar mesa:', error);
        console.error('❌ Error completo:', error.error);
        this.mostrarMensaje(
          'Error al actualizar la mesa: ' + (error.error?.message || error.message),
          'error'
        );
        this.loading = false;
      },
    });
  }

  // 🗑️ ELIMINAR Mesa
  abrirModalEliminar(mesa: Mesa): void {
    this.mesaEliminar = mesa;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.mesaEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.mesaEliminar?.idMesa) return;

    const url = `${this.apiUrl}/${this.mesaEliminar.idMesa}`;
    this.loading = true;

    this.http.delete(url, { headers: this.getHeaders() }).subscribe({
      next: () => {
        console.log('✅ Mesa eliminada');
        this.mostrarMensaje('Mesa eliminada exitosamente', 'success');
        this.cerrarModalEliminar();

        this.filtros = {
          numero: '',
          estado: '',
          capacidadMin: null,
        };

        this.cargarMesas();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al eliminar mesa:', error);
        this.mostrarMensaje(
          'Error al eliminar la mesa: ' + (error.error?.message || error.message),
          'error'
        );
        this.loading = false;
      },
    });
  }

  // ✅ VALIDAR Mesa
  validarMesa(mesa: Mesa | MesaAPI): boolean {
    if (!mesa) {
      this.mostrarMensaje('Error: Mesa no definida', 'error');
      return false;
    }

    if (!mesa.ubicacion || !mesa.ubicacion.trim()) {
      this.mostrarMensaje('La ubicación de la mesa es obligatoria', 'error');
      return false;
    }

    if (!mesa.capacidad || mesa.capacidad < 1) {
      this.mostrarMensaje('La capacidad debe ser al menos 1', 'error');
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
