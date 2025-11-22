import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Usuario {
  nombre: string;
  email: string;
  password: string;
  rol: string; // ✅ AGREGADO
}

interface RegistroResponse {
  token: string;
  email: string;
  nombre: string;
  rol: string;
  message?: string;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
})
export class RegistroComponent implements OnInit {
  // 📝 Modelo del formulario
  usuario: Usuario = {
    nombre: '',
    email: '',
    password: '',
    rol: '', // ✅ AGREGADO: inicialmente vacío
  };

  confirmPassword: string = '';

  // 🎯 Estado del componente
  loading: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';

  // 🔐 Indicador de fortaleza de contraseña
  mostrarFortaleza: boolean = false;
  claseFortaleza: string = '';

  // 🌐 URL de tu API
  private apiUrl = 'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    console.log('🍽️ Componente Registro iniciado');
  }

  // 🔐 Verificar fortaleza de la contraseña
  verificarFortalezaPassword(event: any): void {
    const password = event.target.value;

    if (password.length > 0) {
      this.mostrarFortaleza = true;

      let strength = 0;
      if (password.length >= 6) strength++;
      if (password.length >= 10) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;

      if (strength <= 2) {
        this.claseFortaleza = 'strength-weak';
      } else if (strength <= 4) {
        this.claseFortaleza = 'strength-medium';
      } else {
        this.claseFortaleza = 'strength-strong';
      }
    } else {
      this.mostrarFortaleza = false;
    }
  }

  // ➕ REGISTRAR nuevo usuario
  registrarUsuario(): void {
    // ✅ Validar que se haya seleccionado un rol
    if (!this.usuario.rol) {
      this.mostrarMensaje('Debes seleccionar un rol (Mesero o Cocinero)', 'error');
      return;
    }

    // Validar que las contraseñas coincidan
    if (this.usuario.password !== this.confirmPassword) {
      this.mostrarMensaje('Las contraseñas no coinciden', 'error');
      return;
    }

    // Validar longitud mínima de contraseña
    if (this.usuario.password.length < 6) {
      this.mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    // Validar campos obligatorios
    if (!this.usuario.nombre.trim() || !this.usuario.email.trim()) {
      this.mostrarMensaje('Todos los campos son obligatorios', 'error');
      return;
    }

    this.loading = true;

    // 📤 Enviar datos al backend
    console.log('📤 Enviando datos de registro:', this.usuario);

    this.http.post<RegistroResponse>(`${this.apiUrl}/register`, this.usuario).subscribe({
      next: (response) => {
        console.log('✅ Usuario registrado:', response);

        // Guardar el token y datos del usuario en localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem(
          'usuario',
          JSON.stringify({
            email: response.email,
            nombre: response.nombre,
            rol: response.rol,
          })
        );

        this.mostrarMensaje('✓ Registro exitoso. Bienvenido a Buen Sazón...', 'success');

        // Redirigir según el rol
        setTimeout(() => {
          if (response.rol === 'ADMIN') {
            this.router.navigate(['/dashboard-admin']);
          } else if (response.rol === 'MESERO') {
            this.router.navigate(['/dashboard-mesero']);
          } else if (response.rol === 'COCINERO') {
            this.router.navigate(['/dashboard-cocinero']);
          } else {
            this.router.navigate(['/dashboard-mesero']); // Por defecto
          }
        }, 1500);

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al registrar usuario:', error);
        const mensajeError =
          error.error?.message || 'Error en el registro. Por favor intenta de nuevo.';
        this.mostrarMensaje(mensajeError, 'error');
        this.loading = false;
      },
    });
  }

  // 💬 Mostrar mensajes
  mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;

    // Ocultar mensaje después de 3 segundos (excepto si es error)
    if (tipo === 'success') {
      setTimeout(() => {
        this.mensaje = '';
        this.tipoMensaje = '';
      }, 3000);
    }
  }

  // 🔙 Volver al login
  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
