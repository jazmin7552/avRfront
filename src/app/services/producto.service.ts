import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private endpoint = 'productos';

  constructor(private api: ApiService) {}

  getAll(): Observable<Producto[]> {
    return this.api.get<Producto[]>(this.endpoint);
  }

  getById(id: number): Observable<Producto> {
    return this.api.get<Producto>(`${this.endpoint}/${id}`);
  }

  create(producto: Producto): Observable<Producto> {
    return this.api.post<Producto>(this.endpoint, producto);
  }

  update(id: number, producto: Producto): Observable<Producto> {
    return this.api.put<Producto>(`${this.endpoint}/${id}`, producto);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  updateStock(id: number, cantidad: number, operacion: 'aumentar' | 'reducir'): Observable<Producto> {
    return this.api.put<Producto>(`${this.endpoint}/${id}/stock`, { cantidad, operacion });
  }

  toggleEstado(id: number, estado: boolean): Observable<Producto> {
    return this.api.put<Producto>(`${this.endpoint}/${id}/estado`, { estado });
  }
}
