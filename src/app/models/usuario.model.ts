export interface Usuario {
  idUsuario?: string;
  nombre: string;
  email: string;
  password?: string;
  roles?: Rol[];
  telefonos?: Telefono[];
}

export interface Rol {
  idRol?: number;
  nombre: string;
}

export interface Telefono {
  idTelefono?: number;
  numero: string;
}
