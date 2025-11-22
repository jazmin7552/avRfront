import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Telefono, Usuario } from '../models/telefono.model';

@Injectable({
  providedIn: 'root',
})
export class TelefonoService {
  private endpoint = 'telefonos';
  private usuariosEndpoint = 'usuarios';

  constructor(private api: ApiService) {}

  getAll(): Observable<Telefono[]> {
    return this.api.get<Telefono[]>(this.endpoint).pipe(
      map((telefonos) => {
        console.log('📱 Teléfonos recibidos:', telefonos);
        return telefonos;
      })
    );
  }

  getById(id: number): Observable<Telefono> {
    return this.api.get<Telefono>(`${this.endpoint}/${id}`);
  }

  create(telefono: Partial<Telefono>): Observable<Telefono> {
    console.log('📱 Creando teléfono:', telefono);
    return this.api.post<Telefono>(this.endpoint, telefono);
  }

  update(id: number, telefono: Partial<Telefono>): Observable<Telefono> {
    console.log('📱 Actualizando teléfono:', id, telefono);
    return this.api.put<Telefono>(`${this.endpoint}/${id}`, telefono);
  }

  delete(id: number): Observable<void> {
    console.log('📱 Eliminando teléfono:', id);
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.api.get<Usuario[]>(this.usuariosEndpoint).pipe(
      map((usuarios) => {
        console.log('👥 Usuarios recibidos:', usuarios);
        return usuarios;
      })
    );
  }
}
