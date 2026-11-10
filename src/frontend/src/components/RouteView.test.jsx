import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import RouteView from './RouteView';

afterEach(cleanup);

describe('RouteView', () => {
  it('muestra las rutas asignadas, su carga y los pedidos no asignados', () => {
    render(
      <RouteView
        result={{
          route: ['Pedido 1', 'Pedido 2'],
          route_stops: [
            { id: 1, name: 'Pedido 1', lat: -12.05, lng: -77.04, demand_kg: 60 },
            { id: 2, name: 'Pedido 2', lat: -12.06, lng: -77.05, demand_kg: 40 },
          ],
          routes: [
            {
              vehicle: { id: 1, plate: 'AAA-111' },
              route: ['Pedido 1'],
              route_stops: [{ id: 1, name: 'Pedido 1', lat: -12.05, lng: -77.04 }],
              load_kg: 60,
              capacity_kg: 100,
            },
            {
              vehicle: { id: 2, plate: 'BBB-222' },
              route: ['Pedido 2'],
              route_stops: [{ id: 2, name: 'Pedido 2', lat: -12.06, lng: -77.05 }],
              load_kg: 40,
              capacity_kg: 100,
            },
          ],
          unassigned: [
            { id: 3, name: 'Pedido 3', reason: 'CAPACIDAD_COMBINADA_INSUFICIENTE', detail: 'Capacidad insuficiente.' },
          ],
          total_distance_km: 2,
          estimated_time_minutes: 30,
          total_cost: 3,
          total_co2_kg: 1,
        }}
        customers={[]}
        vehicles={[]}
        selectedVehicleId=""
        onVehicleChange={vi.fn()}
        onOptimize={vi.fn()}
        loading={false}
        canOptimize={false}
      />,
    );

    expect(screen.getByText('2 rutas')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Vehículo AAA-111' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Vehículo BBB-222' })).toBeTruthy();
    expect(screen.getByText('Carga: 60 / 100 kg')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pedidos sin asignar (1)' })).toBeTruthy();
    expect(screen.getByText(/Capacidad insuficiente\./)).toBeTruthy();
  });

  it('permite seleccionar vehículo activo y optimizar, mostrando la ruta y sus métricas', () => {
    const onVehicleChange = vi.fn();
    const onOptimize = vi.fn();
    render(
      <RouteView
        result={{
          route: ['Almacén', 'Cliente Uno'],
          route_stops: [
            { id: 8, name: 'Almacén', lat: -12.045, lng: -77.043 },
            { id: 1, name: 'Cliente Uno', lat: -12.05, lng: -77.04, window_start: '09:00:00', window_end: '11:00:00' },
          ],
          total_distance_km: 8.5,
          estimated_time_minutes: 42,
          total_cost: 17.25,
          total_co2_kg: 2.3,
        }}
        customers={[
          { id: 1, name: 'Cliente Uno', window_start: '09:00:00', window_end: '11:00:00' },
          { id: 2, name: 'Cliente Dos' },
        ]}
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
      'Asignación automática (vehículos activos)',
      'ABC-123 · Diésel',
    ]);
    fireEvent.change(vehicleSelect, { target: { value: '3' } });
    expect(onVehicleChange).toHaveBeenCalledWith('3');
    fireEvent.click(screen.getByRole('button', { name: 'Optimizar ruta' }));
    expect(onOptimize).toHaveBeenCalledOnce();
    expect(screen.getByText('Almacén')).toBeTruthy();
    expect(screen.getByText('Cliente Uno')).toBeTruthy();
    expect(screen.getByText('· Entrega 09:00–11:00')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Mapa de la ruta sugerida' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /Mapa con 2 paradas/ })).toBeTruthy();
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
