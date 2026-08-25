import type { Messages } from "./types";

export const es: Messages = {
  brand: {
    name: "AnswerGap",
    tagline: "Encuentra las preguntas que tus competidores nunca respondieron.",
    prototype: "prototipo",
  },

  landing: {
    headline: "Encuentra las preguntas que tus competidores nunca respondieron.",
    intro:
      "AnswerGap despliega «Otras preguntas de los usuarios» de Google en un " +
      "árbol de preguntas, revisa los resultados de búsqueda detrás de cada una " +
      "y te muestra cuáles no aborda ninguna página.",
    searchPlaceholder: "Escribe una palabra clave — p. ej. blanqueamiento dental",
    searchButton: "Analizar",
    searchDisabledHint: "El rastreo en vivo aún no está conectado",
    liveNotice:
      "El rastreo en vivo <b>aún no está conectado</b> — los análisis de abajo " +
      "se construyeron con datos reales de Google.",
    savedAnalyses: "Análisis guardados",
    questionCount: "{count} preguntas",
    country: "País",
    language: "Idioma",
    languageHint:
      "La puntuación de brechas solo funciona en idiomas con paquete de coincidencia.",
  },

  status: {
    gap: "Brecha",
    weak: "Débil",
    covered: "Cubierta",
    no_data: "Sin datos",
    gapExplained:
      "Ningún resultado de búsqueda aborda esta pregunta directamente. La " +
      "respuesta hay que extraerla de una página escrita sobre otro tema.",
    weakExplained:
      "Una o dos páginas abordan esta pregunta. La competencia ha empezado, " +
      "pero todavía hay espacio.",
    coveredExplained:
      "Tres o más páginas abordan esta pregunta. Posicionarse aquí sería difícil.",
    no_dataExplained:
      "No se han recuperado resultados para esta pregunta, así que se " +
      "DESCONOCE si es una brecha. No cuenta como brecha.",
  },

  toolbar: {
    tree: "Árbol",
    table: "Tabla",
    searchPlaceholder: "Filtrar preguntas…",
    showing: "{shown} de {total} preguntas",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    fit: "Ajustar a la pantalla",
  },

  table: {
    question: "Pregunta",
    status: "Estado",
    matchingPages: "Páginas que la abordan",
    matchingPagesHint: "Resultados orgánicos que superan el umbral de coincidencia",
    checked: "Revisados",
    checkedHint: "Resultados orgánicos examinados",
    branches: "Ramas",
    branchesHint: "Bajo cuántas preguntas padre distintas apareció",
    depth: "Nivel",
    volume: "Volumen",
    volumeHint: "Google Ads no está conectado",
    noVolume: "sin datos",
    empty: "Ninguna pregunta coincide con el filtro.",
  },

  detail: {
    empty:
      "Selecciona una pregunta para ver qué páginas la abordan, cuáles no y " +
      "por qué cuenta como brecha.",
    depth: "Nivel {depth}",
    branches: "en {count} ramas",
    matchingPages: "Páginas que la abordan",
    checked: "Resultados revisados",
    volume: "Volumen de búsqueda",
    resultsHeading:
      "Resultados de búsqueda · coincidencia ≥ {threshold} cuenta como acierto",
    noResults:
      "<b>Nunca</b> se recuperaron resultados para esta pregunta, así que no " +
      "sabemos si es una brecha. Por eso se dibuja con borde discontinuo. Se " +
      "puntuará cuando el rastreo en vivo esté conectado.",
    untitled: "(sin título)",
    aiHeading: "Fuentes del resumen de IA de Google",
    aiNote:
      "Google responde a esta pregunta con un resumen de IA y cita estos sitios. " +
      "Puede ser una pregunta de cero clics.",
    sourceHeading: "Fuente",
    updated: "Última actualización: {date}",
    matching: "Coincidencia: {strategy} · umbral {threshold}",
    unvalidated: "(sin validar)",
  },

  notice: {
    archiveData: "Datos de archivo",
    archiveDataDetail: "no en vivo",
    provisionalThreshold: "Umbral provisional",
    thresholdNote:
      "El umbral de brecha no se ha validado contra datos etiquetados. Los " +
      "resultados indican una dirección; no son definitivos.",
    volumeNote:
      "Google Ads no está conectado — no se muestra el volumen de búsqueda.",
    dataNote:
      "Leído del archivo de validación de la Fase 0, no de datos en vivo de Google.",
  },

  error: {
    unreachable: "No se pudo conectar con la API ({url}). ¿Está el backend en marcha?",
    http: "{status} {statusText} — {path}",
    backToAnalyses: "Volver a los análisis",
    startBackend: "Para iniciar el backend, desde la raíz del proyecto:",
    loading: "Cargando…",
  },

  language: {
    label: "Idioma de la interfaz",
  },
};
