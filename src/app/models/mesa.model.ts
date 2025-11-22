// src/app/models/mesa.model.ts

/**
 * 🍽️ Modelo Mesa
 *
 * Este modelo representa una mesa del restaurante.
 *
 * ✅ Frontend usa: estado como texto ('DISPONIBLE', 'OCUPADA', 'RESERVADA')
 * ✅ Backend usa: estadoId como número (1, 2, 3)
 *
 * La conversión entre texto y número se hace en los componentes/servicios
 */
export interface Mesa {
  idMesa?: number;
  numeroMesa: string;
  capacidad: number;
  estado: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA';
}

/**
 * 🔄 Utilidades para convertir entre el formato del frontend y backend
 */
export class MesaUtils {
  /**
   * Convertir estado texto (frontend) a estadoId número (backend)
   */
  static estadoAId(estado: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA'): number {
    const mapa: { [key: string]: number } = {
      DISPONIBLE: 1,
      OCUPADA: 2,
      RESERVADA: 3,
    };
    return mapa[estado] || 1;
  }

  /**
   * Convertir estadoId número (backend) a estado texto (frontend)
   */
  static idAEstado(estadoId: number): 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' {
    const mapa: { [key: number]: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' } = {
      1: 'DISPONIBLE',
      2: 'OCUPADA',
      3: 'RESERVADA',
    };
    return mapa[estadoId] || 'DISPONIBLE';
  }

  /**
   * Convertir respuesta del backend a formato Mesa (frontend)
   */
  static fromBackend(mesaBackend: any): Mesa {
    return {
      idMesa: mesaBackend.idMesa,
      numeroMesa: mesaBackend.numeroMesa || mesaBackend.ubicacion || `Mesa ${mesaBackend.idMesa}`,
      capacidad: mesaBackend.capacidad,
      estado: this.idAEstado(mesaBackend.estadoId),
    };
  }

  /**
   * Convertir Mesa (frontend) a formato para enviar al backend
   */
  static toBackend(mesa: Mesa): any {
    return {
      idMesa: mesa.idMesa,
      numeroMesa: mesa.numeroMesa,
      capacidad: mesa.capacidad,
      estadoId: this.estadoAId(mesa.estado),
    };
  }
}
