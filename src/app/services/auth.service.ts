import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ✅ Interfaz correcta para el login
export interface LoginRequest {
  email: string;
  password: string;
}

// ✅ Interfaz que coincide con tu backend
export interface LoginResponse {
  token: string;
  type: string;
  email: string;
  nombre: string;
  rol: string;
  idUsuario: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      try {
        this.currentUserSubject.next(JSON.parse(usuario));
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        localStorage.removeItem('usuario');
      }
    }
  }

  /**
   * 🔐 LOGIN - VERSIÓN MEJORADA CON DEBUGGING COMPLETO
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('🔄 Intentando login en:', `${this.apiUrl}/auth/login`);
    console.log('📤 Credenciales:', { email: credentials.email, password: '***' });

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ RESPUESTA COMPLETA DEL BACKEND:');
        console.log(JSON.stringify(response, null, 2));
        console.log('═══════════════════════════════════════════════════');

        // PASO 1: Intentar obtener el ID directamente del response
        let idUsuario = response.idUsuario;
        console.log('🔍 ID desde response.idUsuario:', idUsuario);

        // PASO 2: Si no viene el ID, intentar extraerlo del token
        if (!idUsuario && response.token) {
          console.log('⚠️ No viene idUsuario en el response, intentando extraer del token...');
          idUsuario = this.extraerIdDelToken(response.token);
        }

        // PASO 3: Si aún no tenemos ID, intentar con el email como fallback
        if (!idUsuario) {
          console.warn('⚠️ No se pudo obtener ID numérico. Usando email como fallback.');
          idUsuario = response.email;
        }

        console.log('✅ ID FINAL EXTRAÍDO:', idUsuario);

        // PASO 4: Crear objeto usuario completo
        const usuarioCompleto: LoginResponse = {
          token: response.token,
          type: response.type || 'Bearer',
          email: response.email,
          nombre: response.nombre,
          rol: response.rol,
          idUsuario: idUsuario,
        };

        console.log('═══════════════════════════════════════════════════');
        console.log('📦 USUARIO COMPLETO A GUARDAR:');
        console.log(JSON.stringify(usuarioCompleto, null, 2));
        console.log('═══════════════════════════════════════════════════');

        // PASO 5: Guardar en localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', JSON.stringify(usuarioCompleto));

        // PASO 6: Actualizar BehaviorSubject
        this.currentUserSubject.next(usuarioCompleto);

        // PASO 7: VERIFICACIÓN FINAL
        console.log('🔍 VERIFICACIÓN FINAL:');
        console.log('  ✓ Token guardado:', !!localStorage.getItem('token'));
        console.log('  ✓ Usuario guardado:', !!localStorage.getItem('usuario'));
        console.log('  ✓ ID Usuario:', this.getIdUsuario());
        console.log('═══════════════════════════════════════════════════');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 🔐 EXTRAER ID DEL TOKEN JWT
   */
  private extraerIdDelToken(token: string): string | null {
    try {
      console.log('🔓 Intentando decodificar token...');

      // Dividir el token en sus 3 partes: header.payload.signature
      const partes = token.split('.');

      if (partes.length !== 3) {
        console.error('❌ Token JWT inválido (no tiene 3 partes)');
        return null;
      }

      // Decodificar el payload (segunda parte)
      const payloadBase64 = partes[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);

      console.log('═══════════════════════════════════════════════════');
      console.log('🔓 PAYLOAD DEL TOKEN DECODIFICADO:');
      console.log(JSON.stringify(payload, null, 2));
      console.log('═══════════════════════════════════════════════════');

      // Intentar extraer el ID con todas las variaciones posibles
      const idExtraido =
        payload.id ||
        payload.id_usuario ||
        payload.idUsuario ||
        payload.userId ||
        payload.user_id ||
        payload.sub ||
        null;

      console.log('🆔 ID extraído del token:', idExtraido);

      // Convertir a string si es número
      return idExtraido ? String(idExtraido) : null;
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      return null;
    }
  }

  /**
   * 🆔 OBTENER ID DEL USUARIO (MÉTODO PRINCIPAL)
   */
  getIdUsuario(): string | null {
    const usuario = this.getUsuario();

    if (!usuario) {
      console.error('❌ No hay usuario en localStorage');
      return null;
    }

    const id = usuario.idUsuario;

    if (!id) {
      console.error('❌ El usuario NO tiene idUsuario:', usuario);
      console.error('🔧 Intenta cerrar sesión y volver a iniciar sesión');
    }

    return id;
  }

  /**
   * 🚪 LOGOUT
   */
  logout(): void {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.currentUserSubject.next(null);
  }

  /**
   * 🎫 OBTENER TOKEN
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * 👤 OBTENER USUARIO COMPLETO
   */
  getUsuario(): LoginResponse | null {
    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
      return null;
    }

    try {
      const user = JSON.parse(usuario);

      // Si el usuario no tiene idUsuario, intentar extraerlo del token
      if (!user.idUsuario && user.token) {
        console.warn('⚠️ Usuario sin idUsuario, intentando extraer del token...');
        const idExtraido = this.extraerIdDelToken(user.token);

        if (idExtraido) {
          user.idUsuario = idExtraido;
          // Actualizar en localStorage
          localStorage.setItem('usuario', JSON.stringify(user));
          console.log('✅ ID actualizado en localStorage:', idExtraido);
        }
      }

      return user;
    } catch (error) {
      console.error('❌ Error al parsear usuario:', error);
      return null;
    }
  }

  /**
   * ✅ VERIFICAR SI ESTÁ AUTENTICADO
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const usuario = this.getUsuario();
    const tieneId = usuario?.idUsuario ? true : false;

    const estaAutenticado = !!token && !!usuario && tieneId;

    if (!estaAutenticado) {
      console.warn('⚠️ Usuario NO autenticado:', {
        tieneToken: !!token,
        tieneUsuario: !!usuario,
        tieneIdUsuario: tieneId,
      });
    }

    return estaAutenticado;
  }

  /**
   * 👑 VERIFICAR SI ES ADMIN
   */
  isAdmin(): boolean {
    const usuario = this.getUsuario();
    return usuario?.rol === 'ADMIN';
  }

  // ✅✅✅ NUEVOS MÉTODOS PARA CARGAR COCINEROS ✅✅✅

  /**
   * 👨‍🍳 OBTENER USUARIOS POR ROL
   */
  getUsuariosPorRol(rol: string): Observable<any[]> {
    console.log(`🔍 Cargando usuarios con rol: ${rol}`);
    return this.http.get<any[]>(`${this.apiUrl}/usuarios/rol/${rol}`).pipe(
      tap((usuarios) => {
        console.log(`✅ Usuarios con rol ${rol}:`, usuarios);
      }),
      catchError((error) => {
        console.error(`❌ Error al cargar usuarios con rol ${rol}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
    * 👥 OBTENER TODOS LOS USUARIOS
    */
  getAllUsuarios(): Observable<any[]> {
    console.log('🔍 Cargando todos los usuarios');
    const token = this.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`, { headers }).pipe(
      tap((usuarios) => {
        console.log('✅ Total usuarios cargados:', usuarios.length);
      }),
      catchError((error) => {
        console.error('❌ Error al cargar usuarios:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * ❌ MANEJO DE ERRORES
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log('═══════════════════════════════════════════════════');
    console.error('❌ ERROR EN LOGIN:');
    console.error('Status:', error.status);
    console.error('Error completo:', error);
    console.log('═══════════════════════════════════════════════════');

    let errorMessage = 'Ha ocurrido un error';

    if (error.status === 0) {
      errorMessage =
        '❌ No se puede conectar con el servidor.\n\n' +
        'Posibles causas:\n' +
        '• El backend no está corriendo\n' +
        '• Problema de CORS\n' +
        '• URL incorrecta: ' +
        this.apiUrl;
    } else if (error.status === 401) {
      errorMessage = 'Credenciales incorrectas';
    } else if (error.status === 404) {
      errorMessage = 'Endpoint no encontrado: ' + this.apiUrl + '/auth/login';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => ({ status: error.status, message: errorMessage }));
  }
}
