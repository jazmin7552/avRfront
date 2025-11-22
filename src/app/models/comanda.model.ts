// src/app/models/comanda.model.ts

export interface Comanda {
  // IDs
  comandaId?: number; // ← ID de la comanda

  // Información de Mesa
  mesaId: number; // ← Del backend
  mesaUbicacion?: string; // ← Del backend

  // Información de Mesero
  meseroId: string; // ← Del backend
  meseroNombre?: string; // ← Del backend

  // Información de Cocinero
  cocineroId?: string; // ← Del backend
  cocineroNombre?: string; // ← Del backend

  // Estado
  estadoId: number; // ← Del backend (número)
  estadoNombre: string; // ← Del backend (PENDIENTE, EN_PREPARACION, etc)

  // Fecha y Total
  fecha: string; // ← Del backend (ISO string)
  total: number; // ← Del backend

  // Detalles
  detalles?: DetalleComanda[];
}

export interface DetalleComanda {
  comandaId: number;
  productoId: number;
  cantidad: number;

  // Propiedades adicionales que puedes necesitar
  precioUnitario?: number;
  subtotal?: number;
  nombreProducto?: string;
}

// Interfaz para CREAR comandas (lo que ENVÍAS al backend)
export interface ComandaCreate {
  mesaId: number;
  meseroId: string;
  estadoId: number;
  detalles: {
    productoId: number;
    cantidad: number;
  }[];
  total: number;
}
