import type { Messages } from "./types";

export const es: Messages = {
  brand: {
    name: "GetTopQuestions",
    tagline: "Encuentra las preguntas que tus competidores nunca respondieron.",
  },

  landing: {
    treeCount: "{count} guardadas",
    emptyTitle: "Aún no hay búsquedas.",
    emptyBody:
      "Busca una palabra clave arriba y aparecerá aquí. Tus búsquedas son " +
      "privadas y pertenecen a tu cuenta.",
    headline: "Encuentra las preguntas que tus competidores nunca respondieron.",
    intro:
      "GetTopQuestions despliega «Otras preguntas de los usuarios» de Google en un " +
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
    pngUncheckedNote: "Aún no se ha comprobado ninguna pregunta: cada caja sigue gris hasta que se comprueben sus resultados",
    pngRepeatNote: "×N = Google mostró esta pregunta en N ramas distintas",
    seeds: "Búsquedas relacionadas",
    tree: "Árbol",
    showDetails: "Mostrar detalles",
    table: "Tabla",
    searchPlaceholder: "Filtrar preguntas…",
    showing: "{shown} de {total} preguntas",
    exportCsv: "Exportar CSV",
    exportCsvHint: "Descarga las filas mostradas, con tus filtros aplicados.",
    exportPng: "Descargar imagen",
    exportPngHint: "Guarda el árbol completo como PNG, no solo la parte visible.",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    zoomLevel: "Nivel de zoom",
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
    sortBy: "Ordenar por",
    volumeNote: "Volumen de búsqueda: aún sin datos, porque Google Ads no está conectado. Hasta entonces, las ramas (bajo cuántas preguntas apareció una pregunta) son la señal de interés.",
  },

  ai: {
    heading: "AI Overview de Google en este árbol",
    noneChecked: "Aún no se ha comprobado ninguna pregunta. Comprobar una pregunta también muestra, sin coste adicional, si el AI Overview de Google la responde y qué sitios cita.",
    coverage: "El resumen de IA de Google cita fuentes en {withAi} de las {checked} preguntas cuya respuesta de IA pudo leerse.",
    citedIn: "citado en {count} de {checked}",
    pngTop: "Más citados por AI Overview: {domains}",
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
    notScoredYet: "Esta pregunta <b>aún no se ha comprobado</b>. Comprobarla cuesta un crédito, así que nunca ocurre automáticamente — y hasta entonces nadie sabe si alguien la responde.",
    scoreButton: "Comprobar esta pregunta · 1 crédito",
    scoring: "Buscando esta pregunta… (30–60 segundos)",
    scoreCost: "La pregunta se busca por sí sola: su resultado aparece aquí y se abre su propio árbol de preguntas. Una pregunta ya buscada no cuesta nada.",
    openTree: "Abrir el árbol de esta pregunta",
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
    credits: "{count} créditos",
    queueDiscount:
      "Mitad de precio: comprobar en bloque pasa por la cola en lugar de " +
      "responder al instante.",
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

  rounds: {
    first: "Analizar y ampliar el árbol · 2 créditos",
    second: "Ampliarlo una vez más · 3 créditos",
    confirmCount: "{count} preguntas por analizar",
    grows: "Cada pregunta analizada trae sus propias preguntas, así que el árbol crece.",
    leftOut: "{count} más superan el límite de esta ronda y quedan sin analizar.",
    limit: "Límite de rondas alcanzado · {count} preguntas sin analizar",
    limitNone: "Límite de rondas alcanzado",
  },

  deep: {
    open: "Abrir ramas cerradas",
    openCount: "Abrir {count} ramas cerradas",
    closedHint: "Google abrió {open} de las {total} preguntas principales y dejó {closed} cerradas.",
    confirmCount: "{count} ramas",
    queueDiscount:
      "Mitad de precio: las ramas se abren en la cola en lugar de volver al " +
      "instante.",
    alsoScores:
      "Cada una se comprueba también en busca de huecos, sin coste adicional.",
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
    signUpTitle: "Crea tu cuenta de GetTopQuestions",
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
    deleteSubscription: "Tu plan de pago se cancela de inmediato y no se te volverá a cobrar. El resto del periodo actual no se reembolsa.",
    deleteConfirmPassword: "Escribe tu contraseña para confirmar",
    deleteConfirmEmail: "Escribe {email} para confirmar",
    deleteSubmit: "Eliminar mi cuenta",
    deleteCancel: "Conservar mi cuenta",
    verifyExpiredTitle: "Ese enlace ha caducado",
    verifyExpiredSub:
      "Un enlace de verificación sirve una sola vez y durante poco tiempo. Escribe tu dirección y te enviamos uno nuevo.",
    verifyExpiredSubmit: "Enviar un enlace nuevo",
    close: "Cerrar",
    dialogTitle: "Inicia sesión en GetTopQuestions",
    benefitCredits: "Créditos para buscar y comprobar preguntas",
    benefitPrivate: "Tus búsquedas son tuyas: nadie más las ve",
    benefitScore: "Comprueba cualquier pregunta contra las páginas que posicionan",
    noCard: "Sin tarjeta. Durante la vista previa los créditos se añaden a mano.",
    signIn: "Iniciar sesión con Google",
    signOut: "Cerrar sesión",
    signedInAs: "Sesión iniciada como {email}",
    account: "Cuenta",
    alreadySignedIn: "Ya tienes una cuenta",
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
    periodHeading: "Este periodo",
    periodUsed: "{used} de {granted} créditos usados en este periodo",
    periodResets: "se reinicia el {date}",
  },

  account: {
    title: "Tu cuenta",
    signedOutTitle: "Inicia sesión para ver tu cuenta",
    signedOutLead:
      "Tu plan, tus créditos y todo aquello en lo que los has gastado están detrás del inicio de sesión.",
    signedOutAction: "Iniciar sesión",
    back: "Volver a la búsqueda",
    loading: "Cargando…",

    profileHeading: "Datos",
    email: "Correo",
    name: "Nombre",
    joined: "Miembro desde",
    unnamed: "Sin indicar",
    verified: "Confirmado",
    unverified: "Sin confirmar",
    verifyAction: "Enviar el enlace otra vez",
    verifySent: "Enviado. Revisa tu bandeja de entrada.",
    doors: "Iniciar sesión con",
    doorPassword: "Contraseña",
    doorGoogle: "Google",

    planHeading: "Tu plan",
    noPlan: "Sin plan",
    noPlanLead:
      "Esta cuenta funciona solo con créditos. Un plan añade créditos cada mes.",
    planCredits: "{count} créditos por periodo",
    given: "Te lo hemos asignado nosotros",
    bought: "Facturado a través de Stripe",
    renews: "Se renueva el {date}",
    endsOn: "Termina el {date}",
    lapsed: "Este plan ha terminado.",
    pastDue:
      "El último pago no se completó. Actualiza tu tarjeta para conservar el plan.",
    manage: "Gestionar facturación",
    manageLead:
      "Cancela, actualiza tu tarjeta o descarga facturas. Abre Stripe.",

    creditsHeading: "Créditos",
    balanceLead:
      "Una búsqueda cuesta un crédito. Volver a abrir una búsqueda guardada es gratis.",
    historyHeading: "Historial",
    historyWhen: "Cuándo",
    historyChange: "Cambio",
    historyWhy: "Motivo",
    noHistory: "Todavía nada.",
    reasonSignup: "Créditos de bienvenida",
    reasonSearch: "Búsqueda",
    reasonSubscription: "Renovación del plan",
    reasonAdminGrant: "Añadidos por nosotros",
    reasonAdminRevoke: "Retirados por nosotros",

    plansHeading: "Planes",
    plansLead: "Puedes cambiar de plan cuando quieras.",
    current: "Tu plan",
    choose: "Elegir {plan}",
    monthly: "Mensual",
    annual: "Anual",
    notPurchasable: "Aún no disponible",
    myPlansHeading: "Tus planes",
    myPlansLead: "Los créditos se gastan primero del plan cuyo periodo termina antes; cuando se agotan, se pasa al siguiente plan. Los créditos que un plan no usa en su periodo se eliminan al terminar el periodo. Los créditos que no vienen de ningún plan se gastan al final.",
    otherCredits: "Créditos sin plan (bienvenida, regalos): {count}, se gastan al final",
    spendingFrom: "Gastando de aquí ahora",
    creditsLeftOf: "Quedan {left} de {total} créditos este periodo",
    burnsOn: "Los créditos no usados se eliminan el {date}",
    defaultBadge: "Predeterminado",
    makeDefault: "Hacer predeterminado",
    ofTotalLeft: "de {total} créditos restantes",
    usedCount: "{count} usados",
    confirmDefault: "¿Hacer {plan} tu plan predeterminado? Tus otros planes ({others}) no se renovarán; puedes usar sus créditos hasta que termine su periodo.",
    confirmDefaultAlone: "¿Hacer {plan} tu plan predeterminado?",
    confirmDefaultYes: "Sí, hacerlo predeterminado",
    defaultRenewsNote: "{plan} se renovará automáticamente cada mes. Puedes detenerlo cuando quieras en «{manage}».",
    autoRenewHint: "Se renueva automáticamente cada mes · puedes detenerlo cuando quieras en «{manage}»",
    cancelStep: "Cancelar",
    endingMakeDefault: "Este plan termina el {date}. Para conservarlo, elige «Hacer predeterminado» arriba; no hace falta volver a comprarlo.",
    endingRenewInPortal: "Este plan termina el {date}. Para conservarlo, renuévalo en «{manage}»; no hace falta volver a comprarlo.",
    chooseAdditional: "Añadir {plan} como segundo plan",
    additionalWarn: "Tu plan actual sigue activo y este plan se cobra aparte. Solo tu plan predeterminado se renueva cada mes: este termina tras su primer periodo. Para que se renueve, hazlo predeterminado; tus otros planes terminarán entonces al final de su periodo.",
    additionalYes: "Entendido, continuar al pago",
    contactUs: "Contáctanos",
    seeAllPlans: "Ver todos los planes",

    billingDone:
      "Gracias. Estamos activando tu plan — puede tardar un momento en aparecer aquí.",
    billingCancelled: "No se ha cobrado nada.",

    settingsHeading: "Ajustes",
    theme: "Apariencia",
    language: "Idioma",
    dangerHeading: "Eliminar cuenta",

    navOverview: "Resumen",
    navProfile: "Perfil",
    navSubscription: "Suscripción",
    navSettings: "Ajustes",
    navSearches: "Mis búsquedas",
    hello: "Hola, {name}",
    overviewLead: "Tus créditos, tu plan y tu cuenta de un vistazo.",
    newSearch: "Empezar una búsqueda nueva",
    newSearchLead: "Cada búsqueda nueva es un crédito. Volver a abrir una que ya hiciste es gratis.",
    noAllowance: "Sin asignación mensual. Un plan añade créditos cada mes.",
    overdrawn: "Tu saldo es {count}: los próximos créditos lo cubren primero.",
    changePlan: "Cambiar de plan",
    profileLead: "Quién eres y cómo inicias sesión.",
    subscriptionLead: "Tu plan, tus créditos y los planes a los que puedes cambiar.",
    settingsLead: "Cómo se ve GetTopQuestions y en qué idioma te habla.",
    themeLead: "Claro, oscuro o según tu sistema.",
    languageLead: "El idioma de la interfaz.",
  },

  home: {
    statAnalyses: "análisis",
    statGaps: "preguntas sin respuesta encontradas",
    filter: "Filtra tus análisis…",
    sortLabel: "Ordenar",
    sortNewest: "Más recientes",
    sortQuestions: "Más preguntas",
    sortGaps: "Más sin respuesta",
    noMatch: "Ningún análisis coincide con «{query}».",
    unanswered: "sin respuesta",
    notChecked: "Aún sin comprobar",
    jobReady: "está lista.",
    jobOpen: "Abrir el árbol",
    jobLost:
      "— la página se recargó durante la búsqueda y su resultado aún no aparece. Si no está en tus análisis de abajo, vuelve a buscar: repetir una búsqueda ya terminada no cuesta nada.",
  },

  strip: {
    left: "créditos restantes",
    upgrade: "Mejorar plan",
    choosePlan: "Elegir un plan",
    jobRunning: "Buscando «{seed}»…",
    jobReady: "«{seed}» está lista",
  },

  refresh: {
    live: "Live",
    title: "Buscar de nuevo para obtener los datos más recientes (1 crédito)",
    busy: "Otra búsqueda sigue en curso",
    confirm: "¿Obtener los datos más recientes? Usa 1 crédito.",
    yes: "Actualizar",
    no: "Cancelar",
    running: "Actualizando…",
    processing: "Procesando…",
    processingNote: "Recopilando las preguntas y revisando los resultados. Tarda un poco.",
    saved: "Guardado",
  },

  repeat: {
    title: "Ya buscaste “{seed}”",
    lead: "Abre tu resultado guardado u obtén los datos más recientes.",
    leadDated: "Tu resultado guardado es del {date}. Ábrelo u obtén los datos más recientes.",
    open: "Abrir resultado guardado",
    openNote: "Gratis · se abre al instante",
    update: "Actualizar con los datos más recientes",
    updateNote: "1 crédito · se busca de nuevo",
    cancel: "Cancelar",
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
    unreachableRetry:
      "Si la búsqueda ya había terminado, está guardada: repetirla no " +
      "gasta créditos.",
    notFound:
      "Ese análisis no está aquí. Puede que se haya eliminado o que la dirección esté mal escrita.",
    http: "{status} {statusText} — {path}",
    noCredentials: "Faltan las credenciales de DataForSEO. Copia .env.example a .env, complétalo y reinicia el backend.",
    budget: "Se alcanzó el límite de peticiones; el rastreo se detuvo en lugar de gastar más.",
    upstream: "No se pudo contactar con DataForSEO, o devolvió un error. Una petición fallida no se cobra.",
    searchUnavailable:
      "La búsqueda no está disponible temporalmente. Ya lo sabemos y estamos en ello. No se ha usado ningún crédito.",
    searchFailed:
      "No se pudo completar la búsqueda. No se ha usado ningún crédito; vuelve a intentarlo en un minuto.",
    alreadySearched: "Ya hiciste esta búsqueda. Ábrela desde tu lista o actualízala.",
    anonLimit: "Ya usaste la búsqueda gratuita de hoy. Crea una cuenta gratuita para seguir buscando.",
    anonDailyFull: "Las búsquedas gratuitas de hoy se han agotado. Crea una cuenta gratuita para buscar ahora.",
    captchaFailed: "No pudimos confirmar que esta búsqueda venga de una persona. Inténtalo de nuevo.",
    badRequest: "Esa petición no se puede ejecutar tal como se ha pedido.",
    planNotPurchasable:
      "Este plan todavía no se puede comprar — aún estamos terminando de " +
      "configurar su pago. Escríbenos y lo resolvemos contigo.",
    noSuchPlan: "Ese plan ya no está disponible.",
    roundLimit: "Este árbol ya usó sus dos rondas de análisis.",
    roundInFlight: "Los resultados de la ronda anterior aún están llegando. Inténtalo cuando terminen.",
    noCustomer: "Aún no hay nada que gestionar: a esta cuenta nunca se le ha facturado.",
    paymentsOff: "Los pagos todavía no están activados.",
    subscriptionCancelFailed: "No pudimos cancelar tu suscripción, así que tu cuenta no se eliminó. Inténtalo de nuevo en unos minutos o escribe a soporte.",
    alreadyOnPlan: "Ya tienes este plan. Si va a terminar, hazlo predeterminado en «Tus planes» para conservarlo; o elige otro plan.",
    planPaymentFailed: "El pago de este plan no se completó, así que no puede ser tu plan predeterminado. Actualiza tu tarjeta en «Gestionar facturación» o elige un plan pagado.",
    stripeFailed: "El proveedor de pagos no aceptó el cambio. No se cambió nada; inténtalo de nuevo en unos minutos.",
    signedOut: "Has cerrado sesión. Inicia sesión para continuar.",
    noCredits:
      "No te quedan créditos. Una búsqueda cuesta un crédito; los resultados " +
      "en caché son gratuitos.",
    suspended: "Esta cuenta está suspendida. Escríbenos y lo resolvemos.",
    serverError:
      "Algo ha fallado por nuestra parte. No se ha cobrado nada por una " +
      "búsqueda que no terminó. Inténtalo de nuevo en un momento.",
    backToAnalyses: "Volver a los análisis",
    startBackend: "Para iniciar el backend, desde la raíz del proyecto:",
    loading: "Cargando…",
  },

  anon: {
    freeTitle: "Sin cuenta tienes {count} búsqueda gratuita al día",
    freeNote: "Puedes ver el árbol de preguntas y la tabla. Analizar preguntas, ampliar el árbol y exportar es para miembros.",
    usedTitle: "Ya usaste la búsqueda gratuita de hoy",
    resetsIn: "Tu próxima búsqueda gratuita llega en {hours} h {minutes} min, a las {clock}. Crea una cuenta gratuita para buscar ahora.",
    dailyFull: "Las búsquedas gratuitas de hoy se han agotado.",
    usedUpReason: "Con una cuenta gratuita ves el árbol de preguntas completo y tus búsquedas se guardan.",
    signUpFree: "Crear una cuenta gratuita",
    verifying: "Comprobando…",
    previewTitle: "Tu búsqueda gratuita, sin cuenta",
    previewBody: "Ves el árbol y la tabla tal como los devolvió la búsqueda. Crea una cuenta gratuita para analizar preguntas, ampliar el árbol y descargar PNG/CSV.",
    previewEmpty: "Google no mostró preguntas para esta búsqueda, así que no se ha usado tu búsqueda gratuita. Prueba una pregunta o unas pocas palabras, como «cómo preparar café de filtro».",
    hint: "Consejo: las preguntas o unas pocas palabras funcionan mejor («cómo preparar café de filtro»). Para marcas y palabras sueltas Google a menudo no muestra preguntas.",
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
      menu: "Menú",
    },
    hero: {
      eyebrow: "Análisis de vacíos de preguntas para equipos de contenido",
      headlinePre: "Encuentra las preguntas",
      headlineHighlight: "que tu competencia nunca respondió",
      sub:
        "Escribe un tema. Mapeamos las preguntas que la gente hace en Google, " +
        "revisamos las páginas detrás de cada una y te mostramos qué preguntas " +
        "no aborda realmente ninguna página.",
      signedInTitle: "¿Qué quieres investigar?",
      searchPlaceholder: "Introduce un tema — p. ej. blanqueamiento dental",
      searchCta: "Analizar",
      searching: "Buscando…",
      elapsed: "{seconds} s hasta ahora",
      tryLabel: "Búsquedas de ejemplo:",
      try1: "mejor CRM para startups",
      try2: "herramientas de SEO para IA",
    },
    howItWorks: {
      eyebrow: "Cómo funciona",
      title: "Mira lo que los resultados de búsqueda dejan sin responder.",
      sub:
        "Una lista de preguntas te dice qué pregunta la gente. GetTopQuestions " +
        "también te dice si alguien ya lo ha respondido.",
      card1: {
        label: "Descubrimiento de preguntas",
        title: "Mapea el árbol de preguntas",
        body:
          "Convierte un tema en un árbol con las preguntas que Google muestra " +
          "en «Otras preguntas de los usuarios», cada una bajo la que la originó.",
      },
      card2: {
        label: "Análisis de vacíos",
        title: "Comprueba quién responde qué",
        body:
          "Para cada pregunta que compruebas, obtenemos los resultados y " +
          "contamos las páginas que realmente la abordan. Pocas páginas " +
          "significan un vacío.",
      },
      card3: {
        label: "Visibilidad en IA",
        title: "Mira qué citan las AI Overviews",
        body:
          "Cuando Google responde una pregunta comprobada con una AI Overview, " +
          "mira qué sitios cita y si el tuyo es uno de ellos.",
      },
    },

    workflow: {
      eyebrow: "El proceso",
      title: "Entra un tema. Salen vacíos. El contenido es tuyo.",
      body:
        "GetTopQuestions es una herramienta de investigación. No escribe ni " +
        "publica por ti, y no hace seguimiento de posiciones. Te muestra dónde " +
        "faltan respuestas para que dediques tu tiempo a lo que importa.",
      step1: {
        label: "01 / Tema",
        title: "Empieza con las palabras de tu audiencia",
        body:
          "Escribe una categoría de producto, un problema o una frase sencilla. " +
          "Que sea amplio no importa. Se trata de abrir la puerta, no de " +
          "adivinar la palabra clave perfecta.",
        sample: "escritorio de pie",
      },
      step2: {
        label: "02 / Preguntas",
        title: "Mira las preguntas a su alrededor",
        body:
          "Las preguntas llegan en forma de árbol, para que sigas cómo una " +
          "lleva a la siguiente, igual que haría un comprador curioso.",
        sample: "¿Vale la pena un escritorio de pie para el dolor de espalda?",
      },
      step3: {
        label: "03 / Vacíos",
        title: "Encuentra lo que nadie respondió",
        body:
          "Comprueba las preguntas que te importan. Cada una vuelve con las " +
          "páginas que la abordan, un veredicto y sus propias preguntas " +
          "relacionadas.",
        sample: "0 de 8 páginas abordan esta pregunta",
      },
      note: "Ejemplos escritos por nuestro equipo, no resultados reales de la app.",
    },

    examples: {
      eyebrow: "De la pregunta al contenido",
      title: "Así se ve un vacío.",
      sub:
        "Elige un tema. Son ejemplos escritos por nuestro equipo para mostrar " +
        "cómo leer un resultado, no resultados reales de la app.",
      columnQuestion: "Pregunta de la gente",
      columnPages: "Páginas que la abordan",
      columnVerdict: "Veredicto",
      columnIdea: "Qué hacer",
      skipIdea: "Sáltala, salvo que tengas algo nuevo que aportar",
      tab1: {
        term: "masa madre",
        q1: "¿Por qué mi masa madre dejó de crecer después de una semana?",
        idea1: "Una lista de diagnóstico: temperatura, harina, alimentación, tiempos",
        q2: "¿Puedo usar harina común para la masa madre?",
        idea2: "Una respuesta directa y luego los pros y contras, en un bloque de FAQ",
        q3: "¿Cómo se hace masa madre?",
      },
      tab2: {
        term: "software de facturación",
        q1: "¿Puedo emitir facturas sin darme de alta como empresa?",
        idea1: "Una guía en lenguaje claro, dividida por situación",
        q2: "¿El software de facturación es deducible?",
        idea2: "Una respuesta breve con ejemplos resueltos",
        q3: "¿Cuál es el mejor software de facturación?",
      },
      tab3: {
        term: "zapatillas de trail",
        q1: "¿Se pueden usar zapatillas de trail sobre roca mojada?",
        idea1: "Una comparativa probada con tus propias fotos",
        q2: "¿Cuánto duran las zapatillas de trail?",
        idea2: "Una guía de kilometraje con las señales de desgaste",
        q3: "¿Cuáles son las mejores zapatillas de trail?",
      },
    },

    builtFor: {
      eyebrow: "Hecho para la búsqueda con IA",
      title: "Responde preguntas reales. Haz que la IA te descubra.",
      body:
        "La búsqueda se está convirtiendo en una conversación. GetTopQuestions " +
        "te muestra qué pregunta tu audiencia y dónde se quedan cortas las " +
        "respuestas actuales, para que escribas respuestas claras para AI " +
        "Overviews, asistentes y la búsqueda tradicional. La visibilidad nunca " +
        "está garantizada, pero una pregunta sin responder es el lugar " +
        "adecuado para empezar.",
      point1: "Mira qué sitios cita la AI Overview de Google en cada pregunta que compruebas",
      point2: "Introduce tu sitio y mira las preguntas en las que te citan",
      point3: "Estructura el contenido en torno a búsquedas conversacionales reales",
      demoLabel: "Ejemplo: crm",
      demo1Q: "¿Cuál es el mejor CRM para pequeñas empresas?",
      demo1Meta: "6 de 8 páginas la abordan",
      demo2Q: "¿Necesito un CRM si uso Google Workspace?",
      demo2Meta: "0 de 8 páginas la abordan",
      demo3Q: "¿Cómo pasar de una hoja de cálculo a un CRM?",
      demo3Meta: "2 de 8 páginas la abordan",
      demoNote: "Ejemplo escrito por nuestro equipo. No son mediciones reales.",
    },

    formats: {
      eyebrow: "Formatos de contenido",
      title: "Deja que la pregunta elija el formato.",
      body:
        "La forma en que se plantea una pregunta indica cómo quiere ser " +
        "respondida. Las respuestas claras y bien organizadas sirven al lector " +
        "tanto en los resultados como en AI Overviews y asistentes. En ninguno " +
        "hay garantías, pero una estructura útil es una apuesta sensata.",
      card1: {
        title: "Secciones de FAQ",
        when: "Cuando una pregunta tiene una respuesta breve y factual.",
        how: "Empieza con la respuesta en una o dos frases y luego añade matices.",
      },
      card2: {
        title: "Guías en profundidad",
        when: "Cuando varias preguntas comparten un mismo problema de fondo.",
        how: "Usa cada pregunta como subtítulo para que el lector salte a la suya.",
      },
      card3: {
        title: "Páginas comparativas",
        when: "Cuando las preguntas incluyen «vs», «o» o «mejor».",
        how: "Sé concreto sobre a quién le conviene cada opción. Las tablas ayudan.",
      },
      card4: {
        title: "Guías paso a paso",
        when: "Cuando las preguntas empiezan por «cómo puedo».",
        how: "Numera los pasos y di cómo se ve el resultado final.",
      },
      card5: {
        title: "Vídeo corto y redes sociales",
        when: "Cuando la respuesta es visual o rápida de demostrar.",
        how: "Pon la pregunta en pantalla en los primeros segundos.",
      },
      card6: {
        title: "Newsletter y notas de ventas",
        when: "Cuando las preguntas revelan objeciones o dudas.",
        how: "Responde a la duda con honestidad antes de que se convierta en una venta perdida.",
      },
    },

    faq: {
      eyebrow: "Respuestas prácticas",
      title: "Preguntas sobre GetTopQuestions",
      q1: "¿Qué hace exactamente GetTopQuestions?",
      a1:
        "Escribes un tema y te mostramos en forma de árbol las preguntas que " +
        "Google presenta sobre él. En las preguntas que compruebas, leemos los " +
        "resultados de búsqueda y mostramos cuántas páginas abordan realmente " +
        "cada una. Pocas páginas significan un vacío: una pregunta que tu " +
        "competencia no ha respondido.",
      q2: "¿En qué se diferencia de una lista de preguntas?",
      a2:
        "Una lista muestra qué pregunta la gente. Nosotros también comprobamos " +
        "los resultados detrás de cada pregunta, para que veas cuáles ya están " +
        "bien respondidas y cuáles siguen abiertas.",
      q3: "¿Un vacío es siempre un vacío real?",
      a3:
        "No. El veredicto es una estimación basada en los títulos y direcciones " +
        "de las páginas de los resultados, y puede equivocarse. Cada veredicto " +
        "muestra las páginas que lo sustentan, para que juzgues por ti mismo. " +
        "Una pregunta sin comprobar se muestra como no comprobada, nunca como " +
        "un vacío.",
      q4: "¿Cuánto cuesta una búsqueda?",
      a4:
        "Cada búsqueda es un crédito. Comprobar una pregunta es una búsqueda " +
        "propia: te da el veredicto de esa pregunta y su propio árbol de preguntas.",
      q5: "¿Escribe o publica contenido por mí?",
      a5:
        "No. GetTopQuestions te ayuda a decidir sobre qué escribir. Redactar, " +
        "editar y publicar es cosa tuya, y ahí es donde entran tu experiencia " +
        "y tu voz.",
      q6: "¿Hace seguimiento de mis posiciones?",
      a6:
        "No. No hay seguimiento de posiciones ni monitorización continua. En " +
        "una pregunta que compruebas, muestra qué sitios citaba la AI Overview " +
        "de Google en el momento de la comprobación.",
      q7: "¿Responder estas preguntas me llevará a las AI Overviews?",
      a7:
        "Nadie puede prometerlo. Responder preguntas reales con claridad y " +
        "precisión es una base sensata, pero la colocación la deciden esas " +
        "plataformas.",
    },

    pricing: {
      title: "Precios simples y transparentes",
      sub:
        "Encuentra las preguntas que pueden hacer crecer tu visibilidad en " +
        "IA y en búsqueda. Cancela cuando quieras.",
      seeAll: "Compara todas las funciones →",
      note:
        "Precios estáticos — el checkout aún no está conectado. Los créditos " +
        "se conceden a mano mientras el producto está en preview.",
    },
    cta: {
      title: "¿Listo para encontrar lo que nadie respondió?",
      sub: "Empieza con un tema y sal con las preguntas que tu competencia pasó por alto.",
      primary: "Empieza gratis",
      secondary: "Ver precios",
    },

    footer: {
      tagline: "Encuentra las preguntas que tu competencia nunca respondió.",
      product: {
        heading: "Producto",
        features: "Funciones",
        pricing: "Precios",
      },
      company: {
        heading: "Empresa",
        contact: "Contacto",
        privacy: "Política de privacidad",
        terms: "Términos del servicio",
      },
      copyright: "© {year} GetTopQuestions. Todos los derechos reservados.",
    },

    saved: {
      heading: "Tus análisis recientes",
      demoHeading: "Míralo con datos reales",
      count: "{count} guardados",
    },
  },
};
