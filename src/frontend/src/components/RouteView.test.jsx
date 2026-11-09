import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import RouteView from './RouteView';

afterEach(cleanup);

describe('RouteView', () => {
  it('permite seleccionar vehículo activo y optimizar, mostrando la ruta y sus métricas', () => {
    const onVehicleChange = vi.fn();
    const onOptimize = vi.fn();
    render(
      <RouteView
        result={{
          route: ['Almacén', 'Cliente Uno'],
          total_distance_km: 8.5,
          estimated_time_minutes: 42,
          total_cost: 17.25,
          total_co2_kg: 2.3,
        }}
        customers={[{ id: 1 }, { id: 2 }]}
        vehicles={[
          { id: 3, plate: 'ABC-123', fuel_type: 'diesel', status: 'ACTIVO' },
          { id: 4, plate: 'XYZ-789', fuel_type: 'gnv', status: 'EN_MANTENIMIENTO' },
        ]}
        selectedVehicleId=""
        onVehicleChange={onVehicleChange}
        onOptimize={onOptimize}
        loading={false}
        canOptimize
      />,
    );

    expect(screen.getByRole('heading', { name: 'Planificación de rutas' })).toBeTruthy();
    expect(screen.getByText('2 paradas')).toBeTruthy();
    const vehicleSelect = screen.getByRole('combobox', { name: 'Vehículo' });
    expect(within(vehicleSelect).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Sin asignar (referencia diésel)',
      'ABC-123 · Diésel',
    ]);
    fireEvent.change(vehicleSelect, { target: { value: '3' } });
    expect(onVehicleChange).toHaveBeenCalledWith('3');
    fireEvent.click(screen.getByRole('button', { name: 'Optimizar ruta' }));
    expect(onOptimize).toHaveBeenCalledOnce();
    expect(screen.getByText('Almacén')).toBeTruthy();
    expect(screen.getByText('Cliente Uno')).toBeTruthy();
    expect(screen.getByText('8.5 km')).toBeTruthy();
    expect(screen.getByText('42 min')).toBeTruthy();
    expect(screen.getByText('S/ 17.25')).toBeTruthy();
    expect(screen.getByText('2.3 kg')).toBeTruthy();
  });

  it('muestra estado de carga y deshabilita la optimización', () => {
    render(
      <RouteView
        result={{ route: [] }}
        customers={[]}
        vehicles={[]}
        selectedVehicleId=""
        onVehicleChange={vi.fn()}
        onOptimize={vi.fn()}
        loading
        canOptimize
      />,
    );

    expect(screen.getByRole('button', { name: 'Optimizando...' }).disabled).toBe(true);
  });

  it('oculta controles si no puede optimizar y usa valores vacíos para el resultado', () => {
    render(
      <RouteView
        result={{}}
        customers={[]}
        vehicles={[]}
        selectedVehicleId=""
        onVehicleChange={vi.fn()}
        onOptimize={vi.fn()}
        loading={false}
        canOptimize={false}
      />,
    );

    expect(screen.getByText('0 paradas')).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: 'Vehículo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Optimizar ruta' })).toBeNull();
    expect(screen.getByText('0 km')).toBeTruthy();
    expect(screen.getByText('0 min')).toBeTruthy();
    expect(screen.getByText('S/ 0')).toBeTruthy();
    expect(screen.getByText('0 kg')).toBeTruthy();
  });
});
