import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private endpoint = 'usuarios';

  constructor(private api: ApiService) {}

  getAll(): Observable<Usuario[]> {
    return this.api.get<Usuario[]>(this.endpoint);
  }

  getById(id: string): Observable<Usuario> {
    return this.api.get<Usuario>(`${this.endpoint}/${id}`);
  }

  getPerfil(): Observable<Usuario> {
    return this.api.get<Usuario>(`${this.endpoint}/perfil`);
  }

  create(usuario: Usuario): Observable<Usuario> {
    return this.api.post<Usuario>(this.endpoint, usuario);
  }

  update(id: string, usuario: Usuario): Observable<Usuario> {
    return this.api.put<Usuario>(`${this.endpoint}/${id}`, usuario);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  agregarTelefono(idUsuario: string, idTelefono: number): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${idUsuario}/telefonos/${idTelefono}`, {});
  }

  removerTelefono(idUsuario: string, idTelefono: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${idUsuario}/telefonos/${idTelefono}`);
  }
}
