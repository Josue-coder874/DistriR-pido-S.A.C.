import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import OrdersView from './OrdersView';

afterEach(cleanup);

describe('OrdersView', () => {
  it('registra una entrega convirtiendo coordenadas y prioridad a números y limpia el formulario', () => {
    const onAddCustomer = vi.fn();
    render(
      <OrdersView
        customers={[{ id: 1, name: 'Cliente Uno', address: 'Av. Lima 123' }]}
        canEdit
        onAddCustomer={onAddCustomer}
        submitting={false}
        message=""
      />,
    );

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Nuevo cliente' } });
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Jr. Sol 456' } });
    fireEvent.change(screen.getByLabelText('Latitud'), { target: { value: '-12.05' } });
    fireEvent.change(screen.getByLabelText('Longitud'), { target: { value: '-77.04' } });
    fireEvent.change(screen.getByLabelText('Prioridad'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Demanda del pedido (kg)'), { target: { value: '62.5' } });
    fireEvent.change(screen.getByLabelText('Entrega desde'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('Entrega hasta'), { target: { value: '11:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));

    expect(onAddCustomer).toHaveBeenCalledWith({
      name: 'Nuevo cliente',
      address: 'Jr. Sol 456',
      latitude: -12.05,
      longitude: -77.04,
      priority: 4,
      demand_kg: 62.5,
      window_start: '09:00',
      window_end: '11:30',
    });
    expect(screen.getByLabelText('Cliente').value).toBe('');
    expect(screen.getByLabelText('Dirección').value).toBe('');
    expect(screen.getByLabelText('Latitud').value).toBe('');
    expect(screen.getByLabelText('Longitud').value).toBe('');
    expect(screen.getByLabelText('Prioridad').value).toBe('1');
    expect(screen.getByLabelText('Demanda del pedido (kg)').value).toBe('');
    expect(screen.getByLabelText('Entrega desde').value).toBe('');
    expect(screen.getByLabelText('Entrega hasta').value).toBe('');
    expect(screen.getByText('1 registros')).toBeTruthy();
    expect(screen.getByText('Cliente Uno')).toBeTruthy();
    expect(screen.getByText('Av. Lima 123')).toBeTruthy();
  });

  it('muestra la ventana de entrega en el listado', () => {
    render(
      <OrdersView
        customers={[{ id: 1, name: 'Cliente Uno', address: 'Av. Lima 123', window_start: '09:00:00', window_end: '11:30:00' }]}
        canEdit={false}
        onAddCustomer={vi.fn()}
        submitting={false}
        message=""
      />,
    );

    expect(screen.getByText('Entrega: 09:00–11:30')).toBeTruthy();
  });

  it('muestra mensaje de estado y desactiva el envío mientras guarda', () => {
    render(
      <OrdersView
        customers={[]}
        canEdit
        onAddCustomer={vi.fn()}
        submitting
        message="Pedido en proceso."
      />,
    );

    expect(screen.getByRole('status').textContent).toBe('Pedido en proceso.');
    expect(screen.getByRole('button', { name: 'Guardando...' }).disabled).toBe(true);
  });

  it('en modo de solo lectura omite el formulario y mantiene el listado', () => {
    render(
      <OrdersView
        customers={[{ id: 2, name: 'Cliente existente', address: 'Calle Norte 10' }]}
        canEdit={false}
        onAddCustomer={vi.fn()}
        submitting={false}
        message=""
      />,
    );

    expect(screen.queryByRole('heading', { name: 'Registrar entrega' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Registrar pedido' })).toBeNull();
    expect(screen.getByText('1 registros')).toBeTruthy();
    expect(screen.getByText('Cliente existente')).toBeTruthy();
  });
});
