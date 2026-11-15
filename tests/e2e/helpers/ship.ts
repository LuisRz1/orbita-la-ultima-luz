import { expect, type Page } from '@playwright/test';

type Api=Record<string,(...args:unknown[])=>unknown>;
async function station(page:Page,id:string){
  await page.evaluate(id=>(window.__orbita as unknown as Api).station(id),id);
}
export async function prepareShip(page:Page,{first,drill}:{first:boolean;drill?:boolean}){
  await expect(page.locator('.ship-screen')).toBeVisible();
  if(first){
    for(const s of ['battery','thruster','antenna']){
      await station(page,s);
      const panel=page.locator('[data-station="'+s+'"]');
      await expect(panel).toBeVisible();
      await panel.locator('[data-confirm]').click();
    }
  }else{
    await station(page,'battery');
    await page.locator('[data-option="extended"]').click();
    await page.locator('[data-confirm]').click();
  }
  await station(page,'instruments');
  const button=page.locator('[data-instrument="drill"]');
  await expect(button).toBeVisible();
  if(drill!==undefined&&(await button.getAttribute('aria-pressed')==='true')!==drill)await button.click();
  const kit=page.locator('[data-instrument="kit"]');
  if(!first&&await kit.getAttribute('aria-pressed')==='true')await kit.click();
  if(drill===false)await expect(button).toHaveAttribute('aria-pressed','false');
  await page.locator('[data-confirm]').click();
  await station(page,'locker');
  await station(page,'airlock');
  await page.evaluate(()=>(window.__orbita as unknown as Api).step(63));
  await expect(page.locator('.ship-screen')).toHaveCount(0);
}
