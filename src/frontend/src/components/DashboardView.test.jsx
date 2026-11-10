import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import DashboardView from './DashboardView';

afterEach(cleanup);

const metricValue = (label) =>
  screen.getByText(label, { selector: '.stat-card span' }).nextElementSibling.textContent;

describe('DashboardView', () => {
  it('muestra métricas, cuenta solo vehículos activos y presenta el último resultado', () => {
    render(
      <DashboardView
        customers={[{ id: 1 }, { id: 2 }]}
        vehicles={[
          { id: 1, status: 'ACTIVO' },
          { id: 2, status: 'EN_MANTENIMIENTO' },
          { id: 3, status: 'ACTIVO' },
        ]}
        result={{
          total_distance_km: 12.5,
          total_cost: 34.2,
          total_co2_kg: 3.4,
          message: 'Ruta calculada.',
          fuel_type: 'diesel',
          vehicle: { plate: 'ABC-123' },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Panel operativo' })).toBeTruthy();
    expect(metricValue('Clientes registrados')).toBe('2');
    expect(metricValue('Vehículos activos')).toBe('2');
    expect(screen.getByText('12.5 km')).toBeTruthy();
    expect(screen.getByText('S/ 34.2')).toBeTruthy();
    expect(screen.getByText('3.4 kg')).toBeTruthy();
    expect(screen.getByText('Ruta calculada.')).toBeTruthy();
    expect(screen.getByText('Vehículo: ABC-123 · Diésel')).toBeTruthy();
  });

  it('usa valores de respaldo y muestra combustible sin placa cuando falta el vehículo', () => {
    render(
      <DashboardView
        customers={[]}
        vehicles={[]}
        result={{ message: 'Sin ruta.', fuel_type: 'gnv', vehicle: null }}
      />,
    );

    expect(metricValue('Clientes registrados')).toBe('0');
    expect(metricValue('Vehículos activos')).toBe('0');
    expect(screen.getByText('0 km')).toBeTruthy();
    expect(screen.getByText('S/ 0')).toBeTruthy();
    expect(screen.getByText('0 kg')).toBeTruthy();
    expect(screen.getByText('Vehículo: Sin asignar · GNV')).toBeTruthy();
  });

  it('no muestra información de vehículo cuando el resultado no tiene combustible', () => {
    render(
      <DashboardView
        customers={[]}
        vehicles={[]}
        result={{ message: 'Sin datos', total_distance_km: 0, total_cost: 0, total_co2_kg: 0 }}
      />,
    );

    expect(screen.queryByText(/^Vehículo:/)).toBeNull();
  });
});
