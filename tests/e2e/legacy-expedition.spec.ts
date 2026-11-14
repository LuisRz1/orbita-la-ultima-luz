import { expect, test, type Page } from '@playwright/test';

async function act(page:Page,id:string) {
  const objective=page.locator('[data-point="'+id+'"]');
  await objective.click();
  const action=page.getByRole('button',{name:/Interactuar|Interact/});
  await expect(action).toBeEnabled({timeout:8000});
  await action.click();
  await expect(objective).toContainText(/Registrado|Recorded/);
}
test('lunar report requires tools, local return, and survives reload',async ({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?legacy');
  await expect(page.getByRole('heading',{name:'Bajo otro cielo.'})).toBeVisible();
  await page.getByRole('button',{name:'Iniciar expedición'}).click();
  await page.locator('[data-point="terminal"]').click();
  await page.getByRole('button',{name:'Interactuar E'}).click();
  await expect(page.getByText('Faltan requisitos. Consulta la lista de objetivos.')).toBeVisible();
  await act(page,'archive');
  await act(page,'relay');
  await page.reload();
  await expect(page.locator('[data-point="relay"]')).toContainText('Registrado');
  await act(page,'sample');
  await act(page,'terminal');
  await expect(page.getByRole('region',{name:'Informe de misión'})).toContainText('Transmisión recibida');
  await expect(page.getByRole('region',{name:'Informe de misión'})).toContainText('4/4');
  await page.reload();
  await expect(page.getByRole('region',{name:'Informe de misión'})).toBeVisible();
  await page.getByRole('button',{name:'Volver a planificar'}).click();
  await expect(page.getByRole('button',{name:'Iniciar expedición'})).toBeEnabled();
  expect(errors).toEqual([]);
});
test('Mars uses the same start, controls, assets and exit without sharing the lunar slot',async ({page})=>{
  await page.goto('/?legacy');
  await page.getByRole('button',{name:'Marte',exact:true}).click();
  await expect(page.getByRole('heading',{name:'El mundo rojo.'})).toBeVisible();
  await page.getByRole('button',{name:'Cambiar idioma a inglés'}).click();
  await page.getByRole('button',{name:'Start expedition'}).click();
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Expedition paused'})).toBeVisible();
  await page.getByRole('button',{name:/Resume ↗/}).click();
  await act(page,'survey'); await act(page,'package'); await act(page,'relay'); await act(page,'terminal');
  await expect(page.getByRole('region',{name:'Mission report'})).toBeVisible();
  await page.getByRole('button',{name:'Moon',exact:true}).click();
  await expect(page.getByRole('button',{name:'Start expedition'})).toBeEnabled();
});
