import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ComandaService } from '../../../services/comanda.service';
import { MesaService } from '../../../services/mesa.service';
import { Mesa } from '../../../models/mesa.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-ver-cuenta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-cuenta.component.html',
  styleUrls: ['./ver-cuenta.component.css'],
})
export class VerCuentaComponent implements OnInit {
  idMesa: number | null = null;
  mesa: Mesa | null = null;
  comandas: any[] = [];
  loading: boolean = true;

  subtotal: number = 0;
  propinaSugerida: number = 0;
  totalGeneral: number = 0;
  totalProductos: number = 0;

  constructor(
    private comandaService: ComandaService,
    private mesaService: MesaService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['idMesa']) {
        this.idMesa = +params['idMesa'];
        this.cargarDatos();
      } else {
        console.error('No se proporcionó ID de mesa');
        this.router.navigate(['/mesero/dashboard']);
      }
    });
  }

  cargarDatos(): void {
    if (!this.idMesa) return;

    this.loading = true;

    // Cargar información de la mesa
    this.mesaService.getById(this.idMesa).subscribe({
      next: (mesa: Mesa) => {
        this.mesa = mesa;
        console.log('✅ Mesa cargada:', mesa);
      },
      error: (err: any) => {
        console.error('❌ Error al cargar mesa:', err);
        alert('Error al cargar la información de la mesa');
      },
    });

    // 🔥 CORRECCIÓN: Usar el endpoint correcto para mesero
    // Cargar SOLO las comandas de esta mesa que pertenecen al mesero autenticado
    this.comandaService.getMisComandasDeMesa(this.idMesa).subscribe({
      next: (comandasDeMesa: any[]) => {
        console.log('📦 Mis comandas de esta mesa (TODAS):', comandasDeMesa);

        // 🔥 FILTRAR: Solo comandas ACTIVAS (estados 4=PENDIENTE y 5=LISTA)
        // Excluir 6=ENTREGADA y 7=CANCELADA
        this.comandas = comandasDeMesa.filter((comanda: any) => {
          const estadoId = comanda.estadoId || comanda.estado?.idEstado || comanda.estado;
          const estadoNombre = comanda.estadoNombre || comanda.estado?.nombre || '';

          // Solo incluir estados 4 (PENDIENTE) y 5 (LISTA)
          const esActiva =
            estadoId === 4 ||
            estadoId === 5 ||
            estadoNombre === 'PENDIENTE' ||
            estadoNombre === 'LISTA';

          if (!esActiva) {
            console.log(
              `🚫 Comanda #${comanda.idComanda} excluida (Estado: ${estadoNombre || estadoId})`
            );
          }

          return esActiva;
        });

        console.log(`🎯 Comandas ACTIVAS filtradas para mesa ${this.idMesa}:`, this.comandas);

        // ✅ CARGAR DETALLES ESPECÍFICOS DE CADA COMANDA
        this.cargarDetallesComandas();
      },
      error: (err: any) => {
        console.error('❌ Error al cargar comandas:', err);
        this.loading = false;

        // Mensaje más amigable según el error
        if (err.status === 403) {
          alert('No tienes permisos para ver las comandas de esta mesa');
          this.router.navigate(['/mesero/dashboard']);
        } else if (err.status === 404) {
          // No hay comandas, no es un error real
          console.log('ℹ️ No hay comandas en esta mesa');
          this.comandas = [];
          this.calcularTotales();
          this.cdr.detectChanges();
        } else {
          alert('Error al cargar las comandas de la mesa');
        }
      },
    });
  }

  // ✅ MÉTODO CORREGIDO: Cargar detalles específicos por cada comandaId
  cargarDetallesComandas(): void {
    if (this.comandas.length === 0) {
      this.loading = false;
      this.calcularTotales();
      this.cdr.detectChanges();
      return;
    }

    // Crear array de observables para cargar detalles de cada comanda
    const detallesObservables = this.comandas.map((comanda: any) => {
      // 🔍 BUSCAR TODOS LOS POSIBLES CAMPOS DE ID
      const idComanda = comanda.comandaId || comanda.idComanda || comanda.id;

      console.log('🔍 Ver Cuenta - Buscando detalles para comanda:', {
        comandaCompleta: comanda,
        idEncontrado: idComanda,
      });

      if (!idComanda) {
        console.warn('⚠️ Comanda sin ID válido:', comanda);
        return of([]);
      }

      // 🔥 USAR ENDPOINT DE MESERO PARA DETALLES
      return this.comandaService.getMisDetallesComanda(idComanda).pipe(
        catchError((err) => {
          console.error(`❌ Error al cargar detalles de comanda #${idComanda}:`, err);
          return of([]);
        })
      );
    });

    // Ejecutar todas las peticiones en paralelo
    forkJoin(detallesObservables).subscribe({
      next: (todosLosDetalles: any[]) => {
        // Asignar detalles correspondientes a cada comanda
        this.comandas.forEach((comanda: any, index: number) => {
          comanda.detalles = todosLosDetalles[index];
          const idComanda = comanda.comandaId || comanda.idComanda || comanda.id;
          console.log(`✅ Detalles asignados a comanda #${idComanda}:`, comanda.detalles);
        });

        this.calcularTotales();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error general al cargar detalles:', err);
        this.comandas.forEach((comanda: any) => {
          comanda.detalles = [];
        });
        this.calcularTotales();
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  calcularTotales(): void {
    this.subtotal = this.comandas.reduce((sum, comanda) => sum + (comanda.total || 0), 0);
    this.propinaSugerida = this.subtotal * 0.1;
    this.totalGeneral = this.subtotal + this.propinaSugerida;

    this.totalProductos = this.comandas.reduce((sum, comanda) => {
      if (comanda.detalles && Array.isArray(comanda.detalles)) {
        return (
          sum +
          comanda.detalles.reduce(
            (detSum: number, detalle: any) => detSum + (detalle.cantidad || 0),
            0
          )
        );
      }
      return sum;
    }, 0);

    console.log('💰 Totales calculados:', {
      subtotal: this.subtotal,
      propina: this.propinaSugerida,
      total: this.totalGeneral,
      productos: this.totalProductos,
    });
  }

  todasComandasServidas(): boolean {
    if (!this.comandas || this.comandas.length === 0) return false;

    // 🔥 CORRECCIÓN: Todas las comandas deben estar en estado LISTA (5)
    // para poder cerrar la cuenta
    return this.comandas.every((comanda) => {
      const estadoId = comanda.estadoId || comanda.estado?.idEstado || comanda.estado;
      const estadoNombre = comanda.estadoNombre || comanda.estado?.nombre || '';

      return estadoId === 5 || estadoNombre === 'LISTA';
    });
  }

  imprimirCuenta(): void {
    window.print();
  }

  cerrarCuenta(): void {
    if (!this.todasComandasServidas()) {
      alert('⚠️ No se puede cerrar la cuenta. Todas las comandas deben estar en estado LISTA.');
      return;
    }

    const mesaNombre = this.mesa?.numeroMesa || `Mesa ${this.idMesa}`;

    if (
      !confirm(
        `¿Cerrar la cuenta de ${mesaNombre}? Total: $${this.totalGeneral.toLocaleString('es-CO')}`
      )
    ) {
      return;
    }

    if (!this.idMesa || !this.mesa) return;

    // Cambiar estado de la mesa a 1 = DISPONIBLE
    this.mesaService.cambiarEstado(this.idMesa, 1).subscribe({
      next: () => {
        alert('✅ Cuenta cerrada exitosamente');
        this.router.navigate(['/mesero/dashboard']);
      },
      error: (err: any) => {
        console.error('❌ Error al cerrar cuenta:', err);
        alert('Error al cerrar la cuenta. Por favor intenta nuevamente.');
      },
    });
  }

  volver(): void {
    this.router.navigate(['/mesero/dashboard']);
  }
}
