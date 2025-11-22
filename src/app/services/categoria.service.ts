import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Categoria {
  idCategoria?: number; // 👈 CAMBIAR AQUÍ (línea 7)
  nombre: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  private endpoint = 'categorias';

  constructor(private api: ApiService) {
    console.log('🏷️ CategoriaService inicializado');
  }

  getAll(): Observable<Categoria[]> {
    console.log('📡 Obteniendo todas las categorías');
    return this.api
      .get<Categoria[]>(this.endpoint)
      .pipe(tap((data) => console.log('✅ Categorías recibidas:', data)));
  }

  getById(id: number): Observable<Categoria> {
    console.log('📡 Obteniendo categoría ID:', id);
    return this.api
      .get<Categoria>(`${this.endpoint}/${id}`)
      .pipe(tap((data) => console.log('✅ Categoría recibida:', data)));
  }

  create(categoria: Categoria): Observable<Categoria> {
    console.log('📡 Creando categoría:', categoria);
    return this.api
      .post<Categoria>(this.endpoint, categoria)
      .pipe(tap((response) => console.log('✅ Categoría creada:', response)));
  }

  update(id: number, categoria: Categoria): Observable<Categoria> {
    console.log('📡 Actualizando categoría ID:', id, categoria);
    return this.api
      .put<Categoria>(`${this.endpoint}/${id}`, categoria)
      .pipe(tap((response) => console.log('✅ Categoría actualizada:', response)));
  }

  delete(id: number): Observable<void> {
    console.log('📡 Eliminando categoría ID:', id);
    return this.api
      .delete<void>(`${this.endpoint}/${id}`)
      .pipe(tap(() => console.log('✅ Categoría eliminada')));
  }
}
