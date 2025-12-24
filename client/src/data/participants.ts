// Lista de participantes para el sorteo navideño
export interface Participant {
  id: string;
  name: string;
}

// --- GENERADOR DE NÚMEROS ALEATORIOS CON SEMILLA (Determinista) ---
// Esto asegura que todos vean la misma asignación de números
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// --- SHUFFLE DETERMINISTA (Fisher-Yates con semilla) ---
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const random = seededRandom(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// --- DATOS ORIGINALES (ordenados alfabéticamente) ---
const PARTICIPANTS_RAW = [
  "ALCALA CARDONA JOSE ALFREDO",
  "ARRIAGA RAMIREZ BEATRIZ",
  "AVENDAÑO AQUINO SERGIO OMAR",
  "BELTRAN NATURI ISRAEL",
  "CAMAS ROBLES ALEXIS",
  "CHANDOMI QUINTERO MAURICIO ALEJANDRO",
  "COLMENARES LOPEZ JUAN DE JESUS",
  "CUEVAS PEREZ ROBERTO",
  "DE LA CRUZ VELAZQUEZ MARIA DEL CARMEN",
  "DEL ANGEL ZAMORA SERGIO",
  "DOMINGUEZ ESPINOSA GABRIEL LEONARDO",
  "ESPINOSA GOMEZ DULCE FATIMA",
  "GOMEZ ALFARO DANIELA",
  "GONZALEZ LOPEZ ADALBERTO",
  "GUTIERREZ HERNANDEZ ALEJANDRO",
  "HERNANDEZ LIEVANO IRIS MARLIT",
  "MACAL INFANZON CRISTIAN ROMEO",
  "MACIAS VELAZQUEZ GUADALUPE",
  "MARTINEZ JIMENEZ AMIR",
  "MORALES LOPEZ IVAN DE JESUS",
  "MUÑOZ LEPE YADIRA",
  "OCHOA MARROQUIN CECIL",
  "OZUNA CABALLERO MARTHA LIDIA",
  "RINCON SANCHEZ MARIANO GUSTAVO",
  "RODRIGUEZ JIMENEZ CARLOS ALBERTO",
  "ROQUE ESPINOSA LILIANA ELIZABETH",
  "RUIZ LOPEZ RAFAEL OCTAVIO",
  "RUIZ LOPEZ SERGIO DE JESUS",
  "RUIZ REYES RAFAEL ABRAHAM",
  "TELLO SANTIAGO DANIEL ALEJANDRO",
  "TOLEDO DE LEON CITLALLI GUADALUPE",
  "URBINA PEREZ ANDREA MERARI",
  "VAZQUEZ JUAREZ JULIO CESAR",
  "VAZQUEZ MACIAS HERWING EDUARDO",
];

// --- SEMILLA PARA EL SORTEO (Cambia esto cada año o evento) ---
const SHUFFLE_SEED = 2025;

// --- PARTICIPANTES CON NÚMEROS ALEATORIOS ASIGNADOS ---
// Shuffleamos los nombres y les asignamos números secuenciales
const shuffledNames = shuffleWithSeed(PARTICIPANTS_RAW, SHUFFLE_SEED);

export const PARTICIPANTS: Participant[] = shuffledNames.map((name, index) => ({
  id: String(index + 1), // El ID es el número visible (1, 2, 3...)
  name: name,
}));

// Función para obtener nombre corto (primeras 2 palabras de derecha a izquierda)
// Si contiene "DEL" o "DE", usa 3 palabras
export function getShortName(fullName: string): string {
  const parts = fullName.split(' ');
  if (parts.length >= 3) {
    // Si la penúltima palabra es "DEL" o "DE", tomamos 3 palabras
    const penultima = parts[parts.length - 2].toUpperCase();
    if (penultima === 'DEL' || penultima === 'DE') {
      return parts.slice(-3).join(' ');
    }
  }
  if (parts.length >= 2) {
    return parts.slice(-2).join(' ');
  }
  return fullName;
}
