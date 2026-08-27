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
    searchDisabledHint: "No se encontraron credenciales de DataForSEO - copia .env.example a .env y complétalo.",
    searching: "Buscando…",
    searchingHint: "Se consulta a Google una vez, con el bloque «Otras preguntas» desplegado. Tarda entre 30 y 60 segundos.",
    liveNotice: "Una búsqueda ejecuta <b>una sola petición en vivo</b> y devuelve el árbol de preguntas. La puntuación de huecos es <b>por pregunta</b> y se inicia desde la pregunta misma.",
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
    seeds: "Búsquedas relacionadas",
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

  seeds: {
    note:
      "Google muestra estas frases junto a los resultados. Son consultas, no preguntas, así que nunca son nodos del árbol: son las siguientes semillas que buscar.",
    empty: "Aún no se han registrado búsquedas relacionadas para este árbol.",
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
    noResults: "Para esta pregunta <b>nunca se descargaron</b> resultados de búsqueda, así que se desconoce si es un hueco - por eso se dibuja con borde discontinuo. Este es un análisis archivado; ejecuta una búsqueda en vivo con el mismo término para puntuarla.",
    notScoredYet: "Esta pregunta <b>aún no se ha puntuado</b>. Comprobarla cuesta una petición de búsqueda, así que nunca ocurre automáticamente — y hasta entonces se desconoce si es un hueco.",
    scoreButton: "Comprobar esta pregunta",
    scoring: "Comprobando…",
    scoreCost: "Una petición SERP. Una pregunta ya descargada no cuesta nada.",
    untitled: "(sin título)",
    aiHeading: "Fuentes del resumen de IA de Google",
    aiNote:
      "Google responde a esta pregunta con un resumen de IA y cita estos sitios. " +
      "Puede ser una pregunta de cero clics.",
    sourceHeading: "Fuente",
    updated: "Última actualización: {date}",
    matching: "Coincidencia: {strategy} · umbral {threshold}",
    unvalidated: "(sin validar)",
    harvestFound: "Esta petición también reveló {count} preguntas nuevas, sin coste adicional.",
    harvestDropped: "{count} más quedaron fuera por alejarse demasiado de la semilla.",
    harvestedNode: "Encontrada dentro de los resultados de otra pregunta",
    relevance: "Cercanía a la semilla {value}",
  },

  notice: {
    archiveData: "Datos de archivo",
    archiveDataDetail: "no en vivo",
    liveData: "Rastreo en vivo",
    liveDataDetail: "una instantánea, no datos en vivo",
    liveDataNote: "Descargado una vez, a la hora indicada. Los resultados de Google cambian; repite la búsqueda para actualizar.",
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
    noCredentials: "Faltan las credenciales de DataForSEO. Copia .env.example a .env, complétalo y reinicia el backend.",
    budget: "Se alcanzó el límite de peticiones; el rastreo se detuvo en lugar de gastar más.",
    upstream: "No se pudo contactar con DataForSEO, o devolvió un error. Una petición fallida no se cobra.",
    badRequest: "Esa petición no se puede ejecutar tal como se ha pedido.",
    backToAnalyses: "Volver a los análisis",
    startBackend: "Para iniciar el backend, desde la raíz del proyecto:",
    loading: "Cargando…",
  },

  language: {
    label: "Idioma de la interfaz",
  },
};
