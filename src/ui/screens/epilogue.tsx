// «Las cosas que quedan» (C4-M06), told until 3D flight exists: the return, the reception of every survivor
// (AUR-E07), what the player brought back, and LUMA's place of remembrance. Written text; no new LUMA lines.
import { useStore } from 'zustand';
import { useT } from '../i18n.ts';
import { hud } from '../store.ts';

export function Epilogue({ onClose }: { onClose(): void }) {
  const { t } = useT();
  const finale = useStore(hud, s => s.finale);
  if (!finale) return null;
  const m = finale.memories;
  return <div className="screen epilogue-screen" role="dialog" aria-label={t('epilogue')} data-epilogue>
    <section className="epilogue">
      <span className="panel-title">C4-M06 · {t('epilogue').toUpperCase()}</span>
      <h2>{t({ es: 'Las cosas que quedan', en: 'The things that remain' })}</h2>
      <p>{t({ es: 'La nave cruza de vuelta con cinco personas a bordo. Nadie habla mucho. Tu hermana duerme a ratos con la mano apoyada en el compartimento seguro.',
        en: 'The ship crosses back with five people aboard. Nobody talks much. Your sister sleeps now and then with her hand resting on the safe compartment.' })}</p>
      <p>{t({ es: 'En la Tierra, el equipo de recepción cuenta a los supervivientes uno por uno. Cuatro. Todos. AUR-E07 queda validada.',
        en: 'On Earth, the reception team counts the survivors one by one. Four. All of them. AUR-E07 is validated.' })}</p>
      <p>{t({ es: 'Entregas el archivo de Aurora, la muestra de Bennu y el informe. Lo que es dato lleva su fuente; lo que es historia, su nombre.',
        en: 'You hand over Aurora’s archive, the Bennu sample and the report. What is data carries its source; what is story, its name.' })}</p>
      <ul className="epilogue-stats">
        <li><b>{m.pages.length}</b><span>{t({ es: 'páginas de su diario', en: 'pages of her journal' })}</span></li>
        <li><b>{m.atlas}</b><span>{t({ es: 'rocas en el atlas', en: 'rocks in the atlas' })}</span></li>
        <li><b>{m.echoes}</b><span>{t({ es: 'ecos de Aurora', en: 'Aurora echoes' })}</span></li>
      </ul>
      <p className="remembrance">{t({ es: 'En la nave queda un hueco cálido junto a la ventana. Es el lugar de LUMA. Sus grabaciones están en el archivo, con fecha y nombre, como todo lo que trajimos.',
        en: 'On the ship there is a warm space by the window. It is LUMA’s place. Its recordings are in the archive, dated and named, like everything we brought back.' })}</p>
      <p className="absence" data-absence>{t({ es: 'En la siguiente salida, al entrar en una sombra, esperas un brillo cálido junto al casco. Pulsas F por costumbre. Nadie corre delante a buscar nada: ahora el rastro lo sigues tú.',
        en: 'On the next sortie, stepping into a shadow, you wait for a warm glow by your helmet. You press F out of habit. Nobody runs ahead to find anything: now you follow the trail yourself.' })}</p>
      <p className="model-note">{t({ es: 'El regreso pilotado (M06) aún no es jugable: aquí se cuenta.', en: 'The piloted return (M06) is not playable yet: it is told here.' })}</p>
      <button className="primary" data-epilogue-close onClick={onClose}>{t('back')}</button>
    </section>
  </div>;
}
