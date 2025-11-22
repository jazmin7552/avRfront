import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EstadoService } from '../../services/estado.service';
import { Estado } from '../../models/estado.model';

@Component({
  selector: 'app-estados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './estados.component.html',
  styleUrls: ['./estados.component.css'],
})
export class EstadosComponent implements OnInit {
  estados: Estado[] = [];
  estadoForm: FormGroup;
  editingId: number | null = null;
  loading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  showModal: boolean = false;
  deleteEstado: Estado | null = null;

  constructor(
    private fb: FormBuilder,
    private estadoService: EstadoService,
    private router: Router
  ) {
    this.estadoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(20)]],
    });
  }

  ngOnInit(): void {
    this.loadEstados();
  }

  loadEstados(): void {
    this.loading = true;
    this.estadoService.getAll().subscribe({
      next: (data) => {
        this.estados = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar estados:', error);
        this.showMessage('Error al cargar los estados', 'error');
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.estadoForm.invalid) {
      this.showMessage('Por favor ingresa un nombre para el estado', 'error');
      return;
    }

    const estadoData: Estado = {
      nombre: this.estadoForm.value.nombre.trim(),
    };

    if (this.editingId) {
      estadoData.idEstado = this.editingId;
      this.estadoService.update(this.editingId, estadoData).subscribe({
        next: () => {
          this.showMessage('✓ Estado actualizado exitosamente', 'success');
          this.resetForm();
          this.loadEstados();
        },
        error: (error) => {
          console.error('Error al actualizar estado:', error);
          this.showMessage(error.error?.message || 'Error al actualizar el estado', 'error');
        },
      });
    } else {
      this.estadoService.create(estadoData).subscribe({
        next: () => {
          this.showMessage('✓ Estado creado exitosamente', 'success');
          this.resetForm();
          this.loadEstados();
        },
        error: (error) => {
          console.error('Error al crear estado:', error);
          this.showMessage(error.error?.message || 'Error al crear el estado', 'error');
        },
      });
    }
  }

  editEstado(estado: Estado): void {
    this.editingId = estado.idEstado!;
    this.estadoForm.patchValue({
      nombre: estado.nombre,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.editingId = null;
    this.estadoForm.reset();
  }

  openModal(estado: Estado): void {
    this.deleteEstado = estado;
    this.showModal = true;
  }

  closeModal(): void {
    this.deleteEstado = null;
    this.showModal = false;
  }

  confirmDelete(): void {
    if (!this.deleteEstado?.idEstado) return;

    this.estadoService.delete(this.deleteEstado.idEstado).subscribe({
      next: () => {
        this.showMessage('✓ Estado eliminado exitosamente', 'success');
        this.loadEstados();
        this.closeModal();
      },
      error: (error) => {
        console.error('Error al eliminar estado:', error);
        this.showMessage(error.error?.message || 'Error al eliminar el estado', 'error');
        this.closeModal();
      },
    });
  }

  getEstadoClass(nombre: string): string {
    const nombreLower = nombre.toLowerCase().replace(/_/g, '');

    if (nombreLower.includes('disponible')) return 'estado-disponible';
    if (nombreLower.includes('ocupada')) return 'estado-ocupada';
    if (nombreLower.includes('reservada')) return 'estado-reservada';
    if (nombreLower.includes('pendiente')) return 'estado-pendiente';
    if (nombreLower.includes('preparacion')) return 'estado-preparacion';
    if (nombreLower.includes('lista')) return 'estado-lista';
    if (nombreLower.includes('entregada')) return 'estado-entregada';
    if (nombreLower.includes('pagada')) return 'estado-pagada';

    return 'estado-disponible';
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;

    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  volverDashboard(): void {
    this.router.navigate(['/dashboard-admin']);
  }
}
