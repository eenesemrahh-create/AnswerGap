import type { Messages } from "./types";

export const es: Messages = {
  brand: {
    name: "AnswerGap",
    tagline: "Encuentra las preguntas que tus competidores nunca respondieron.",
    prototype: "prototipo",
  },

  landing: {
    treeCount: "{count} guardadas",
    emptyTitle: "Aún no hay búsquedas.",
    emptyBody:
      "Busca una palabra clave arriba y aparecerá aquí. Tus búsquedas son " +
      "privadas y pertenecen a tu cuenta.",
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
    seedLabel: "Tu búsqueda",
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
    aiSources: "AI Overview",
    aiSourcesHint: "Sitios que el AI Overview de Google cita para esta pregunta. Solo se conoce en preguntas comprobadas.",
    aiCount: "{count} sitios",
    aiNone: "ninguno",
    aiYou: "tú",
    aiYouHint: "{site} está entre las fuentes citadas",
    aiUnknown: "desconocido",
    aiUnknownHint: "La respuesta de IA de Google se carga después de la página y sus fuentes no pudieron leerse. Desconocido, no sin citas.",
  },

  ai: {
    heading: "AI Overview de Google en este árbol",
    noneChecked: "Aún no se ha comprobado ninguna pregunta. Comprobar una pregunta también muestra, sin coste adicional, si el AI Overview de Google la responde y qué sitios cita.",
    coverage: "El resumen de IA de Google cita fuentes en {withAi} de las {checked} preguntas cuya respuesta de IA pudo leerse.",
    citedIn: "citado en {count} de {checked}",
    note: "Solo se cuentan las preguntas cuya respuesta de IA pudo leerse. El resto es desconocido, no sin citas.",
    unreadable: "En {count} más no pudo leerse.",
    siteLabel: "Tu sitio",
    sitePlaceholder: "ejemplo.com",
    siteInvalid: "Escribe un dominio, como ejemplo.com.",
    siteCited: "{site} aparece citado en {count} de las {checked} preguntas comprobadas.",
    siteHint: "Los subdominios también cuentan: ejemplo.com coincide con blog.ejemplo.com. Solo se recuerda en este navegador.",
    treeMarker: "IA {count}",
    treeHint: "El resumen de IA de Google cita {count} sitios para esta pregunta.",
    treeYouHint: "{site} está entre ellos.",
  },

  seeds: {
    note:
      "Google muestra estas frases junto a los resultados. Son consultas, no preguntas, así que nunca son nodos del árbol: son las siguientes semillas que buscar.",
    empty: "Aún no se han registrado búsquedas relacionadas para este árbol.",
    noQuestionsTitle: "Google no muestra preguntas para esta búsqueda",
    noQuestionsBody:
      "Esta página de resultados no tiene el bloque «Otras preguntas de los usuarios», así que no hay árbol de preguntas que construir. Es normal en nombres de marca y búsquedas de una sola palabra, donde la gente busca un sitio web y no una respuesta. Las búsquedas en forma de pregunta funcionan mejor.",
    noQuestionsTry: "En su lugar, Google sugiere estas búsquedas relacionadas:",
  },

  detail: {
    close: "Cerrar",
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
    aiYou: "{site} está entre los sitios citados.",
    aiNotYou: "{site} no aparece citado en esta pregunta.",
    aiUnreadable: "Google responde a esta pregunta con un resumen de IA, pero se carga después de la página y sus fuentes no pudieron leerse. No se sabe a quién cita.",
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
    skipped:
      "{count} omitidas — ya comprobadas, ya en cola, o más allá de los " +
      "créditos que te quedan.",
    noCallback: "Sin callback configurado: los resultados se recogerán por sondeo, lo que tarda minutos en vez de segundos.",
    confirm: "Ponerlas en cola",
    cancel: "Cancelar",
    posting: "Encolando…",
    running: "{done} de {total} recibidas",
    failed: "{count} fallidas",
    allChecked: "Todas las preguntas están comprobadas.",
  },

  dev: {
    role: "administrador",
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

  auth: {
    // --- inicio de sesión con correo y contraseña ------------------
    signUpTitle: "Crea tu cuenta de AnswerGap",
    tabSignIn: "Iniciar sesión",
    tabSignUp: "Crear cuenta",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    nameLabel: "Nombre (opcional)",
    newPassword: "Nueva contraseña",
    passwordHint:
      "Al menos 10 caracteres. Lo que importa es la longitud: una frase corta supera a una contraseña corta.",
    or: "o",
    forgot: "¿Olvidaste tu contraseña?",
    forgotTitle: "Restablece tu contraseña",
    forgotSub:
      "Escribe tu dirección y te enviaremos un enlace para elegir una nueva contraseña.",
    forgotSubmit: "Enviar el enlace",
    sentTitle: "Revisa tu bandeja de entrada",
    sentBody:
      "Enviamos un enlace a {email}. Ábrelo para confirmar tu dirección y recibir tus créditos gratuitos.",
    sentSpam: "Puede tardar un minuto. Si no está, mira en spam.",
    sentResend: "Enviar de nuevo",
    sentAgain: "Enviado. Vuelve a mirar tu bandeja en un momento.",
    backToSignIn: "Volver al inicio de sesión",
    resetTitle: "Elige una nueva contraseña",
    resetSub:
      "Esto también cierra tu sesión en todos los demás sitios, que es el objetivo de un restablecimiento.",
    resetSubmit: "Guardar e iniciar sesión",
    working: "Procesando…",
    yourAddress: "tu dirección",
    verifyBanner:
      "Confirma tu dirección de correo para empezar a usar tus créditos.",
    verifyBannerAction: "Reenviar el enlace",
    verifiedToast: "Tu correo está confirmado. Tus créditos están listos.",
    alreadyVerified:
      "Esa dirección ya está confirmada. Inicia sesión y sigue.",
    accountEmail: "Sesión iniciada como",
    deleteTitle: "Eliminar mi cuenta",
    deleteLead: "Esto no se puede deshacer. Tus búsquedas se desvinculan de ti; tu correo y tus registros de pago se conservan.",
    deleteAction: "Eliminar mi cuenta…",
    deleteConfirmTitle: "¿Eliminar esta cuenta?",
    deleteRemoves: "Se elimina: tu nombre, tu foto, tu contraseña, tus preferencias guardadas y el vínculo entre tú y cada búsqueda que has hecho. Tus análisis guardados dejan de ser tuyos.",
    deleteKeeps: "Se conserva: tu dirección de correo, para reconocerte si vuelves, y tus registros de pago, que las normas fiscales nos obligan a guardar.",
    deleteRevives: "Si vuelves a registrarte con esta dirección, la cuenta regresa y los créditos que pagaste siguen ahí. Las búsquedas no.",
    deleteConfirmPassword: "Escribe tu contraseña para confirmar",
    deleteConfirmEmail: "Escribe {email} para confirmar",
    deleteSubmit: "Eliminar mi cuenta",
    deleteCancel: "Conservar mi cuenta",
    verifyExpiredTitle: "Ese enlace ha caducado",
    verifyExpiredSub:
      "Un enlace de verificación sirve una sola vez y durante poco tiempo. Escribe tu dirección y te enviamos uno nuevo.",
    verifyExpiredSubmit: "Enviar un enlace nuevo",
    close: "Cerrar",
    dialogTitle: "Inicia sesión en AnswerGap",
    benefitCredits: "Créditos para buscar y comprobar preguntas",
    benefitPrivate: "Tus búsquedas son tuyas: nadie más las ve",
    benefitScore: "Comprueba cualquier pregunta contra las páginas que posicionan",
    noCard: "Sin tarjeta. Durante la vista previa los créditos se añaden a mano.",
    signIn: "Iniciar sesión con Google",
    signOut: "Cerrar sesión",
    signedInAs: "Sesión iniciada como {email}",
    account: "Cuenta",
    failed: "El inicio de sesión no se completó. Inténtalo de nuevo.",
    why: "Inicia sesión para conservar tus búsquedas y tus créditos.",
    whySearch: "Buscar requiere una cuenta. Crearla es gratis y las cuentas nuevas empiezan con créditos.",
  },

  credits: {
    label: "Créditos",
    balance: "{count} créditos",
    empty: "No quedan créditos",
    free: "Los resultados en caché son gratuitos: no gastan crédito.",
    manualNote: "Por ahora los créditos se añaden a mano; todavía no hay pago.",
  },

  error: {
    invalidEmail: "Eso no parece una dirección de correo.",
    badCredentials:
      "Ese correo y esa contraseña no coinciden con ninguna cuenta.",
    emailUnverified:
      "Confirma primero tu dirección de correo: el enlace está en tu bandeja.",
    tooManyAttempts:
      "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    passwordTooShort:
      "Las contraseñas necesitan al menos {minLength} caracteres.",
    passwordTooCommon:
      "Esa contraseña aparece en listas de filtraciones. Elige otra.",
    resetExpired: "Ese enlace ha caducado o ya se usó. Pide uno nuevo.",
    googleOff:
      "El inicio de sesión con Google no está configurado aquí. Usa el correo.",
    unreachable: "No se pudo conectar con la API ({url}). ¿Está el backend en marcha?",
    notFound:
      "Ese análisis no está aquí. Puede que se haya eliminado o que la dirección esté mal escrita.",
    http: "{status} {statusText} — {path}",
    noCredentials: "Faltan las credenciales de DataForSEO. Copia .env.example a .env, complétalo y reinicia el backend.",
    budget: "Se alcanzó el límite de peticiones; el rastreo se detuvo en lugar de gastar más.",
    upstream: "No se pudo contactar con DataForSEO, o devolvió un error. Una petición fallida no se cobra.",
    badRequest: "Esa petición no se puede ejecutar tal como se ha pedido.",
    signedOut: "Has cerrado sesión. Inicia sesión para continuar.",
    noCredits:
      "No te quedan créditos. Una búsqueda cuesta un crédito; los resultados " +
      "en caché son gratuitos.",
    suspended: "Esta cuenta está suspendida. Escríbenos y lo resolvemos.",
    backToAnalyses: "Volver a los análisis",
    startBackend: "Para iniciar el backend, desde la raíz del proyecto:",
    loading: "Cargando…",
  },

  theme: {
    light: "Cambiar a oscuro",
    dark: "Seguir al sistema",
    system: "Cambiar a claro",
  },

  language: {
    label: "Idioma de la interfaz",
  },

  market: {
    nav: {
      pricing: "Precios",
      solutions: "Soluciones",
      aiSeo: "SEO para IA",
      blog: "Blog",
      contact: "Contacto",
      signIn: "Iniciar sesión",
      signUp: "Registrarse",
    },
    hero: {
      eyebrow: "La visibilidad en búsqueda con IA empieza aquí",
      headlinePre: "Posiciona y aparece en",
      headlineHighlight: "búsqueda con IA",
      sub:
        "Descubre lo que la gente pregunta, identifica las respuestas que " +
        "necesitan los motores de IA y crea contenido que se encuentre, se " +
        "cite y se recomiende.",
      searchPlaceholder: "Introduce un tema — p. ej. blanqueamiento dental",
      searchCta: "Analizar",
      searching: "Buscando…",
      tryLabel: "Búsquedas de ejemplo:",
      try1: "mejor CRM para startups",
      try2: "herramientas de SEO para IA",
    },
    howItWorks: {
      eyebrow: "Cómo funciona",
      title: "Conviértete en la respuesta que recomienda la búsqueda con IA.",
      sub:
        "AnswerGap revela las preguntas detrás del descubrimiento impulsado " +
        "por IA para que crees contenido útil y estructurado antes que la " +
        "competencia.",
      card1: {
        label: "Inteligencia de Demanda",
        title: "Mapea la Demanda de Búsqueda con IA",
        body:
          "Convierte un solo tema en un mapa completo de las preguntas que " +
          "la gente hace en cada etapa del descubrimiento y la decisión.",
      },
      card2: {
        label: "Visibilidad en IA",
        title: "Encuentra Oportunidades de Citación",
        body:
          "Identifica preguntas con respuestas débiles, incompletas o " +
          "inexistentes — exactamente donde un contenido más claro tiene " +
          "más posibilidades de ser destacado por la IA.",
      },
      card3: {
        label: "Autoridad",
        title: "Construye Autoridad Temática",
        body:
          "Prioriza preguntas conectadas y publica respuestas exhaustivas " +
          "que los motores de búsqueda y asistentes de IA puedan entender " +
          "y en las que puedan confiar.",
      },
    },
    builtFor: {
      eyebrow: "Diseñado para búsqueda con IA",
      title: "Responde preguntas reales. Deja que la IA te encuentre.",
      body:
        "La búsqueda se está convirtiendo en una conversación. AnswerGap te " +
        "muestra qué pregunta tu audiencia y dónde las respuestas actuales " +
        "se quedan cortas — para que tu marca gane visibilidad en AI " +
        "Overviews, asistentes y búsqueda tradicional.",
      point1: "Crea respuestas claras que la IA pueda extraer y citar",
      point2: "Estructura el contenido en torno a búsquedas conversacionales reales",
      point3: "Cubre preguntas conectadas para reforzar la autoridad temática",
      demoUrl: "answergap.com/busqueda",
      demo1Q: "¿Cuál es el mejor CRM para pequeñas empresas?",
      demo1Meta: "Respuesta completa · Alta oportunidad de visibilidad",
      demo2Q: "¿Necesito un CRM si uso Google Workspace?",
      demo2Meta: "Sin respuesta completa · Alta oportunidad de visibilidad",
      demo3Q: "¿Cómo migrar de hojas de cálculo a un CRM?",
      demo3Meta: "Respuestas parciales · Oportunidad media de visibilidad",
    },
    pricing: {
      title: "Precios simples y transparentes",
      sub:
        "Encuentra las preguntas que pueden hacer crecer tu visibilidad en " +
        "IA y en búsqueda. Cancela cuando quieras.",
      starter: {
        name: "Starter",
        desc: "Para creadores que construyen visibilidad en búsqueda con IA.",
        price: "$49",
        per: "/mes",
        feat1: "100 búsquedas de temas al mes",
        feat2: "Mapas de preguntas de búsqueda con IA",
        feat3: "Clasificación de intención de búsqueda",
        feat4: "Exportación de oportunidades",
        cta: "Empezar",
      },
      pro: {
        name: "Pro",
        badge: "Más popular",
        desc: "Para equipos que escalan la autoridad en búsqueda con IA.",
        price: "$149",
        per: "/mes",
        feat1: "Búsquedas de temas ilimitadas",
        feat2: "Puntuación de oportunidades de visibilidad en IA",
        feat3: "Análisis de brechas de respuesta y citación",
        feat4: "Acceso a la API",
        feat5: "Soporte prioritario",
        cta: "Pásate a Pro",
      },
      note:
        "Precios estáticos — el checkout aún no está conectado. Los créditos " +
        "se conceden a mano mientras el producto está en preview.",
    },
    cta: {
      title: "¿Listo para convertirte en la respuesta?",
      sub:
        "Encuentra las preguntas importantes, publica respuestas que la IA " +
        "pueda entender y construye visibilidad allí donde busca tu audiencia.",
      primary: "Empieza gratis",
      secondary: "Ver precios",
    },
    footer: {
      tagline:
        "Encuentra las preguntas que la búsqueda con IA necesita responder — " +
        "y ayuda a que tu marca sea la fuente de confianza que recomiende.",
      product: {
        heading: "Producto",
        features: "Funciones",
        pricing: "Precios",
        api: "API",
        changelog: "Changelog",
      },
      resources: {
        heading: "Recursos",
        blog: "Blog",
        seoGuides: "Guías de SEO",
        helpCenter: "Centro de ayuda",
        community: "Comunidad",
      },
      company: {
        heading: "Empresa",
        about: "Acerca de",
        contact: "Contacto",
        privacy: "Política de privacidad",
        terms: "Términos de servicio",
      },
      copyright: "© {year} AnswerGap. Todos los derechos reservados.",
    },
    saved: {
      heading: "Tus análisis recientes",
      count: "{count} guardados",
    },
  },
};
