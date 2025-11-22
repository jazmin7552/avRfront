import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

// 📦 Interfaces
interface DetalleComanda {
  idDetalleComanda?: number;
  comandaId: number;
  productoId: number;
  productoNombre?: string;
  precioUnitario?: number;
  cantidad: number;
  subtotal?: number;
}

interface Producto {
  idProducto: number;
  nombre: string;
  precio: number;
  categoria?: string;
}

interface Comanda {
  idComanda: number;
  fecha?: string;
  mesaId: number;
  mesaUbicacion?: string;
  meseroId: string;
  meseroNombre?: string;
  cocineroId: string;
  cocineroNombre?: string;
  estadoId: number;
  estadoNombre?: string;
  total?: number;
}

interface Filtros {
  comandaId: string;
  productoId: string;
}

@Component({
  selector: 'app-detalle-comanda',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './detalle-comanda.component.html',
  styleUrls: ['./detalle-comanda.component.css'],
})
export class DetalleComandaComponent implements OnInit {
  // 📋 Listas principales
  detalles: DetalleComanda[] = [];
  detallesFiltrados: DetalleComanda[] = [];

  // 📋 Listas para ComboBox
  productos: Producto[] = [];
  comandas: Comanda[] = [];

  // 🎯 Objetos para modales
  nuevoDetalle: DetalleComanda = {
    comandaId: 0,
    productoId: 0,
    cantidad: 1,
  };

  detalleEditando: DetalleComanda | null = null;
  detalleEliminar: DetalleComanda | null = null;

  // 🔍 Filtros
  filtros: Filtros = {
    comandaId: '',
    productoId: '',
  };

  // 🎨 Estados
  mostrarModalCrear: boolean = false;
  mostrarModalEditar: boolean = false;
  mostrarModalEliminar: boolean = false;
  loading: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';

  // 🌐 URLs API
  private apiUrl =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/detalles-comanda';
  private apiProductos =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/productos';
  private apiComandas =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/comandas';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    console.log('🍽️ Componente Detalle Comanda iniciado');
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
    this.cargarProductos();
    this.cargarComandas();
    this.cargarDetalles();
  }

  // 📥 CARGAR Productos
  cargarProductos(): void {
    this.http.get<Producto[]>(this.apiProductos, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.productos = data;
        console.log('✅ Productos cargados:', data.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.mostrarMensaje('Error al cargar los productos', 'error');
      },
    });
  }

  // 📥 CARGAR Comandas
  cargarComandas(): void {
    this.http.get<Comanda[]>(this.apiComandas, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.comandas = data;
        console.log('✅ Comandas cargadas:', data.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar comandas:', error);
        this.mostrarMensaje('Error al cargar las comandas', 'error');
      },
    });
  }

  // 📥 CARGAR Detalles
  cargarDetalles(): void {
    this.http.get<DetalleComanda[]>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        console.log('📥 Detalles recibidos del backend:', data);
        this.detalles = data;
        this.detallesFiltrados = data;
        this.loading = false;
        console.log('✅ Detalles cargados:', data.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar detalles:', error);
        this.mostrarMensaje('Error al cargar los detalles', 'error');
        this.loading = false;
      },
    });
  }

  // 📊 Estadísticas calculadas
  get totalVentas(): number {
    if (!this.detalles || this.detalles.length === 0) return 0;
    return this.detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);
  }

  get productosUnicos(): number {
    if (!this.detalles || this.detalles.length === 0) return 0;
    const uniqueProducts = new Set(this.detalles.map((d) => d.productoId));
    return uniqueProducts.size;
  }

  get promedioVenta(): number {
    if (!this.detalles || this.detalles.length === 0) return 0;
    return this.totalVentas / this.detalles.length;
  }

  // 🎨 Métodos auxiliares
  getNombreProducto(productoId: number): string {
    const producto = this.productos.find((p) => p.idProducto === productoId);
    return producto ? producto.nombre : '-';
  }

  getNombreComanda(comandaId: number): string {
    const comanda = this.comandas.find((c) => c.idComanda === comandaId);
    if (!comanda) return `Comanda #${comandaId}`;
    return `Comanda #${comandaId} - ${comanda.mesaUbicacion || 'Mesa ' + comanda.mesaId}`;
  }

  getPrecioProducto(productoId: number): number {
    const producto = this.productos.find((p) => p.idProducto === productoId);
    return producto ? producto.precio : 0;
  }

  // 🔍 FILTROS - Siguiendo el patrón de Mesa
  aplicarFiltros(): void {
    if (!this.detallesFiltrados || this.detallesFiltrados.length === 0) {
      this.cargarDetalles();
      return;
    }

    this.detalles = this.detallesFiltrados.filter((d) => {
      const coincideComanda = this.filtros.comandaId
        ? d.comandaId.toString() === this.filtros.comandaId
        : true;

      const coincideProducto = this.filtros.productoId
        ? d.productoId.toString() === this.filtros.productoId
        : true;

      return coincideComanda && coincideProducto;
    });

    console.log('🔍 Filtros aplicados. Detalles encontrados:', this.detalles.length);
  }

  limpiarFiltros(): void {
    this.filtros = { comandaId: '', productoId: '' };
    this.cargarDetalles();
  }

  // 🧮 Calcular Subtotal
  calcularSubtotalCrear(): void {
    const precio = this.getPrecioProducto(this.nuevoDetalle.productoId);
    this.nuevoDetalle.precioUnitario = precio;
    this.nuevoDetalle.subtotal = this.nuevoDetalle.cantidad * precio;
  }

  calcularSubtotalEditar(): void {
    if (!this.detalleEditando) return;
    const precio = this.getPrecioProducto(this.detalleEditando.productoId);
    this.detalleEditando.precioUnitario = precio;
    this.detalleEditando.subtotal = this.detalleEditando.cantidad * precio;
  }

  onProductoChangeCrear(): void {
    this.calcularSubtotalCrear();
  }

  onCantidadChangeCrear(): void {
    this.calcularSubtotalCrear();
  }

  onProductoChangeEditar(): void {
    this.calcularSubtotalEditar();
  }

  onCantidadChangeEditar(): void {
    this.calcularSubtotalEditar();
  }

  // ➕ CREAR Detalle
  abrirModalCrear(): void {
    this.nuevoDetalle = {
      comandaId: 0,
      productoId: 0,
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0,
    };
    this.mostrarModalCrear = true;
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
  }

  crearDetalle(): void {
    if (!this.validarDetalle(this.nuevoDetalle)) return;

    this.loading = true;

    // Preparar datos para enviar
    const detalleParaEnviar = {
      comandaId: this.nuevoDetalle.comandaId,
      productoId: this.nuevoDetalle.productoId,
      cantidad: this.nuevoDetalle.cantidad,
    };

    console.log('📤 Enviando detalle:', detalleParaEnviar);

    this.http
      .post<DetalleComanda>(this.apiUrl, detalleParaEnviar, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          console.log('✅ Detalle creado:', response);
          this.mostrarMensaje('Detalle creado exitosamente', 'success');
          this.cerrarModalCrear();

          this.filtros = { comandaId: '', productoId: '' };
          this.cargarDetalles();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al crear detalle:', error);
          this.mostrarMensaje(
            'Error al crear el detalle: ' + (error.error?.message || error.message),
            'error'
          );
          this.loading = false;
        },
      });
  }

  // ✏️ EDITAR Detalle
  abrirModalEditar(detalle: DetalleComanda): void {
    this.detalleEditando = { ...detalle };
    // Calcular precio y subtotal actuales
    this.calcularSubtotalEditar();
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.detalleEditando = null;
  }

  actualizarDetalle(): void {
    if (!this.detalleEditando || !this.validarDetalle(this.detalleEditando)) return;

    const url = `${this.apiUrl}/${this.detalleEditando.idDetalleComanda}`;
    this.loading = true;

    const detalleParaEnviar = {
      comandaId: this.detalleEditando.comandaId,
      productoId: this.detalleEditando.productoId,
      cantidad: this.detalleEditando.cantidad,
    };

    this.http
      .put<DetalleComanda>(url, detalleParaEnviar, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          console.log('✅ Detalle actualizado:', response);
          this.mostrarMensaje('Detalle actualizado exitosamente', 'success');
          this.cerrarModalEditar();

          this.filtros = { comandaId: '', productoId: '' };
          this.cargarDetalles();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al actualizar detalle:', error);
          this.mostrarMensaje(
            'Error al actualizar el detalle: ' + (error.error?.message || error.message),
            'error'
          );
          this.loading = false;
        },
      });
  }

  // 🗑️ ELIMINAR Detalle
  abrirModalEliminar(detalle: DetalleComanda): void {
    this.detalleEliminar = detalle;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.detalleEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.detalleEliminar?.idDetalleComanda) {
      console.error('❌ No hay ID de detalle para eliminar');
      return;
    }

    // Probar diferentes formatos de URL según el backend
    const url = `${this.apiUrl}/${this.detalleEliminar.idDetalleComanda}`;

    console.log('🗑️ Intentando eliminar detalle con URL:', url);
    console.log('🗑️ ID del detalle:', this.detalleEliminar.idDetalleComanda);

    this.loading = true;

    this.http.delete(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('✅ Detalle eliminado, respuesta:', response);
        this.mostrarMensaje('Detalle eliminado exitosamente', 'success');
        this.cerrarModalEliminar();

        this.filtros = { comandaId: '', productoId: '' };
        this.cargarDetalles();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al eliminar detalle:', error);
        console.error('❌ URL intentada:', url);
        console.error('❌ Status:', error.status);
        console.error('❌ Error completo:', error.error);

        // Si es 404, mostrar mensaje específico
        if (error.status === 404) {
          this.mostrarMensaje(
            'El detalle no existe o ya fue eliminado. Recargando lista...',
            'error'
          );
          this.cargarDetalles();
        } else {
          this.mostrarMensaje(
            'Error al eliminar el detalle: ' + (error.error?.message || error.message),
            'error'
          );
        }

        this.loading = false;
      },
    });
  }

  // ✅ VALIDAR Detalle
  validarDetalle(detalle: DetalleComanda): boolean {
    if (!detalle.comandaId || detalle.comandaId === 0) {
      this.mostrarMensaje('Debe seleccionar una comanda', 'error');
      return false;
    }

    if (!detalle.productoId || detalle.productoId === 0) {
      this.mostrarMensaje('Debe seleccionar un producto', 'error');
      return false;
    }

    if (!detalle.cantidad || detalle.cantidad < 1) {
      this.mostrarMensaje('La cantidad debe ser al menos 1', 'error');
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
