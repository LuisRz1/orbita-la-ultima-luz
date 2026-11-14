// Valores aproximados publicados por NASA para observación desde la ISS.
// No son efemérides de la estación ficticia ni datos de navegación operativa.
export const lowOrbitReference = {
  altitudeKm:400,
  periodMinutes:90,
  source:'https://www.nasa.gov/missions/station/iss-research/observing-our-planet-from-low-earth-orbit/',
} as const;

export function observationModel(altitudeKm:number, windowHours:number) {
  // Periodo circular relativo a la referencia. Una pasada por vuelta es
  // una regla del escenario, sin pretender predecir cobertura o línea de vista.
  const earthMeanRadiusKm=6371;
  const ratio=(earthMeanRadiusKm+altitudeKm)/(earthMeanRadiusKm+lowOrbitReference.altitudeKm);
  const periodMinutes=lowOrbitReference.periodMinutes*ratio**1.5;
  const passes=Math.floor(windowHours*60/periodMinutes);
  return {periodMinutes,passes, scienceLimit:4*passes};
}
