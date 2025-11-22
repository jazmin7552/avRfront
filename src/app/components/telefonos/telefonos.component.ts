import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Telefono {
  idTelefono?: number;
  numero: string;
  usuarioNombre?: string;
  usuarios?: Usuario[];
}

interface Usuario {
  idUsuario?: string;
  nombre: string;
  email: string;
  rol?: string;
}

@Component({
  selector: 'app-telefonos',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './telefonos.component.html',
  styleUrls: ['./telefonos.component.css'],
})
export class TelefonosComponent implements OnInit {
  // 📋 Lista de teléfonos
  telefonos: Telefono[] = [];
  usuarios: Usuario[] = []; // ✅ NUEVO - Lista de usuarios

  // 📝 Modelo del formulario
  telefono: any = {
    numero: '',
    usuarioId: '' // ✅ NUEVO - ID del usuario a asociar
  };

  // 🔍 Búsqueda
  numeroBusqueda: string = '';
  busquedaUsuario: string = '';

  // ✏️ Teléfono en edición
  modoEdicion: boolean = false;
  telefonoEditando: Telefono | null = null;

  // 🗑️ Teléfono a eliminar
  telefonoEliminar: Telefono | null = null;

  // 🎯 Estado del componente
  loading: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';

  // 🎭 Control de modal
  mostrarModalEliminar: boolean = false;

  // 🌐 URLs de API
  private apiUrl = 'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/telefonos';
  private apiUsuarios = 'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/usuarios';

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    console.log('📱 Componente Teléfonos iniciado');
    this.cargarUsuarios();
    this.cargarTelefonos(); // ✅ VOLVER A ACTIVAR la carga automática
  }

  // 🔐 Obtener headers con token JWT
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  // 📥 CARGAR Usuarios - ✅ CORREGIDO
  cargarUsuarios(): void {
    this.authService.getAllUsuarios().subscribe({
      next: (data) => {
        console.log('📋 Usuarios recibidos del servidor:', data);

        // Cargar TODOS los usuarios (no filtrar por ahora para ver qué hay)
        this.usuarios = data;

        console.log('✅ Usuarios cargados:', this.usuarios.length);

        // Mostrar información de cada usuario
        this.usuarios.forEach(u => {
          console.log(`   - ${u.nombre} (${u.email}) [${u.rol || 'Sin rol'}]`);
        });

        if (this.usuarios.length === 0) {
          console.warn('⚠️ No hay usuarios disponibles');
          this.mostrarMensaje('No hay usuarios disponibles para asociar', 'error');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios:', error);
        console.error('   Status:', error.status);
        console.error('   Message:', error.message);
        this.mostrarMensaje('Error al cargar usuarios: ' + (error.error?.message || error.message), 'error');
      },
    });
  }

  // 📥 CARGAR todos los teléfonos
  cargarTelefonos(): void {
    this.loading = true;

    this.http.get<Telefono[]>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        console.log('📱 Datos de teléfonos recibidos:', data);

        // ✅ CORREGIDO: Manejar cuando usuarios es null o undefined
        this.telefonos = data.map((tel) => ({
          ...tel,
          usuarioNombre:
            tel.usuarios && tel.usuarios.length > 0
              ? tel.usuarios.map((u) => u.nombre).join(', ')
              : 'Sin usuario',
          // Asegurar que usuarios sea siempre un array
          usuarios: tel.usuarios || []
        }));

        this.loading = false;
        console.log('✅ Teléfonos cargados correctamente:', this.telefonos.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar teléfonos:', error);
        console.error('   Status:', error.status);
        console.error('   Detalles:', error.error);

        this.mostrarMensaje('Error al cargar los teléfonos: ' + (error.error?.message || error.message), 'error');
        this.telefonos = [];
        this.loading = false;
      },
    });
  }

  // ➕ GUARDAR teléfono (crear o actualizar)
  guardarTelefono(): void {
    if (!this.telefono.numero.trim()) {
      this.mostrarMensaje('Por favor ingresa un número de teléfono', 'error');
      return;
    }

    const numeroLimpio = this.telefono.numero.trim().replace(/\s+/g, '');
    const regex = /^[+]?[0-9()\-\s]{7,15}$/;

    if (!regex.test(numeroLimpio)) {
      this.mostrarMensaje(
        'El número debe tener entre 7 y 15 dígitos. Puede incluir +, -, (), y espacios',
        'error'
      );
      return;
    }

    this.loading = true;

    const telefonoData = {
      numero: this.telefono.numero.trim(),
    };

    if (this.modoEdicion && this.telefonoEditando) {
      this.actualizarTelefono(telefonoData);
    } else {
      this.crearTelefonoYAsociar(telefonoData);
    }
  }

  // ➕ CREAR teléfono Y ASOCIAR al usuario - ✅ MODIFICADO
  crearTelefonoYAsociar(telefonoData: any): void {
    this.http
      .post<Telefono>(this.apiUrl, telefonoData, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Teléfono creado:', response);

          if (this.telefono.usuarioId && response.idTelefono) {
            this.asociarTelefonoAUsuario(this.telefono.usuarioId, response.idTelefono);
          } else {
            this.mostrarMensaje('✓ Teléfono guardado exitosamente', 'success');
            this.limpiarFormulario();
            this.cargarTelefonos(); // ✅ RECARGAR la lista
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('❌ Error al crear teléfono:', error);
          let mensajeError = 'Error al guardar el teléfono';

          if (error.status === 403) {
            mensajeError = 'No tienes permisos para crear teléfonos. Inicia sesión.';
          } else if (error.status === 400) {
            mensajeError = error.error?.message || 'El número ya está registrado o es inválido';
          } else if (error.error?.message) {
            mensajeError = error.error.message;
          }

          this.mostrarMensaje(mensajeError, 'error');
          this.loading = false;
        },
      });
  }

  // 🔗 ASOCIAR teléfono a usuario - ✅ CORREGIDO
  asociarTelefonoAUsuario(usuarioId: string, telefonoId: number): void {
    const url = `${this.apiUsuarios}/${usuarioId}/telefonos/${telefonoId}`;

    console.log('🔗 Intentando asociar teléfono');
    console.log('   URL:', url);
    console.log('   Usuario ID:', usuarioId);
    console.log('   Teléfono ID:', telefonoId);

    this.http
      .post(url, null, {
        headers: this.getHeaders(),
        responseType: 'text' as 'json'
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Teléfono asociado al usuario:', response);
          this.mostrarMensaje('✓ Teléfono guardado y asociado exitosamente', 'success');
          this.limpiarFormulario();
          this.cargarTelefonos(); // ✅ RECARGAR la lista
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al asociar teléfono:', error);
          console.error('   Status:', error.status);
          console.error('   Error completo:', error);

          let mensajeError = 'Teléfono creado pero no se pudo asociar al usuario';

          if (error.status === 404) {
            mensajeError = 'Usuario o teléfono no encontrado';
          } else if (error.status === 500) {
            mensajeError = 'Error en el servidor al asociar. Verifica que el usuario y teléfono existan';
          } else if (error.error?.message) {
            mensajeError = error.error.message;
          }

          this.mostrarMensaje(mensajeError, 'error');
          this.cargarTelefonos(); // ✅ RECARGAR incluso si falla
          this.loading = false;
        },
      });
  }

  // ✏️ ACTUALIZAR teléfono
  actualizarTelefono(telefonoData: any): void {
    if (!this.telefonoEditando?.idTelefono) return;

    const url = `${this.apiUrl}/${this.telefonoEditando.idTelefono}`;

    this.http
      .put<Telefono>(url, telefonoData, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Teléfono actualizado:', response);
          this.mostrarMensaje('✓ Teléfono actualizado exitosamente', 'success');
          this.limpiarFormulario();
          this.cargarTelefonos();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al actualizar teléfono:', error);
          let mensajeError = 'Error al actualizar el teléfono';

          if (error.status === 403) {
            mensajeError = 'No tienes permisos para actualizar teléfonos';
          } else if (error.error?.message) {
            mensajeError = error.error.message;
          }

          this.mostrarMensaje(mensajeError, 'error');
          this.loading = false;
        },
      });
  }

  // ✏️ Preparar edición
  editarTelefono(tel: Telefono): void {
    this.modoEdicion = true;
    this.telefonoEditando = { ...tel };
    this.telefono = {
      numero: tel.numero,
      usuarioId: '' // No editamos la asociación por ahora
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 🧹 Cancelar edición
  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  // 🧹 Limpiar formulario
  limpiarFormulario(): void {
    this.telefono = {
      numero: '',
      usuarioId: ''
    };
    this.modoEdicion = false;
    this.telefonoEditando = null;
  }

  // 🗑️ ELIMINAR teléfono
  confirmarEliminar(): void {
    if (!this.telefonoEliminar || !this.telefonoEliminar.idTelefono) return;

    this.loading = true;
    const url = `${this.apiUrl}/${this.telefonoEliminar.idTelefono}`;

    this.http
      .delete(url, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => {
          console.log('✅ Teléfono eliminado');
          this.mostrarMensaje('✓ Teléfono eliminado exitosamente', 'success');
          this.cerrarModalEliminar();
          this.cargarTelefonos();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al eliminar teléfono:', error);
          let mensajeError = 'Error al eliminar el teléfono';

          if (error.status === 403) {
            mensajeError = 'No tienes permisos para eliminar teléfonos';
          } else if (error.error?.message) {
            mensajeError = error.error.message;
          }

          this.mostrarMensaje(mensajeError, 'error');
          this.loading = false;
        },
      });
  }

  // 🔍 BUSCAR por número
  buscarPorNumero(): void {
    if (!this.numeroBusqueda.trim()) {
      this.mostrarMensaje('Por favor ingresa un número para buscar', 'error');
      return;
    }

    this.loading = true;

    const resultado = this.telefonos.filter((tel) =>
      tel.numero.includes(this.numeroBusqueda.trim())
    );

    if (resultado.length > 0) {
      this.telefonos = resultado;
      this.mostrarMensaje(`Se encontraron ${resultado.length} teléfono(s)`, 'success');
    } else {
      this.mostrarMensaje('No se encontró ningún teléfono con ese número', 'error');
      this.cargarTelefonos();
    }

    this.loading = false;
  }

  // 🔍 BUSCAR por usuario
  buscarPorUsuario(): void {
    if (!this.busquedaUsuario.trim()) {
      this.cargarTelefonos();
      return;
    }

    const busqueda = this.busquedaUsuario.toLowerCase();
    this.telefonos = this.telefonos.filter((tel) =>
      tel.usuarioNombre?.toLowerCase().includes(busqueda)
    );

    if (this.telefonos.length === 0) {
      this.mostrarMensaje('No se encontraron teléfonos para ese usuario', 'error');
      this.cargarTelefonos();
    }
  }

  // 🔄 Limpiar búsqueda
  limpiarBusqueda(): void {
    this.numeroBusqueda = '';
    this.busquedaUsuario = '';
    this.cargarTelefonos();
  }

  // 🎭 Control de Modal Eliminar
  abrirModalEliminar(telefono: Telefono): void {
    this.telefonoEliminar = telefono;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.telefonoEliminar = null;
  }

  // 💬 Mostrar mensajes
  mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;

    setTimeout(() => {
      this.mensaje = '';
      this.tipoMensaje = '';
    }, 5000);
  }

  // 🔙 Volver al dashboard
  volverAlDashboard(): void {
    this.router.navigate(['/dashboard-admin']);
  }
}
