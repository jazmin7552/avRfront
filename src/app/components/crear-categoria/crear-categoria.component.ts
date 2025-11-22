import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriaService, Categoria } from '../../services/categoria.service';

@Component({
  selector: 'app-crear-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-categoria.component.html',
  styleUrls: ['./crear-categoria.component.css'],
})
export class CrearCategoriaComponent implements OnInit {
  // 📝 Modelo del formulario
  categoria: Categoria = {
    nombre: '',
    descripcion: '',
  };

  // 📋 Lista de categorías
  categorias: Categoria[] = [];

  // 🎯 Estado del componente
  modoEdicion: boolean = false;
  categoriaEditando: Categoria | null = null;
  loading: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';

  constructor(private categoriaService: CategoriaService, private router: Router) {}

  ngOnInit(): void {
    console.log('🍽️ Componente Crear Categoría iniciado');
    this.cargarCategorias();
  }

  // 📥 CARGAR todas las categorías
  cargarCategorias(): void {
    this.loading = true;
    this.categoriaService.getAll().subscribe({
      next: (data) => {
        console.log('📦 Datos RAW recibidos:', data);
        data.forEach((cat) => {
          console.log(
            `Categoría: ${cat.nombre}, ID: ${cat.idCategoria}, Tipo: ${typeof cat.idCategoria}`
          );
        });

        this.categorias = data;
        this.loading = false;
        console.log('✅ Categorías cargadas:', data.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        this.mostrarMensaje('Error al cargar las categorías', 'error');
        this.loading = false;
      },
    });
  }

  // ➕ CREAR nueva categoría
  guardarCategoria(): void {
    // Validación
    if (!this.categoria.nombre.trim()) {
      this.mostrarMensaje('El nombre de la categoría es obligatorio', 'error');
      return;
    }

    this.loading = true;

    if (this.modoEdicion && this.categoriaEditando?.idCategoria) {
      // ACTUALIZAR categoría existente
      this.actualizarCategoria();
    } else {
      // CREAR nueva categoría
      this.categoriaService.create(this.categoria).subscribe({
        next: (response) => {
          console.log('✅ Categoría creada:', response);
          this.mostrarMensaje('Categoría creada exitosamente', 'success');
          this.limpiarFormulario();
          this.cargarCategorias();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al crear categoría:', error);
          this.mostrarMensaje('Error al crear la categoría', 'error');
          this.loading = false;
        },
      });
    }
  }

  // ✏️ ACTUALIZAR categoría
  actualizarCategoria(): void {
    if (!this.categoriaEditando?.idCategoria) return; // 👈 CAMBIAR

    this.categoriaService.update(this.categoriaEditando.idCategoria, this.categoria).subscribe({
      next: (response) => {
        console.log('✅ Categoría actualizada:', response);
        this.mostrarMensaje('Categoría actualizada exitosamente', 'success');
        this.limpiarFormulario();
        this.cargarCategorias();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al actualizar categoría:', error);
        this.mostrarMensaje('Error al actualizar la categoría', 'error');
        this.loading = false;
      },
    });
  }

  // ✏️ Preparar edición
  editarCategoria(cat: Categoria): void {
    this.modoEdicion = true;
    this.categoriaEditando = { ...cat };
    this.categoria = { ...cat };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 🗑️ ELIMINAR categoría
  eliminarCategoria(id: number): void {
    console.log('🗑️ ID recibido para eliminar:', id); // 👈 AGREGA ESTO
    console.log('Tipo de ID:', typeof id); // 👈 Y ESTO

    if (!id || id === undefined) {
      console.error('❌ ID es undefined o null');
      this.mostrarMensaje('Error: ID de categoría no válido', 'error');
      return;
    }

    const confirmar = confirm('¿Estás seguro de eliminar esta categoría?');
    if (!confirmar) return;

    this.loading = true;
    this.categoriaService.delete(id).subscribe({
      next: () => {
        console.log('✅ Categoría eliminada');
        this.mostrarMensaje('Categoría eliminada exitosamente', 'success');
        this.cargarCategorias();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al eliminar categoría:', error);
        this.mostrarMensaje('Error al eliminar la categoría', 'error');
        this.loading = false;
      },
    });
  }

  // 🧹 Limpiar formulario
  limpiarFormulario(): void {
    this.categoria = {
      nombre: '',
      descripcion: '',
    };
    this.modoEdicion = false;
    this.categoriaEditando = null;
  }

  // 💬 Mostrar mensajes
  mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = '';
      this.tipoMensaje = '';
    }, 3000);
  }

  // 🔙 Volver al dashboard
  volverAlDashboard(): void {
    this.router.navigate(['/dashboard-admin']);
  }
}
