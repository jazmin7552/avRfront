import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductoService } from '../../../services/producto.service';
import { ComandaService } from '../../../services/comanda.service';
import { MesaService } from '../../../services/mesa.service';
import { CategoriaService, Categoria } from '../../../services/categoria.service';
import { Producto } from '../../../models/producto.model';
import { Mesa } from '../../../models/mesa.model';
import { AuthService } from '../../../services/auth.service';

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
  observaciones?: string;
}

@Component({
  selector: 'app-tomar-comanda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tomar-comanda.component.html',
  styleUrls: ['./tomar-comanda.component.css'],
})
export class TomarComandaComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  productosFiltrados: Producto[] = [];
  carrito: ItemCarrito[] = [];
  idMesa: number | null = null;
  mesa: Mesa | null = null;
  mesaNumero: string = '';
  categoriaSeleccionada: number | null = null;
  busqueda: string = '';
  loading: boolean = true;
  total: number = 0;
  mostrarModalObservaciones: boolean = false;
  itemEditando: ItemCarrito | null = null;
  observacionesTemporal: string = '';
  meseroNombre: string = '';
  cocineros: any[] = [];
  cocineroSeleccionado: string = '';
  mostrarModalConfirmacion: boolean = false;

  constructor(
    private productoService: ProductoService,
    private comandaService: ComandaService,
    private mesaService: MesaService,
    private categoriaService: CategoriaService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.meseroNombre = this.obtenerNombreMesero();
    this.cargarCocineros();
    this.route.params.subscribe((params) => {
      if (params['idMesa']) {
        this.idMesa = +params['idMesa'];
        this.cargarMesa();
      } else {
        alert('Debe seleccionar una mesa primero');
        this.router.navigate(['/mesero/dashboard']);
      }
    });
    this.cargarDatos();
  }

  cargarMesa(): void {
    if (!this.idMesa) return;
    this.mesaService.getById(this.idMesa).subscribe({
      next: (mesa: Mesa) => {
        this.mesa = mesa;
        this.mesaNumero = mesa.numeroMesa || `Mesa ${this.idMesa}`;
      },
      error: (err) => {
        console.error('Error al cargar mesa:', err);
        alert('Error al cargar la mesa');
        this.router.navigate(['/mesero/dashboard']);
      },
    });
  }

  cargarDatos(): void {
    this.loading = true;
    this.categoriaService.getAll().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      },
    });
    this.productoService.getAll().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.productosFiltrados = productos;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.loading = false;
      },
    });
  }

  cargarCocineros(): void {
    this.authService.getAllUsuarios().subscribe({
      next: (usuarios) => {
        this.cocineros = usuarios.filter(
          (u: any) => u.rol === 'COCINERO' || u.rolId === 3 || u.rolNombre === 'COCINERO'
        );
        console.log('✅ Cocineros cargados:', this.cocineros);
        if (this.cocineros.length === 0) {
          console.warn('⚠️ No se encontraron cocineros');
          alert('No hay cocineros disponibles. Contacta al administrador.');
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar usuarios:', err);
        alert('No se pudieron cargar los cocineros. Contacta al administrador.');
      },
    });
  }

  filtrarPorCategoria(idCategoria: number | null | undefined): void {
    this.categoriaSeleccionada = idCategoria || null;
    this.aplicarFiltros();
  }

  buscarProducto(): void {
    this.aplicarFiltros();
  }

  enviarComanda(): void {
    if (!this.idMesa || !this.mesa) return;

    const idMesero = this.obtenerIdMesero();
    if (!idMesero) return;

    // ✅ PRIMERO: Cambiar la mesa a OCUPADA (estado 2)
    this.mesaService.cambiarEstado(this.idMesa!, 2).subscribe({
      next: () => {
        console.log('✅ Mesa cambiada a OCUPADA');

        // ✅ LUEGO: Crear la comanda
        const comandaData = {
          idComanda: 0,
          fecha: new Date().toISOString(),
          mesaId: this.idMesa!,
          mesaUbicacion: this.mesa!.numeroMesa || `Mesa ${this.idMesa}`,
          meseroId: String(idMesero),
          meseroNombre: this.obtenerNombreMesero(),
          cocineroId: this.cocineroSeleccionado ? String(this.cocineroSeleccionado) : '',
          cocineroNombre: this.cocineroSeleccionado ? this.obtenerNombreCocinero() : '',
          estadoId: 4, // PENDIENTE (comanda)
          estadoNombre: 'PENDIENTE',
          detalles: this.carrito.map((item) => ({
            idDetalleComanda: 0,
            comandaId: 0,
            productoId: item.producto.idProducto!,
            productoNombre: item.producto.nombre,
            precioUnitario: item.producto.precio,
            cantidad: item.cantidad,
            subtotal: item.subtotal,
          })),
          total: this.total,
        };

        console.log('📤 Enviando comanda:', comandaData);

        this.comandaService.create(comandaData as any).subscribe({
          next: () => {
            console.log('✅ Comanda creada exitosamente');
            alert('¡Comanda enviada exitosamente! ✅');
            this.router.navigate(['/mesero/dashboard']);
          },
          error: (err) => {
            console.error('❌ Error al crear comanda:', err);

            // ❌ Si falla la comanda, revertir la mesa a DISPONIBLE
            this.mesaService.cambiarEstado(this.idMesa!, 1).subscribe({
              next: () => console.log('Mesa revertida a DISPONIBLE'),
              error: (err2) => console.error('Error al revertir mesa:', err2),
            });

            alert(`Error al enviar la comanda: ${err.error?.message || 'Error desconocido'}`);
          },
        });
      },
      error: (err) => {
        console.error('❌ Error al cambiar estado mesa:', err);
        alert('Error al ocupar la mesa. No se puede crear la comanda.');
      },
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.productos];
    if (this.categoriaSeleccionada) {
      resultado = resultado.filter((p) => p.idCategoria === this.categoriaSeleccionada);
    }
    if (this.busqueda.trim()) {
      const termino = this.busqueda.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          p.nombre.toLowerCase().includes(termino) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(termino))
      );
    }
    this.productosFiltrados = resultado;
  }

  agregarAlCarrito(producto: Producto): void {
    const itemExistente = this.carrito.find(
      (item) => item.producto.idProducto === producto.idProducto
    );
    if (itemExistente) {
      itemExistente.cantidad++;
      itemExistente.subtotal = itemExistente.cantidad * itemExistente.producto.precio;
    } else {
      this.carrito.push({ producto, cantidad: 1, subtotal: producto.precio, observaciones: '' });
    }
    this.calcularTotal();
  }

  aumentarCantidad(item: ItemCarrito): void {
    item.cantidad++;
    item.subtotal = item.cantidad * item.producto.precio;
    this.calcularTotal();
  }

  disminuirCantidad(item: ItemCarrito): void {
    if (item.cantidad > 1) {
      item.cantidad--;
      item.subtotal = item.cantidad * item.producto.precio;
      this.calcularTotal();
    }
  }

  eliminarDelCarrito(item: ItemCarrito): void {
    const index = this.carrito.indexOf(item);
    if (index > -1) {
      this.carrito.splice(index, 1);
      this.calcularTotal();
    }
  }

  abrirModalObservaciones(item: ItemCarrito): void {
    this.itemEditando = item;
    this.observacionesTemporal = item.observaciones || '';
    this.mostrarModalObservaciones = true;
  }

  guardarObservaciones(): void {
    if (this.itemEditando) {
      this.itemEditando.observaciones = this.observacionesTemporal;
    }
    this.cerrarModalObservaciones();
  }

  cerrarModalObservaciones(): void {
    this.mostrarModalObservaciones = false;
    this.itemEditando = null;
    this.observacionesTemporal = '';
  }

  calcularTotal(): void {
    this.total = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
  }

  obtenerIdMesero(): string {
    const id = this.authService.getIdUsuario();
    if (!id) {
      console.error('❌ No se pudo obtener el ID del mesero');
      alert('Error: No se encontró la sesión del usuario.');
      return '';
    }
    return id;
  }

  obtenerNombreMesero(): string {
    const usuario = this.authService.getUsuario();
    return usuario?.nombre || 'Mesero';
  }

  cancelar(): void {
    if (this.carrito.length > 0) {
      if (confirm('¿Cancelar? Se perderán los productos agregados.')) {
        this.router.navigate(['/mesero/dashboard']);
      }
    } else {
      this.router.navigate(['/mesero/dashboard']);
    }
  }

  limpiarCarrito(): void {
    if (confirm('¿Limpiar el carrito?')) {
      this.carrito = [];
      this.calcularTotal();
    }
  }

  prepararEnvioComanda(): void {
    if (this.carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    this.mostrarModalConfirmacion = true;
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
  }

  confirmarEnvioComanda(): void {
    this.mostrarModalConfirmacion = false;
    this.enviarComanda();
  }

  obtenerNombreCocinero(): string {
    const cocinero = this.cocineros.find(
      (c) => String(c.idUsuario) === String(this.cocineroSeleccionado)
    );
    return cocinero ? cocinero.nombre || cocinero.nombreCompleto || '' : '';
  }
}
