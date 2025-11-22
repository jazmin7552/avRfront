import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('🌐 API URL:', this.apiUrl);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // ========== GET ==========
  get<T>(endpoint: string): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    console.log('📡 GET:', url);

    return this.http.get<T>(url, { headers: this.getHeaders() }).pipe(
      tap((data) => console.log('✅ Respuesta GET:', data)),
      catchError(this.handleError)
    );
  }

  // ========== POST ==========
  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    console.log('📡 POST:', url, data);

    return this.http.post<T>(url, data, { headers: this.getHeaders() }).pipe(
      tap((response) => console.log('✅ Respuesta POST:', response)),
      catchError(this.handleError)
    );
  }

  // ========== PUT ==========
  put<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    console.log('📡 PUT:', url, data);

    return this.http.put<T>(url, data, { headers: this.getHeaders() }).pipe(
      tap((response) => console.log('✅ Respuesta PUT:', response)),
      catchError(this.handleError)
    );
  }

  // ========== PATCH ✅ ==========
  patch<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    console.log('📡 PATCH:', url, data);

    return this.http.patch<T>(url, data, { headers: this.getHeaders() }).pipe(
      tap((response) => console.log('✅ Respuesta PATCH:', response)),
      catchError(this.handleError)
    );
  }

  // ========== DELETE ==========
  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    console.log('📡 DELETE:', url);

    return this.http.delete<T>(url, { headers: this.getHeaders() }).pipe(
      tap((response) => console.log('✅ Respuesta DELETE:', response)),
      catchError(this.handleError)
    );
  }

  // ========== MANEJO DE ERRORES ==========
  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error completo:', error);

    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
      if (error.error?.message) {
        errorMessage += `\nDetalle: ${error.error.message}`;
      }
    }

    console.error('💥 Error procesado:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
