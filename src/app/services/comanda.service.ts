import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Comanda, DetalleComanda } from '../models/comanda.model';

@Injectable({
  providedIn: 'root',
})
export class ComandaService {
  private endpoint = 'comandas';

  constructor(private api: ApiService) {}

  // ===== MÉTODOS GENERALES (ADMIN) =====

  getAll(): Observable<Comanda[]> {
    return this.api.get<Comanda[]>(this.endpoint);
  }

  getById(id: number): Observable<Comanda> {
    return this.api.get<Comanda>(`${this.endpoint}/${id}`);
  }

  create(comanda: Comanda): Observable<Comanda> {
    return this.api.post<Comanda>(this.endpoint, comanda);
  }

  update(id: number, comanda: Comanda): Observable<Comanda> {
    return this.api.put<Comanda>(`${this.endpoint}/${id}`, comanda);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  // ===== MÉTODOS PARA MESERO =====

  // 🔥 NUEVO: Obtener MIS comandas activas (estados 4=PENDIENTE y 5=LISTA)
  getMisComandasActivas(): Observable<Comanda[]> {
    return this.api.get<Comanda[]>(`${this.endpoint}/mis-comandas-activas`);
  }

  // 🔥 NUEVO: Obtener MIS comandas de una mesa específica
  getMisComandasDeMesa(idMesa: number): Observable<Comanda[]> {
    return this.api.get<Comanda[]>(`${this.endpoint}/mesa/${idMesa}/mis-comandas`);
  }

  // 🔥 NUEVO: Obtener UNA de MIS comandas por ID
  getMiComandaById(idComanda: number): Observable<Comanda> {
    return this.api.get<Comanda>(`${this.endpoint}/mis-comandas/${idComanda}`);
  }

  // 🔥 NUEVO: Obtener detalles de MI comanda
  getMisDetallesComanda(idComanda: number): Observable<DetalleComanda[]> {
    return this.api.get<DetalleComanda[]>(`${this.endpoint}/mis-comandas/${idComanda}/detalles`);
  }

  // 🔥 NUEVO: Obtener todas MIS comandas (histórico completo)
  getMisComandas(): Observable<Comanda[]> {
    return this.api.get<Comanda[]>(`${this.endpoint}/mis-comandas`);
  }

  // Crear comanda con detalles
  crearComandaCompleta(comanda: any): Observable<Comanda> {
    return this.api.post<Comanda>(`${this.endpoint}/completa`, comanda);
  }

  // Obtener comandas por mesero
  obtenerComandasPorMesero(idMesero: string): Observable<Comanda[]> {
    return this.api.get<Comanda[]>(`${this.endpoint}/mesero/${idMesero}`);
  }

  // Obtener comandas activas de un mesero
  obtenerComandasActivasMesero(idMesero: string): Observable<Comanda[]> {
    return this.api.get<Comanda[]>(`${this.endpoint}/mesero/${idMesero}/activas`);
  }

  // Obtener comanda por mesa
  obtenerComandaPorMesa(idMesa: number): Observable<Comanda> {
    return this.api.get<Comanda>(`${this.endpoint}/mesa/${idMesa}`);
  }

  // Obtener detalles de una comanda (ADMIN/CAJERO)
  obtenerDetallesComanda(idComanda: number): Observable<DetalleComanda[]> {
    return this.api.get<DetalleComanda[]>(`${this.endpoint}/admin/${idComanda}/detalles`);
  }

  // Obtener todos los detalles de comandas (para mesero)
  obtenerTodosLosDetalles(): Observable<any[]> {
    return this.api.get<any[]>('detalles-comanda');
  }

  // Cerrar/finalizar comanda (cambiar a estado cobrada)
  cerrarComanda(idComanda: number): Observable<any> {
    return this.api.put<any>(`${this.endpoint}/${idComanda}/cerrar`, {});
  }

  // Agregar producto a comanda existente
  agregarProducto(idComanda: number, detalle: DetalleComanda): Observable<any> {
    return this.api.post<any>(`${this.endpoint}/${idComanda}/productos`, detalle);
  }

  // ===== MÉTODOS PARA COCINERO =====

  // Obtener comandas pendientes (estado = 4)
  obtenerComandasPendientes(): Observable<Comanda[]> {
    return this.api.get<Comanda[]>(`${this.endpoint}/pendientes`);
  }

  // Obtener comandas en preparación (estado = 5)
  obtenerComandasEnPreparacion(): Observable<Comanda[]> {
    return this.api.get<Comanda[]>(`${this.endpoint}/preparacion`);
  }

  // Cambiar estado de comanda
  cambiarEstadoComanda(idComanda: number, estado: number): Observable<any> {
    return this.api.put<any>(`${this.endpoint}/${idComanda}/estado`, { estado });
  }

  // Asignar cocinero a comanda
  asignarCocinero(idComanda: number, idCocinero: string): Observable<any> {
    return this.api.put<any>(`${this.endpoint}/${idComanda}/cocinero`, { id_cocinero: idCocinero });
  }

  // Obtener comandas por cocinero
  obtenerComandasPorCocinero(idCocinero: string): Observable<Comanda[]> {
    return this.api.get<Comanda[]>(`${this.endpoint}/cocinero/${idCocinero}`);
  }

  // ===== MÉTODOS DE REPORTES =====

  // Obtener comandas del día
  obtenerComandasDelDia(): Observable<Comanda[]> {
    return this.api.get<Comanda[]>(`${this.endpoint}/hoy`);
  }

  // Obtener estadísticas
  obtenerEstadisticas(): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/estadisticas`);
  }

  // Obtener total de ventas del día
  obtenerTotalVentasHoy(): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/ventas/hoy`);
  }
}