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
    gap: "Sin responder",
    weak: "Apenas respondida",
    covered: "Bien respondida",
    no_data: "Sin comprobar",
    evidence: "{matching} de {checked} páginas",
    gapExplained:
      "Ningún resultado de búsqueda aborda esta pregunta directamente. La " +
      "respuesta hay que extraerla de una página escrita sobre otro tema.",
    weakExplained:
      "Una o dos páginas abordan esta pregunta. La competencia ha empezado, " +
      "pero todavía hay espacio.",
    coveredExplained:
      "Tres o más páginas abordan esta pregunta. Posicionarse aquí sería difícil.",
    no_dataExplained:
      "No se han recuperado resultados para esta pregunta, así que " +
      "nadie sabe si alguien la responde. Desconocido no es lo mismo " +
      "que sin responder.",
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
    matchingPagesHint: "Resultados que abordan realmente esta pregunta",
    checked: "Revisados",
    checkedHint: "Resultados examinados",
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
      "Selecciona una pregunta para ver qué páginas la abordan, cuáles " +
      "no, y cuántas la responden de verdad.",
    depth: "Nivel {depth}",
    branches: "en {count} ramas",
    matchingPages: "Páginas que la abordan",
    checked: "Resultados revisados",
    volume: "Volumen de búsqueda",
    resultsHeading:
      "Resultados de búsqueda · una página cuenta como respuesta a partir de {threshold}",
    noResults: "<b>Nunca se recuperaron</b> resultados de búsqueda para esta pregunta, así que nadie sabe si alguien la responde - por eso se dibuja con borde discontinuo. Es un análisis archivado; ejecuta una búsqueda en vivo con el mismo término para evaluarla.",
    notScoredYet: "Esta pregunta <b>aún no se ha comprobado</b>. Comprobarla cuesta una petición de búsqueda, así que nunca ocurre automáticamente — y hasta entonces nadie sabe si alguien la responde.",
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

  verdict: {
    heading: "¿Estas páginas responden a la pregunta?",
    ask: "El umbral todavía no está fijado. Tu respuesta es lo que lo fija — no cuesta nada y no se ejecuta ninguna búsqueda.",
    gap: "No, ninguna",
    notGap: "Sí, al menos una",
    gapHint: "Ninguna página de aquí se escribió para responder a esta pregunta.",
    notGapHint: "Al menos una página de aquí la responde directamente.",
    recorded: "Registrado. Pulsa el mismo botón otra vez para retirarlo.",
    retracted: "Veredicto retirado.",
    saving: "Guardando…",
    tally: "{questions} preguntas evaluadas hasta ahora ({gap} sin responder, {notGap} respondidas).",
    disagrees: "Esto contradice a la métrica, que es justo el caso útil.",
  },

  batch: {
    size: "Tamaño del lote",
    check: "Comprobar las {count} primeras",
    pricing: "Calculando precio…",
    confirmCount: "{count} preguntas",
    vsLive: "en la cola {queue} · {live} en Live",
    skipped: "{count} omitidas — ya comprobadas, o ya en cola.",
    noCallback: "Sin callback configurado: los resultados se recogerán por sondeo, lo que tarda minutos en vez de segundos.",
    confirm: "Ponerlas en cola",
    cancel: "Cancelar",
    posting: "Encolando…",
    running: "{done} de {total} recibidas",
    failed: "{count} fallidas",
    allChecked: "Todas las preguntas están comprobadas.",
  },

  dev: {
    role: "desarrollador",
    scopeTree: "Solo este análisis.",
    scopeAll: "Todo, todos los árboles.",
    grandTotal: "Todos los árboles: {total}",
    rowsTree: "{questions} preguntas · {tasks} comprobaciones en cola",
    loading: "Leyendo…",
    liveQueue: "Live",
    standardQueue: "Standard",
    requests: "{count} peticiones · {crawls} búsquedas",
    tasks: "{count} preguntas",
    saved: "Ahorrado",
    savedNote: "el mismo trabajo en Live habría costado {ifLive}",
    total: "Total",
    perRequest: "Por petición: {live} Live · {standard} Standard",
    rows: "{questions} preguntas · {scores} puntuaciones · {snapshots} respuestas guardadas",
    storage: "Almacenamiento {state} · {tables} tablas",
    ok: "ok",
    broken: "FALLANDO",
    callback: "Callback {state}",
    on: "activo",
    offSweep: "inactivo — recurriendo al sondeo",
    pending: "{count} aún en cola",
    failedTasks: "{count} tareas fallidas",
  },

  diff: {
    first: "Primer rastreo · {at}",
    firstNote: "Todavía no hay nada con qué comparar. Repite esta búsqueda más adelante y los cambios aparecerán aquí.",
    stable: "Sin cambios desde {since} · {count} preguntas iguales",
    changed: "{added} nuevas · {removed} desaparecidas · desde {since}",
    scope: "Compara lo que devolvió Google, no lo que la puntuación descubrió después. Reordenar no es un cambio.",
    addedHeading: "Preguntas nuevas",
    removedHeading: "Ya no se preguntan",
    removedNote: "Una página escrita para estas ya no apunta a nada.",
    historyHeading: "Historial de rastreos",
    questionCount: "{count} preguntas",
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
