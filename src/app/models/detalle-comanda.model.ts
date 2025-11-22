// src/app/models/detalle-comanda.model.ts

export interface DetalleComanda {
  id_detalle_comanda: number;
  id_comanda: number;
  id_producto: number;
  cantidad: number;
  subtotal: number;

  // Propiedades opcionales para relaciones
  producto?: {
    id_producto: number;
    nombre: string;
    precio: number;
    categoria: number;
  };
}

// Interfaz para crear un nuevo detalle (sin id)
export interface DetalleComandaCreate {
  id_producto: number;
  cantidad: number;
  subtotal: number;
}
