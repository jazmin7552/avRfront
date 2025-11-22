import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

// 📦 Interfaces
interface Producto {
  idProducto?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoriaId: number;
  categoriaNombre?: string;
  estado: boolean;
}

interface Categoria {
  idCategoria: number;
  nombre: string;
}

interface Filtros {
  nombre: string;
  categoriaId: string;
  estado: string;
}

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css'],
})
export class CrearProductoComponent implements OnInit {
  // 📋 Lista de productos
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: Categoria[] = [];

  // 🎯 Producto para crear
  nuevoProducto: Producto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    categoriaId: 0,
    estado: true,
  };

  // ✏️ Producto para editar
  productoEditando: Producto | null = null;

  // 🗑️ Producto para eliminar
  productoEliminar: Producto | null = null;

  // 📊 Producto para gestionar stock
  productoStock: Producto | null = null;
  cantidadStock: number = 1;

  // 🔍 Filtros
  filtros: Filtros = {
    nombre: '',
    categoriaId: '',
    estado: '',
  };

  // 🎨 Estados del componente
  mostrarModalCrear: boolean = false;
  mostrarModalEditar: boolean = false;
  mostrarModalEliminar: boolean = false;
  mostrarModalStock: boolean = false;
  loading: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';

  // 🌐 URLs de API
  private apiProductos =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/productos';
  private apiCategorias =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/categorias';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    console.log('🍽️ Componente Productos iniciado');
    this.cargarCategorias();
    this.cargarProductos();
  }

  // 🔐 Obtener headers con token (si usas autenticación)
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  // 📥 CARGAR Categorías
  cargarCategorias(): void {
    this.http.get<Categoria[]>(this.apiCategorias, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.categorias = data;
        console.log('✅ Categorías cargadas:', data.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        this.mostrarMensaje('Error al cargar las categorías', 'error');
      },
    });
  }

  // 📥 CARGAR Productos
  cargarProductos(): void {
    this.loading = true;
    this.http.get<Producto[]>(this.apiProductos, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.productos = data;
        this.productosFiltrados = data;
        this.loading = false;
        console.log('✅ Productos cargados:', data.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.mostrarMensaje('Error al cargar los productos', 'error');
        this.loading = false;
      },
    });
  }

  get productosActivos(): number {
    return this.productos.filter((p) => p.estado).length;
  }

  get productosStockBajo(): number {
    return this.productos.filter((p) => p.stock < 10).length;
  }

  get valorInventario(): number {
    return this.productos.reduce((total, p) => total + p.precio * p.stock, 0);
  }

  // 🔍 FILTROS
  aplicarFiltros(): void {
    this.productosFiltrados = this.productos.filter((p) => {
      const coincideNombre = this.filtros.nombre
        ? p.nombre.toLowerCase().includes(this.filtros.nombre.toLowerCase())
        : true;

      const coincideCategoria = this.filtros.categoriaId
        ? p.categoriaId.toString() === this.filtros.categoriaId
        : true;

      const coincideEstado = this.filtros.estado
        ? p.estado.toString() === this.filtros.estado
        : true;

      return coincideNombre && coincideCategoria && coincideEstado;
    });

    this.productos = this.productosFiltrados;
  }

  limpiarFiltros(): void {
    this.filtros = {
      nombre: '',
      categoriaId: '',
      estado: '',
    };
    this.cargarProductos();
  }

  verStockBajo(): void {
    this.productos = this.productos.filter((p) => p.stock < 10);
    this.mostrarMensaje('Mostrando productos con stock bajo', 'success');
  }

  // ➕ CREAR Producto
  abrirModalCrear(): void {
    this.nuevoProducto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      categoriaId: 0,
      estado: true,
    };
    this.mostrarModalCrear = true;
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
  }

  crearProducto(): void {
    if (!this.validarProducto(this.nuevoProducto)) return;

    this.loading = true;
    this.http
      .post<Producto>(this.apiProductos, this.nuevoProducto, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          console.log('✅ Producto creado:', response);
          this.mostrarMensaje('Producto creado exitosamente', 'success');
          this.cerrarModalCrear();
          this.cargarProductos();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al crear producto:', error);
          this.mostrarMensaje('Error al crear el producto', 'error');
          this.loading = false;
        },
      });
  }

  // ✏️ EDITAR Producto
  abrirModalEditar(producto: Producto): void {
    this.productoEditando = { ...producto };
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.productoEditando = null;
  }

  actualizarProducto(): void {
    if (!this.productoEditando || !this.validarProducto(this.productoEditando)) return;

    const url = `${this.apiProductos}/${this.productoEditando.idProducto}`;
    this.loading = true;

    this.http.put<Producto>(url, this.productoEditando, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('✅ Producto actualizado:', response);
        this.mostrarMensaje('Producto actualizado exitosamente', 'success');
        this.cerrarModalEditar();
        this.cargarProductos();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al actualizar producto:', error);
        this.mostrarMensaje('Error al actualizar el producto', 'error');
        this.loading = false;
      },
    });
  }

  // 🗑️ ELIMINAR Producto
  abrirModalEliminar(producto: Producto): void {
    this.productoEliminar = producto;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.productoEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.productoEliminar?.idProducto) return;

    const url = `${this.apiProductos}/${this.productoEliminar.idProducto}`;
    this.loading = true;

    this.http.delete(url, { headers: this.getHeaders() }).subscribe({
      next: () => {
        console.log('✅ Producto eliminado');
        this.mostrarMensaje('Producto eliminado exitosamente', 'success');
        this.cerrarModalEliminar();
        this.cargarProductos();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al eliminar producto:', error);
        this.mostrarMensaje('Error al eliminar el producto', 'error');
        this.loading = false;
      },
    });
  }

  // 📊 GESTIONAR Stock
  abrirModalStock(producto: Producto): void {
    this.productoStock = { ...producto };
    this.cantidadStock = 1;
    this.mostrarModalStock = true;
  }

  cerrarModalStock(): void {
    this.mostrarModalStock = false;
    this.productoStock = null;
  }

  ajustarStock(tipo: 'aumentar' | 'reducir'): void {
    if (!this.productoStock) return;

    if (tipo === 'aumentar') {
      this.productoStock.stock += this.cantidadStock;
    } else {
      this.productoStock.stock = Math.max(0, this.productoStock.stock - this.cantidadStock);
    }

    const url = `${this.apiProductos}/${this.productoStock.idProducto}`;
    this.http.put<Producto>(url, this.productoStock, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.mostrarMensaje(
          `Stock ${tipo === 'aumentar' ? 'aumentado' : 'reducido'} exitosamente`,
          'success'
        );
        this.cargarProductos();
      },
      error: (error) => {
        console.error('❌ Error al ajustar stock:', error);
        this.mostrarMensaje('Error al ajustar el stock', 'error');
      },
    });
  }

  // 🔄 TOGGLE Estado
  toggleEstado(producto: Producto): void {
    producto.estado = !producto.estado;
    const url = `${this.apiProductos}/${producto.idProducto}`;

    this.http.put<Producto>(url, producto, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.mostrarMensaje(
          `Producto ${producto.estado ? 'activado' : 'desactivado'} exitosamente`,
          'success'
        );
        this.cargarProductos();
      },
      error: (error) => {
        console.error('❌ Error al cambiar estado:', error);
        this.mostrarMensaje('Error al cambiar el estado', 'error');
        producto.estado = !producto.estado;
      },
    });
  }

  // ✅ VALIDAR Producto
  validarProducto(producto: Producto): boolean {
    if (!producto.nombre.trim()) {
      this.mostrarMensaje('El nombre del producto es obligatorio', 'error');
      return false;
    }

    if (producto.precio <= 0) {
      this.mostrarMensaje('El precio debe ser mayor a 0', 'error');
      return false;
    }

    if (producto.stock < 0) {
      this.mostrarMensaje('El stock no puede ser negativo', 'error');
      return false;
    }

    if (!producto.categoriaId || producto.categoriaId === 0) {
      this.mostrarMensaje('Debe seleccionar una categoría', 'error');
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
