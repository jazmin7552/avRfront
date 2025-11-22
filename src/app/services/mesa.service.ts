import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Mesa } from '../models/mesa.model';

@Injectable({
  providedIn: 'root',
})
export class MesaService {
  private endpoint = 'mesas';

  constructor(private api: ApiService) {}

  // ===== MÉTODOS EXISTENTES =====
  getAll(): Observable<Mesa[]> {
    return this.api.get<Mesa[]>(this.endpoint);
  }

  getById(id: number): Observable<Mesa> {
    return this.api.get<Mesa>(`${this.endpoint}/${id}`);
  }

  create(mesa: Mesa): Observable<Mesa> {
    return this.api.post<Mesa>(this.endpoint, mesa);
  }

  update(id: number, mesa: Mesa): Observable<Mesa> {
    return this.api.put<Mesa>(`${this.endpoint}/${id}`, mesa);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  getDisponibles(): Observable<Mesa[]> {
    return this.api.get<Mesa[]>(`${this.endpoint}/disponibles`);
  }

  // ===== NUEVOS MÉTODOS PARA MESERO =====

  // Obtener todas las mesas (alias para mesero)
  obtenerMesas(): Observable<Mesa[]> {
    return this.getAll();
  }

  // ✨ CORREGIDO: Cambiar solo el estado de una mesa (USA PATCH)
  cambiarEstado(id: number, estadoId: number): Observable<Mesa> {
    return this.api.patch<Mesa>(`${this.endpoint}/${id}/estado`, { estadoId });
  }

  // Actualizar solo el estado de una mesa (DEPRECADO - usar cambiarEstado)
  actualizarEstadoMesa(id: number, estado: number): Observable<any> {
    return this.cambiarEstado(id, estado); // Redirige al nuevo método
  }

  // Obtener mesas ocupadas
  getOcupadas(): Observable<Mesa[]> {
    return this.api.get<Mesa[]>(`${this.endpoint}/ocupadas`);
  }
}
