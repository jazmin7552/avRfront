export interface Rol {
  idRol?: number;
  nombre: string;
  cantidadUsuarios?: number;
}

export interface RolResponse {
  roles?: Rol[];
  data?: Rol[];
  mensaje?: string;
}
