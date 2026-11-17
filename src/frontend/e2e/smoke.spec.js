import { test, expect } from '@playwright/test';

test('muestra la pantalla de inicio de sesión', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
});

test('rechaza credenciales inválidas sin exponer datos', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('invalido@distrirapido.pe');
  await page.getByLabel('Contraseña').fill('ClaveInvalida1!');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test('permite ingresar y navegar por los módulos con credenciales E2E', async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  test.skip(!email || !password, 'Se requieren E2E_EMAIL y E2E_PASSWORD');

  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Planificador de rutas' })).toBeVisible();

  await page.getByRole('button', { name: 'Pedidos' }).click();
  await expect(page.getByRole('heading', { name: 'Clientes y pedidos' })).toBeVisible();
  await page.getByRole('button', { name: 'Rutas' }).click();
  await expect(page.getByRole('heading', { name: 'Planificación de rutas' })).toBeVisible();
});
