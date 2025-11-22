import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  message: string = '';
  messageType: 'success' | 'error' = 'error';
  showMessage: boolean = false;

  constructor(private authService: AuthService, private router: Router) {
    // Si ya está autenticado, redirigir según su rol
    if (this.authService.isAuthenticated()) {
      this.redirectByRole();
    }
  }

  onSubmit(): void {
    this.showMessage = false;

    if (!this.email || !this.password) {
      this.displayMessage('Por favor completa todos los campos', 'error');
      return;
    }

    const credentials = {
      email: this.email.trim(),
      password: this.password,
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso:', response);
        console.log('👤 Usuario completo:', this.authService.getUsuario());

        this.displayMessage(`✓ Bienvenido ${response.nombre}!`, 'success');

        setTimeout(() => {
          this.redirectByRole();
        }, 1500);
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        this.displayMessage(error.message || 'Credenciales incorrectas', 'error');
      },
    });
  }

  private redirectByRole(): void {
    const usuario = this.authService.getUsuario();

    if (!usuario) {
      console.error('❌ No hay usuario en localStorage');
      this.router.navigate(['/login']);
      return;
    }

    console.log('🔀 Redirigiendo según rol:', usuario.rol);

    // Redirecciones según el rol del usuario
    switch (usuario.rol) {
      case 'ADMIN':
        console.log('➡️ Redirigiendo a: /dashboard');
        this.router.navigate(['/dashboard']);
        break;

      case 'MESERO':
        console.log('➡️ Redirigiendo a: /mesero/dashboard');
        this.router.navigate(['/mesero/dashboard']); // ✅ RUTA CORREGIDA
        break;

      case 'COCINERO':
        console.log('➡️ Redirigiendo a: /cocinero/dashboard');
        this.router.navigate(['/cocinero/dashboard']); // ✅ RUTA CORREGIDA
        break;

      default:
        console.error('❌ Rol desconocido:', usuario.rol);
        this.displayMessage('Rol de usuario no válido', 'error');
        this.router.navigate(['/login']);
    }
  }

  goToRegister(): void {
    this.router.navigate(['/registro']);
  }

  private displayMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    this.showMessage = true;

    if (type === 'success') {
      setTimeout(() => {
        this.showMessage = false;
      }, 3000);
    }
  }

  clearMessage(): void {
    this.showMessage = false;
  }
}
