import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ComandaService } from '../../../services/comanda.service';
import { Comanda, DetalleComanda } from '../../../models/comanda.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-detalle-comanda',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-comanda.component.html',
  styleUrls: ['./detalle-comanda.component.css'],
})
export class DetalleComandaComponent implements OnInit {
  comandaId: number = 0;
  comanda: Comanda | null = null;
  loading: boolean = true;
  cocineroId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comandaService: ComandaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.comandaId = +params['id'];
      this.obtenerDatosCocinero();
      this.cargarComanda();
    });
  }

  obtenerDatosCocinero(): void {
    const usuario = this.authService.getUsuario();
    if (usuario) {
      this.cocineroId = (usuario.idUsuario ?? '').toString();
    }
  }

  cargarComanda(): void {
    this.loading = true;

    this.comandaService.getById(this.comandaId).subscribe({
      next: (comanda: Comanda) => {
        this.comanda = comanda;
        console.log('✅ Comanda cargada:', comanda);

        // Cargar detalles de la comanda
        this.cargarDetallesComanda();

        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar comanda:', err);
        alert('Error al cargar la comanda');
        this.loading = false;
        this.volver();
      },
    });
  }

  cargarDetallesComanda(): void {
    this.comandaService.obtenerTodosLosDetalles().subscribe({
      next: (todosDetalles: any[]) => {
        console.log('✅ Todos los detalles cargados para detalle comanda:', todosDetalles);

        // Asignar detalles a la comanda
        if (this.comanda) {
          this.comanda.detalles = todosDetalles.filter(
            (detalle: any) => detalle.comandaId === this.comanda!.comandaId
          );
          console.log(`📋 Detalles asignados a comanda ${this.comanda.comandaId}:`, this.comanda.detalles);
        }
      },
      error: (err: any) => {
        console.error('❌ Error al cargar detalles para detalle comanda:', err);
        if (this.comanda) {
          this.comanda.detalles = [];
        }
      },
    });
  }

  // ===================== ACCIONES DEL COCINERO =====================

  iniciarPreparacion(): void {
    if (!this.cocineroId || !this.comanda) return;

    if (confirm(`¿Iniciar preparación de la comanda #${this.comanda.comandaId}?`)) {
      // Primero asignar cocinero
      this.comandaService.asignarCocinero(this.comanda.comandaId!, this.cocineroId).subscribe({
        next: () => {
          // Luego cambiar estado a EN_PREPARACION (estado 2)
          this.comandaService.cambiarEstadoComanda(this.comanda!.comandaId!, 2).subscribe({
            next: () => {
              alert(`✅ Comanda #${this.comanda!.comandaId} en preparación`);
              this.cargarComanda(); // Recargar datos
            },
            error: (err) => {
              console.error('❌ Error al cambiar estado:', err);
              alert('❌ Error al iniciar preparación');
            },
          });
        },
        error: (err) => {
          console.error('❌ Error al asignar cocinero:', err);
          alert('❌ Error al asignar cocinero');
        },
      });
    }
  }

  marcarComoLista(): void {
    if (!this.comanda) return;

    if (confirm(`¿Marcar como lista la comanda #${this.comanda.comandaId}?`)) {
      this.comandaService.cambiarEstadoComanda(this.comanda.comandaId!, 3).subscribe({
        next: () => {
          alert(`✅ Comanda #${this.comanda!.comandaId} marcada como lista`);
          this.cargarComanda();
        },
        error: (err) => {
          console.error('❌ Error al marcar como lista:', err);
          alert('❌ Error al actualizar estado');
        },
      });
    }
  }

  // ===================== NAVEGACIÓN =====================

  volver(): void {
    this.router.navigate(['/cocinero/comandas-pendientes']);
  }

  // ===================== ESTILO / COLORES =====================

  getEstadoClase(estado: string): string {
    const clases: any = {
      PENDIENTE: 'estado-pendiente',
      EN_PREPARACION: 'estado-preparacion',
      LISTA: 'estado-lista',
    };
    return clases[estado] || '';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      PENDIENTE: 'Pendiente',
      EN_PREPARACION: 'En Preparación',
      LISTA: 'Lista',
    };
    return textos[estado] || estado;
  }

  getEstadoIcono(estado: string): string {
    const iconos: any = {
      PENDIENTE: '⏳',
      EN_PREPARACION: '👨‍🍳',
      LISTA: '✅',
    };
    return iconos[estado] || '📋';
  }

  calcularTotalComanda(): number {
    if (this.comanda?.detalles && Array.isArray(this.comanda.detalles)) {
      return this.comanda.detalles.reduce((sum, detalle) => sum + (detalle.subtotal || 0), 0);
    }
    return this.comanda?.total || 0;
  }

  puedeIniciarPreparacion(): boolean {
    return this.comanda?.estadoNombre === 'PENDIENTE';
  }

  puedeMarcarComoLista(): boolean {
    return this.comanda?.estadoNombre === 'EN_PREPARACION';
  }
}
