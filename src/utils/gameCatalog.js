export const GAME_FAMILIES = [
  {
    id: 'numbers',
    name: 'Loterías de números',
    shortName: 'Números',
    description: 'Combinaciones numéricas y elementos adicionales según las reglas de cada sorteo.',
  },
  {
    id: 'national',
    name: 'Lotería Nacional',
    shortName: 'Nacional',
    description: 'Décimos, números, series y sorteos ordinarios o extraordinarios.',
  },
  {
    id: 'sports',
    name: 'Apuestas deportivas',
    shortName: 'Deportes',
    description: 'Pronósticos deportivos con modelos de boleto propios.',
  },
  {
    id: 'horse',
    name: 'Apuestas hípicas',
    shortName: 'Hípicas',
    description: 'Pronósticos de carreras con reglas y validaciones específicas.',
  },
];

const ACTIVE_CAPABILITIES = {
  createCombination: true,
  manualEntry: true,
  resultChecking: true,
  history: true,
  statisticalLab: true,
  officialData: true,
};

const REVIEW_CAPABILITIES = {
  createCombination: false,
  manualEntry: false,
  resultChecking: false,
  history: false,
  statisticalLab: false,
  officialData: false,
};

export const GAME_CATALOG = {
  euromillones: {
    id: 'euromillones',
    name: 'Euromillones',
    shortName: 'Euromillones',
    familyId: 'numbers',
    description: 'Cinco números y dos estrellas por apuesta simple. El código El Millón, cuando exista, se registra aparte y no se genera en Primy.',
    betModel: 'Combinación numérica con estrellas',
    availability: 'active',
    capabilities: ACTIVE_CAPABILITIES,
  },
  primitiva: {
    id: 'primitiva',
    name: 'La Primitiva',
    shortName: 'Primitiva',
    familyId: 'numbers',
    description: 'Seis números, complementario y reintegro por resguardo.',
    betModel: 'Combinación numérica',
    availability: 'active',
    capabilities: ACTIVE_CAPABILITIES,
  },
  bonoloto: {
    id: 'bonoloto',
    name: 'Bonoloto',
    shortName: 'Bonoloto',
    familyId: 'numbers',
    description: 'Seis números, complementario y reintegro del resguardo. Admite apuestas simples y múltiples.',
    betModel: 'Combinación numérica simple o múltiple',
    availability: 'active',
    capabilities: ACTIVE_CAPABILITIES,
  },
  gordoprimitiva: {
    id: 'gordoprimitiva',
    name: 'El Gordo de la Primitiva',
    shortName: 'El Gordo',
    familyId: 'numbers',
    description: 'Combinación numérica y número clave con estructura propia.',
    betModel: 'Combinación numérica con clave',
    availability: 'active',
    capabilities: ACTIVE_CAPABILITIES,
  },
  eurodreams: {
    id: 'eurodreams',
    name: 'EuroDreams',
    shortName: 'EuroDreams',
    familyId: 'numbers',
    description: 'Seis números y un número Sueño por apuesta simple.',
    betModel: 'Combinación numérica con Sueño',
    availability: 'active',
    capabilities: ACTIVE_CAPABILITIES,
  },
  'loteria-nacional': {
    id: 'loteria-nacional',
    name: 'Lotería Nacional',
    shortName: 'Lotería Nacional',
    familyId: 'national',
    description: 'Prepara números de cinco cifras y registra décimos con sorteo, precio, serie y fracción.',
    betModel: 'Número de cinco cifras y décimos',
    availability: 'active',
    capabilities: ACTIVE_CAPABILITIES,
  },
  quiniela: {
    id: 'quiniela',
    name: 'La Quiniela',
    shortName: 'Quiniela',
    familyId: 'sports',
    description: 'Pronósticos 1-X-2 y pleno al quince con múltiples y reducidas.',
    betModel: 'Pronóstico deportivo',
    availability: 'architecture-review',
    capabilities: REVIEW_CAPABILITIES,
  },
  quinigol: {
    id: 'quinigol',
    name: 'El Quinigol',
    shortName: 'Quinigol',
    familyId: 'sports',
    description: 'Pronóstico de resultados mediante rangos de goles.',
    betModel: 'Pronóstico de marcador',
    availability: 'architecture-review',
    capabilities: REVIEW_CAPABILITIES,
  },
  lototurf: {
    id: 'lototurf',
    name: 'Lototurf',
    shortName: 'Lototurf',
    familyId: 'horse',
    description: 'Selección numérica combinada con un pronóstico de carrera.',
    betModel: 'Combinación numérica e hípica',
    availability: 'architecture-review',
    capabilities: REVIEW_CAPABILITIES,
  },
  'quintuple-plus': {
    id: 'quintuple-plus',
    name: 'Quíntuple Plus',
    shortName: 'Quíntuple Plus',
    familyId: 'horse',
    description: 'Pronóstico de posiciones en cinco carreras con estructura específica.',
    betModel: 'Pronóstico hípico',
    availability: 'architecture-review',
    capabilities: REVIEW_CAPABILITIES,
  },
};

export const GAME_CATALOG_IDS = Object.keys(GAME_CATALOG);
export const ACTIVE_GAME_IDS = GAME_CATALOG_IDS.filter(gameId => GAME_CATALOG[gameId].availability === 'active');

export const CAPABILITY_LABELS = {
  createCombination: 'Crear',
  manualEntry: 'Registrar',
  resultChecking: 'Comprobar',
  history: 'Archivo',
  statisticalLab: 'Analizar',
  officialData: 'Datos oficiales',
};

export const AVAILABILITY_LABELS = {
  active: 'Disponible',
  'rules-review': 'Reglas en validación',
  'architecture-review': 'Arquitectura en definición',
};

export function getCatalogGame(gameId) {
  return GAME_CATALOG[gameId] || null;
}

export function getCatalogFamily(familyId) {
  return GAME_FAMILIES.find(family => family.id === familyId) || null;
}

export function getGamesByFamily(familyId) {
  return GAME_CATALOG_IDS.map(gameId => GAME_CATALOG[gameId]).filter(game => game.familyId === familyId);
}

export function isGameCapabilityAvailable(gameId, capability) {
  return Boolean(GAME_CATALOG[gameId]?.capabilities?.[capability]);
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es-ES');
}

export function searchCatalogGames(query = '', familyId = 'all') {
  const normalized = normalizeSearch(query);
  return GAME_CATALOG_IDS
    .map(gameId => GAME_CATALOG[gameId])
    .filter(game => familyId === 'all' || game.familyId === familyId)
    .filter(game => !normalized || [game.name, game.shortName, game.description, game.betModel]
      .some(value => normalizeSearch(value).includes(normalized)));
}
