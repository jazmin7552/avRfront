export interface Producto {
  idProducto?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  estado: boolean;
  idCategoria: number;
  categoriaNombre?: string;
}
