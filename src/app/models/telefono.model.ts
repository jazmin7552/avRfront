// 🔥 MODELOS CORREGIDOS - Coinciden con el backend

export interface Telefono {
  idTelefono?: number;
  numero: string;
  usuarioNombre?: string; // Para mostrar en la tabla
  usuarios?: UsuarioSimple[]; // Lista de usuarios asociados (del backend)
}

export interface UsuarioSimple {
  idUsuario: string; // Puede ser "USR-123456789"
  nombre: string;
  email: string;
}

export interface Usuario {
  idUsuario: string; // ID del usuario
  nombre: string;
  email: string;
  rolId?: number;
  rolNombre?: string;
}
