import { expect, test, type Page } from '@playwright/test';

async function guided(page:Page, name:string, confirm:string){
  await page.getByRole('button',{name,exact:true}).click();
  const finish=page.getByRole('button',{name:new RegExp(confirm)});
  await expect(finish).toBeEnabled({timeout:16000});
  await finish.click();
}
async function interact(page:Page,id:string){
  const point=page.locator('[data-orbit-point="'+id+'"]');
  await point.click();
  const action=page.getByRole('button',{name:'Interactuar E',exact:true});
  await expect(action).toBeEnabled({timeout:13000});
  await action.click();
}
test('Primera luz starts with design and reaches the Moon only after validated evidence and the search report',async ({page})=>{
  test.setTimeout(105000);
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Bajo otro cielo.'})).toBeVisible();
  // The orbital chapter must not overwrite an expedition another world has already started.
  await page.getByRole('button',{name:'Iniciar expedición'}).click();
  await expect(page.getByRole('button',{name:'Pausa',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Órbita',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Primera luz.'})).toBeVisible();
  await expect(page.getByText('CANAL / CONTROL DE MISIÓN',{exact:true})).toBeVisible();
  await expect(page.locator('.portrait.orbit')).toHaveCount(0);
  await page.getByRole('button',{name:/Registrar objetivo de búsqueda/}).click();
  await page.getByLabel('Órbita de encuentro').selectOption('survey');
  await expect(page.getByText('El lanzador compacto no llega al perfil de reconocimiento; cambia de órbita o lanzador.')).toBeVisible();
  await expect(page.getByRole('button',{name:/Autorizar lanzamiento/})).toBeDisabled();
  await page.getByRole('button',{name:/Propuesta científica/}).click();
  await expect(page.getByRole('button',{name:/Autorizar lanzamiento/})).toBeEnabled();
  await page.getByRole('button',{name:/Propuesta ligera/}).click();
  await page.getByRole('button',{name:/Autorizar lanzamiento/}).click();
  await guided(page,'Guiar ascenso','Confirmar órbita');
  await expect(page.getByRole('button',{name:/Acoplar a la estación/})).toBeDisabled();
  await guided(page,'Guiar acople','Acoplar a la estación');
  await interact(page,'supplies');
  await interact(page,'capsule');
  await expect(page.locator('.portrait.orbit')).toHaveCount(0);
  await expect(page.locator('[data-orbit-point="protected-bay"]')).toBeEnabled();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Primera luz.'})).toBeVisible();
  await expect(page.locator('[data-orbit-point="capsule"]')).toContainText('Registrado');
  await interact(page,'protected-bay');
  await expect(page.locator('.portrait.orbit')).toBeVisible();
  for(const id of ['rest','protection','translator','capsule-auth'])await interact(page,id);
  await expect(page.getByText(/AUR-E01 validada: cápsula de Aurora/)).toBeVisible();
  await page.getByRole('button',{name:/Anclar e iniciar EVA/}).click();
  await expect(page.getByText('EVA / ANCLAJE ACTIVO',{exact:true})).toBeVisible();
  for(const id of ['sun-record','recorder','airlock'])await interact(page,id);
  await expect(page.getByText(/AUR-E02 validada: el archivo del relé lunar/)).toBeVisible();
  await page.getByRole('button',{name:/Traslado de ahorro/}).click();
  await expect(page.getByRole('button',{name:/Confirmar plan de traslado/})).toBeDisabled();
  await page.getByRole('button',{name:/Traslado expreso/}).click();
  await page.getByRole('button',{name:/Confirmar plan de traslado/}).click();
  await guided(page,'Guiar salida','Entrar en crucero');
  await page.getByRole('button',{name:/Acelerar crucero/}).click();
  await expect(page.getByRole('progressbar',{name:'Progreso del crucero'})).not.toHaveAttribute('aria-valuenow','0');
  await page.getByRole('button',{name:/Pausar crucero/}).click();
  const progress=await page.getByRole('progressbar',{name:'Progreso del crucero'}).getAttribute('aria-valuenow');
  await page.reload();
  await expect(page.getByRole('progressbar',{name:'Progreso del crucero'})).toHaveAttribute('aria-valuenow',progress!);
  if(progress!=='100')await page.getByRole('button',{name:/Acelerar crucero/}).click();
  await page.getByRole('button',{name:/Pilotar aproximación lunar/}).click();
  await guided(page,'Guiar llegada','Acoplar al nodo lunar');
  const report=page.getByRole('region',{name:'Informe de misión'});
  await expect(report).toContainText('5/6');
  await expect(report).toContainText('AUR-E01');
  await expect(report).toContainText('AUR-E02');
  await expect(report).not.toContainText(/AUR-E03|Bennu|Marte/);
  await page.getByRole('button',{name:/Cerrar informe de búsqueda/}).click();
  await expect(report).toContainText('6/6');
  await page.getByRole('button',{name:/Continuar a la Luna/}).click();
  await expect(page.getByRole('region',{name:'Entrega desde Órbita'})).toContainText('AUR-E01 · AUR-E02');
  await expect(page.getByRole('heading',{name:'Bajo otro cielo.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Pausa',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region',{name:'Entrega desde Órbita'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Pausa',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('flying outside the corridor produces a recoverable failure report',async ({page})=>{
  await page.goto('/?world=orbit');
  await page.getByRole('button',{name:/Registrar objetivo de búsqueda/}).click();
  await page.getByRole('button',{name:/Autorizar lanzamiento/}).click();
  await page.getByRole('button',{name:/Tomar controles/}).click();
  await page.keyboard.down('q');
  try {
    await expect(page.getByRole('heading',{name:'Maniobra interrumpida'})).toBeVisible({timeout:12000});
  } finally { await page.keyboard.up('q'); }
  await page.getByRole('button',{name:'Ver informe del intento'}).click();
  await expect(page.getByRole('region',{name:'Informe del intento'})).toContainText('La posición relativa salió');
  await page.getByRole('button',{name:/Reintentar desde el control anterior/}).click();
  await expect(page.getByRole('button',{name:'Guiar ascenso'})).toBeEnabled();
});
