import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { RolService } from '../../services/rol.service';
import { Rol } from '../../models/rol.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [RolService],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css'],
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  nuevoRol: Rol = { nombre: '' };
  rolEditando: Rol | null = null;
  rolEliminar: Rol | null = null;
  loading: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  totalUsuarios: number = 0;
  mostrarModalCrear: boolean = false;
  mostrarModalEditar: boolean = false;
  mostrarModalEliminar: boolean = false;

  constructor(private rolService: RolService, private router: Router) {}

  ngOnInit(): void {
    console.log('🍽️ Componente Roles iniciado');
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.loading = true;
    this.mensaje = '';

    this.rolService.obtenerRoles().subscribe({
      next: (data: Rol[]) => {
        console.log('✅ Roles recibidos:', data);
        this.roles = data || [];
        this.calcularEstadisticas();
        this.loading = false;

        if (this.roles.length === 0) {
          this.mostrarMensaje('No hay roles disponibles', 'error');
        }
      },
      error: (error: string) => {
        console.error('❌ Error al cargar roles:', error);
        this.mostrarMensaje(error || 'Error al cargar los roles', 'error');
        this.roles = [];
        this.loading = false;
      },
    });
  }

  calcularEstadisticas(): void {
    this.totalUsuarios = this.roles.reduce((sum, rol) => sum + (rol.cantidadUsuarios || 0), 0);
  }

  crearRol(): void {
    if (!this.nuevoRol.nombre.trim()) {
      this.mostrarMensaje('Por favor ingresa el nombre del rol', 'error');
      return;
    }

    this.loading = true;

    this.rolService.crearRol(this.nuevoRol).subscribe({
      next: (response: Rol) => {
        console.log('✅ Rol creado:', response);
        this.mostrarMensaje('Rol creado exitosamente', 'success');
        this.cerrarModalCrear();
        this.cargarRoles();
        this.loading = false;
      },
      error: (error: string) => {
        console.error('❌ Error al crear rol:', error);
        this.mostrarMensaje(error || 'Error al crear el rol', 'error');
        this.loading = false;
      },
    });
  }

  actualizarRol(): void {
    if (!this.rolEditando || !this.rolEditando.idRol) {
      this.mostrarMensaje('Error: No hay rol para editar', 'error');
      return;
    }

    if (!this.rolEditando.nombre.trim()) {
      this.mostrarMensaje('Por favor ingresa el nombre del rol', 'error');
      return;
    }

    this.loading = true;

    this.rolService
      .actualizarRol(this.rolEditando.idRol, { nombre: this.rolEditando.nombre })
      .subscribe({
        next: (response: Rol) => {
          console.log('✅ Rol actualizado:', response);
          this.mostrarMensaje('Rol actualizado exitosamente', 'success');
          this.cerrarModalEditar();
          this.cargarRoles();
          this.loading = false;
        },
        error: (error: string) => {
          console.error('❌ Error al actualizar rol:', error);
          this.mostrarMensaje(error || 'Error al actualizar el rol', 'error');
          this.loading = false;
        },
      });
  }

  confirmarEliminar(): void {
    if (!this.rolEliminar || !this.rolEliminar.idRol) {
      this.mostrarMensaje('Error: No hay rol para eliminar', 'error');
      return;
    }

    this.loading = true;

    this.rolService.eliminarRol(this.rolEliminar.idRol).subscribe({
      next: () => {
        console.log('✅ Rol eliminado');
        this.mostrarMensaje('Rol eliminado exitosamente', 'success');
        this.cerrarModalEliminar();
        this.cargarRoles();
        this.loading = false;
      },
      error: (error: string) => {
        console.error('❌ Error al eliminar rol:', error);
        this.mostrarMensaje(error || 'Error al eliminar el rol', 'error');
        this.loading = false;
      },
    });
  }

  abrirModalCrear(): void {
    this.nuevoRol = { nombre: '' };
    this.mensaje = '';
    this.mostrarModalCrear = true;
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
    this.nuevoRol = { nombre: '' };
  }

  abrirModalEditar(rol: Rol): void {
    this.rolEditando = { ...rol };
    this.mensaje = '';
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.rolEditando = null;
  }

  abrirModalEliminar(rol: Rol): void {
    this.rolEliminar = rol;
    this.mensaje = '';
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.rolEliminar = null;
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;

    setTimeout(() => {
      this.mensaje = '';
      this.tipoMensaje = '';
    }, 5000);
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard-admin']);
  }
}
