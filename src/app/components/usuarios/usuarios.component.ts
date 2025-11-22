import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

interface Usuario {
  idUsuario?: string;
  nombre: string;
  email: string;
  password?: string;
  rolId: number;
  rolNombre?: string;
}

interface Rol {
  idRol: number;
  nombre: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  usuario: Usuario = {
    nombre: '',
    email: '',
    password: '',
    rolId: 0,
  };

  emailBusqueda: string = '';
  filtroRol: string = '';
  modoEdicion: boolean = false;
  usuarioEditando: Usuario | null = null;
  usuarioEliminar: Usuario | null = null;
  loading: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  mostrarModalEliminar: boolean = false;

  private apiUsuarios =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/usuarios';
  private apiRoles =
    'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/roles';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    console.log('═'.repeat(70));
    console.log('🚀 COMPONENTE USUARIOS INICIADO');
    console.log('═'.repeat(70));
    this.cargarRoles();
    this.cargarUsuarios();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  cargarRoles(): void {
    this.http.get<any>(this.apiRoles, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('📋 RESPUESTA ROLES (RAW):', response);
        console.log('📋 Tipo:', typeof response);
        console.log('📋 Es Array:', Array.isArray(response));

        // Intentar diferentes estructuras
        let rolesData = response;
        if (response.data) rolesData = response.data;
        if (response.roles) rolesData = response.roles;
        if (response.resultado) rolesData = response.resultado;

        this.roles = rolesData;
        console.log('✅ Roles procesados:', this.roles);
      },
      error: (error) => {
        console.error('❌ Error roles:', error);
      },
    });
  }

  cargarUsuarios(): void {
    console.log('━'.repeat(70));
    console.log('👥 CARGANDO USUARIOS...');
    console.log('🌐 URL:', this.apiUsuarios);
    console.log('🔑 Token:', localStorage.getItem('token') ? 'Existe ✅' : 'NO existe ❌');
    console.log('━'.repeat(70));

    this.loading = true;

    // 🔥 IMPORTANTE: Capturamos la respuesta SIN tipo para ver qué llega
    this.http.get<any>(this.apiUsuarios, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('📦 RESPUESTA COMPLETA (RAW):');
        console.log(response);
        console.log('');
        console.log('🔍 ANÁLISIS DE LA RESPUESTA:');
        console.log('   Tipo:', typeof response);
        console.log('   Es Array:', Array.isArray(response));
        console.log('   Keys:', Object.keys(response));
        console.log('');

        // 🎯 Intentar extraer datos de diferentes estructuras posibles
        let usuariosData: any[] = [];

        if (Array.isArray(response)) {
          console.log('✅ Respuesta es un array directo');
          usuariosData = response;
        } else if (response.data && Array.isArray(response.data)) {
          console.log('✅ Respuesta tiene propiedad "data"');
          usuariosData = response.data;
        } else if (response.usuarios && Array.isArray(response.usuarios)) {
          console.log('✅ Respuesta tiene propiedad "usuarios"');
          usuariosData = response.usuarios;
        } else if (response.resultado && Array.isArray(response.resultado)) {
          console.log('✅ Respuesta tiene propiedad "resultado"');
          usuariosData = response.resultado;
        } else if (response.results && Array.isArray(response.results)) {
          console.log('✅ Respuesta tiene propiedad "results"');
          usuariosData = response.results;
        } else {
          console.error('❌ NO SE PUDO EXTRAER ARRAY DE USUARIOS');
          console.log('📛 Estructura desconocida:', response);
        }

        console.log('');
        console.log('📊 USUARIOS EXTRAÍDOS:', usuariosData.length);

        if (usuariosData.length > 0) {
          console.log('👤 PRIMER USUARIO (estructura):');
          console.log(usuariosData[0]);
          console.log('');
          console.log('🔑 Campos del primer usuario:', Object.keys(usuariosData[0]));

          // Mapear campos si es necesario
          this.usuarios = usuariosData.map((u: any) => ({
            idUsuario: u.idUsuario || u.id_usuario || u.id || u.IdUsuario,
            nombre: u.nombre || u.name || u.Nombre,
            email: u.email || u.correo || u.Email,
            password: u.password,
            rolId: u.rolId || u.rol_id || u.idRol || u.RolId,
            rolNombre: u.rolNombre || u.rol_nombre || u.nombreRol || u.RolNombre,
          }));

          console.log('✅ Usuarios mapeados correctamente:', this.usuarios.length);
          console.log('👤 Primer usuario mapeado:', this.usuarios[0]);
        } else {
          console.warn('⚠️ ARRAY VACÍO - No hay usuarios en la base de datos');
          this.mostrarMensaje('No hay usuarios registrados', 'error');
        }

        this.loading = false;
        console.log('═'.repeat(70));
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR USUARIOS:');
        console.error('   Status:', error.status);
        console.error('   StatusText:', error.statusText);
        console.error('   Message:', error.message);
        console.error('   Error completo:', error);
        console.error('   Response:', error.error);
        console.log('═'.repeat(70));

        let mensajeError = 'Error al cargar usuarios';

        if (error.status === 401) {
          mensajeError = 'Sesión expirada - Vuelve a iniciar sesión';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else if (error.status === 0) {
          mensajeError = 'No se puede conectar con el servidor';
        } else if (error.status === 404) {
          mensajeError = 'Endpoint no encontrado';
        } else if (error.status === 500) {
          mensajeError = 'Error en el servidor';
        }

        this.mostrarMensaje(mensajeError, 'error');
        this.loading = false;
      },
    });
  }

  guardarUsuario(): void {
    if (!this.validarUsuario()) return;
    this.loading = true;
    if (this.modoEdicion && this.usuarioEditando) {
      this.actualizarUsuario();
    } else {
      this.crearUsuario();
    }
  }

  crearUsuario(): void {
    console.log('➕ Creando usuario:', this.usuario);
    this.http.post<any>(this.apiUsuarios, this.usuario, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('✅ Usuario creado (respuesta):', response);
        this.mostrarMensaje('Usuario creado exitosamente', 'success');
        this.limpiarFormulario();
        this.cargarUsuarios();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al crear:', error);
        this.mostrarMensaje(error.error?.message || 'Error al crear el usuario', 'error');
        this.loading = false;
      },
    });
  }

  actualizarUsuario(): void {
    if (!this.usuarioEditando?.idUsuario) return;
    const url = `${this.apiUsuarios}/${this.usuarioEditando.idUsuario}`;
    const usuarioData = { ...this.usuario };
    if (!usuarioData.password || usuarioData.password.trim() === '') {
      delete usuarioData.password;
    }
    this.http.put<any>(url, usuarioData, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('✅ Usuario actualizado:', response);
        this.mostrarMensaje('Usuario actualizado exitosamente', 'success');
        this.limpiarFormulario();
        this.cargarUsuarios();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al actualizar:', error);
        this.mostrarMensaje(error.error?.message || 'Error al actualizar el usuario', 'error');
        this.loading = false;
      },
    });
  }

  editarUsuario(user: Usuario): void {
    this.modoEdicion = true;
    this.usuarioEditando = { ...user };
    this.usuario = {
      nombre: user.nombre,
      email: user.email,
      password: '',
      rolId: user.rolId,
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  limpiarFormulario(): void {
    this.usuario = {
      nombre: '',
      email: '',
      password: '',
      rolId: 0,
    };
    this.modoEdicion = false;
    this.usuarioEditando = null;
  }

  abrirModalEliminar(user: Usuario): void {
    this.usuarioEliminar = user;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.usuarioEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.usuarioEliminar?.idUsuario) return;
    this.loading = true;
    const url = `${this.apiUsuarios}/${this.usuarioEliminar.idUsuario}`;
    this.http.delete(url, { headers: this.getHeaders() }).subscribe({
      next: () => {
        console.log('✅ Usuario eliminado');
        this.mostrarMensaje('Usuario eliminado exitosamente', 'success');
        this.cerrarModalEliminar();
        this.cargarUsuarios();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al eliminar:', error);
        this.mostrarMensaje(error.error?.message || 'Error al eliminar el usuario', 'error');
        this.loading = false;
      },
    });
  }

  buscarPorEmail(): void {
    if (!this.emailBusqueda.trim()) {
      this.cargarUsuarios();
      return;
    }
    const resultado = this.usuarios.filter((u) =>
      u.email.toLowerCase().includes(this.emailBusqueda.toLowerCase())
    );
    if (resultado.length > 0) {
      this.usuarios = resultado;
    } else {
      this.mostrarMensaje('No se encontraron usuarios', 'error');
      this.cargarUsuarios();
    }
  }

  filtrarPorRol(): void {
    if (!this.filtroRol) {
      this.cargarUsuarios();
      return;
    }
    const url = `${this.apiUsuarios}/rol/${this.filtroRol}`;
    this.loading = true;
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('🔍 Filtrar por rol - respuesta:', response);
        let usuariosData = Array.isArray(response)
          ? response
          : response.data || response.usuarios || [];
        this.usuarios = usuariosData;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al filtrar:', error);
        this.loading = false;
      },
    });
  }

  validarUsuario(): boolean {
    if (!this.usuario.nombre.trim()) {
      this.mostrarMensaje('El nombre es obligatorio', 'error');
      return false;
    }
    if (!this.usuario.email.trim()) {
      this.mostrarMensaje('El email es obligatorio', 'error');
      return false;
    }
    if (!this.modoEdicion && !this.usuario.password) {
      this.mostrarMensaje('La contraseña es obligatoria', 'error');
      return false;
    }
    if (!this.usuario.rolId || this.usuario.rolId === 0) {
      this.mostrarMensaje('Debe seleccionar un rol', 'error');
      return false;
    }
    return true;
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = '';
      this.tipoMensaje = '';
    }, 4000);
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard-admin']);
  }
}
