import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Rol } from '../models/rol.model';

@Injectable({
  providedIn: 'root',
})
export class RolService {
  private apiUrl = 'http://restauranteav-env.eba-yavju4ap.us-east-2.elasticbeanstalk.com/api/roles';

  constructor(private http: HttpClient) {}

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else if (error.status === 401) {
        errorMessage = 'No autorizado. Tu sesión puede haber expirado.';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado.';
      } else if (error.status === 500) {
        errorMessage = 'Error en el servidor. Intenta más tarde.';
      } else {
        errorMessage =
          error.error?.mensaje || error.error || `Error ${error.status}: ${error.message}`;
      }
    }

    console.error('Error completo:', error);
    return throwError(() => errorMessage);
  }

  obtenerRoles(): Observable<Rol[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map((response) => {
        console.log('📥 Respuesta del servidor:', response);

        if (Array.isArray(response)) {
          return response;
        } else if (response?.roles) {
          return response.roles;
        } else if (response?.data) {
          return response.data;
        } else {
          return [];
        }
      }),
      catchError(this.handleError)
    );
  }

  crearRol(rol: Rol): Observable<Rol> {
    return this.http.post<any>(this.apiUrl, rol, { headers: this.getHeaders() }).pipe(
      map((response) => {
        console.log('✅ Respuesta crear rol:', response);
        return response?.data || response || rol;
      }),
      catchError(this.handleError)
    );
  }

  actualizarRol(id: number, rol: Partial<Rol>): Observable<Rol> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<any>(url, rol, { headers: this.getHeaders() }).pipe(
      map((response) => {
        console.log('✏️ Respuesta actualizar rol:', response);
        return response?.data || response || ({ ...rol, idRol: id } as Rol);
      }),
      catchError(this.handleError)
    );
  }

  eliminarRol(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<any>(url, { headers: this.getHeaders() }).pipe(
      map((response) => {
        console.log('🗑️ Respuesta eliminar rol:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }
}
