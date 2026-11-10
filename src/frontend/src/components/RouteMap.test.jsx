import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import RouteMap, { getOrderedRouteStops } from './RouteMap';

afterEach(cleanup);

describe('RouteMap', () => {
  it('dibuja paradas numeradas y la línea en el orden de la ruta', () => {
    render(
      <RouteMap
        stops={[
          { id: 2, name: 'Entrega B', lat: -12.05, lng: -77.04 },
          { id: 1, name: 'Entrega A', lat: -12.04, lng: -77.03, window_start: '09:00', window_end: '10:00' },
        ]}
      />,
    );

    expect(screen.getByRole('region', { name: 'Mapa de la ruta sugerida' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /Mapa con 2 paradas/ })).toBeTruthy();
    expect(screen.getByText('1', { selector: 'svg text' })).toBeTruthy();
    expect(screen.getByText('2', { selector: 'svg text' })).toBeTruthy();
    expect(document.querySelector('svg polyline')).toBeTruthy();
    expect(screen.getByText(/OpenStreetMap/)).toBeTruthy();
    expect(screen.getByText(/línea recta entre coordenadas/)).toBeTruthy();
    expect(document.querySelector('svg g title').textContent).toContain('Entrega B');
    expect(document.querySelectorAll('svg image').length).toBeGreaterThan(0);
  });

  it('permite acercar y alejar el mapa', () => {
    render(<RouteMap stops={[{ id: 1, name: 'Entrega', lat: -12.05, lng: -77.04 }]} />);

    const tileImages = () => [...document.querySelectorAll('svg image')].map((image) => image.getAttribute('href'));
    const initialTiles = tileImages();
    fireEvent.click(screen.getByRole('button', { name: 'Acercar mapa' }));
    expect(tileImages()).not.toEqual(initialTiles);
    fireEvent.click(screen.getByRole('button', { name: 'Alejar mapa' }));
    expect(tileImages()).toEqual(initialTiles);
  });

  it('usa coordenadas de clientes en orden y evita confundir nombres duplicados', () => {
    const stops = getOrderedRouteStops(
      { route: ['Cliente', 'Cliente'] },
      [
        { id: 1, name: 'Cliente', latitude: -12.01, longitude: -77.01 },
        { id: 2, name: 'Cliente', latitude: -12.02, longitude: -77.02 },
      ],
    );

    expect(stops).toEqual([
      { id: 1, name: 'Cliente', lat: -12.01, lng: -77.01 },
      { id: 2, name: 'Cliente', lat: -12.02, lng: -77.02 },
    ]);
  });

  it('no intenta representar coordenadas inválidas', () => {
    render(<RouteMap stops={[{ id: 1, name: 'Entrega inválida', lat: 100, lng: 500 }]} />);

    expect(screen.getByText('No hay coordenadas válidas para mostrar esta ruta en el mapa.')).toBeTruthy();
  });
});
