import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Estado {
  idEstado?: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class EstadoService {
  private endpoint = 'estados';

  constructor(private api: ApiService) {
    console.log('📊 EstadoService inicializado');
  }

  getAll(): Observable<Estado[]> {
    console.log('📡 Obteniendo todos los estados');
    return this.api
      .get<Estado[]>(this.endpoint)
      .pipe(tap((data) => console.log('✅ Estados recibidos:', data)));
  }

  getById(id: number): Observable<Estado> {
    console.log('📡 Obteniendo estado ID:', id);
    return this.api
      .get<Estado>(`${this.endpoint}/${id}`)
      .pipe(tap((data) => console.log('✅ Estado recibido:', data)));
  }

  create(estado: Estado): Observable<Estado> {
    console.log('📡 Creando estado:', estado);
    return this.api
      .post<Estado>(this.endpoint, estado)
      .pipe(tap((response) => console.log('✅ Estado creado:', response)));
  }

  update(id: number, estado: Estado): Observable<Estado> {
    console.log('📡 Actualizando estado ID:', id, estado);
    return this.api
      .put<Estado>(`${this.endpoint}/${id}`, estado)
      .pipe(tap((response) => console.log('✅ Estado actualizado:', response)));
  }

  delete(id: number): Observable<void> {
    console.log('📡 Eliminando estado ID:', id);
    return this.api
      .delete<void>(`${this.endpoint}/${id}`)
      .pipe(tap(() => console.log('✅ Estado eliminado')));
  }
}
