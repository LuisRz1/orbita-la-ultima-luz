// Entry point. The 3D game is the default; the earlier 2D kit stays reachable with ?legacy until parity.
const root = document.getElementById('root')!;

if (new URLSearchParams(window.location.search).has('legacy')) {
  const { mountLegacy } = await import('./legacy/LegacyApp.tsx');
  mountLegacy(root);
} else {
  document.body.style.margin = '0';
  document.body.style.background = '#0b0f14';
  const [{ createRoot }, { App }] = await Promise.all([import('react-dom/client'), import('./ui/app.tsx')]);
  createRoot(root).render(<App />);
}
