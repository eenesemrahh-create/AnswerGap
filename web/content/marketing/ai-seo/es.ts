import type { AiSeoShape } from "../blocks";

/** Spanish AI SEO copy. Shape, sources of every figure and the reasoning are in `en.ts`. */
export const es = {
  title: "SEO con IA: que te cite el AI Overview de Google",
  description:
    "Google ya responde muchas preguntas con un AI Overview que nombra unas " +
    "pocas fuentes. Mira qué preguntan las personas, qué preguntas no " +
    "responde ninguna página y a qué sitios cita la IA, incluido el tuyo.",

  hero: {
    eyebrow: "SEO con IA",
    head: "Conviértete en la fuente que",
    headTinted: "cita la búsqueda con IA.",
    headTail: "",
    lead:
      "Google ya responde muchas preguntas con un AI Overview y nombra unas " +
      "pocas fuentes a su lado. AnswerGap te muestra qué pregunta la gente, " +
      "qué preguntas no responde de verdad ninguna página y a qué sitios " +
      "cita la IA, incluido el tuyo.",
  },
  heroPrimary: "Empieza gratis",
  heroSecondary: "Ver cómo funciona",

  shift: {
    eyebrow: "Qué ha cambiado",
    heading: "Ahora la respuesta va antes que los enlaces.",
    lead:
      "Antes, buscar era ver diez enlaces azules. Ahora una respuesta " +
      "escrita por IA se sitúa encima de ellos y decide qué pocos sitios " +
      "salen nombrados.",
    cards: [
      {
        figure: "32 / 32",
        title: "Respuestas de People Also Ask con IA",
        desc:
          "En una muestra que obtuvimos mientras construíamos este producto, " +
          "las 32 respuestas desplegadas de People Also Ask eran un AI " +
          "Overview, no una cita de una página.",
      },
      {
        figure: "13 / 16",
        title: "La IA nombra sus fuentes",
        desc:
          "En un tema de blanqueamiento dental, el AI Overview de Google " +
          "citó fuentes en 13 de las 16 preguntas que comprobamos. Esos " +
          "pocos enlaces son la nueva portada.",
      },
      {
        figure: "Por encima del #1",
        title: "Un rastreador de posiciones no lo ve",
        desc:
          "Un rastreador de posiciones te dice en qué lugar de la lista " +
          "estás. No te dice si la respuesta que hay encima de la lista te " +
          "nombra, y esa respuesta es lo que la gente lee primero.",
      },
    ],
  },

  product: {
    eyebrow: "Qué mide AnswerGap",
    heading: "De una palabra clave a una lista de oportunidades.",
    lead:
      "Tres cosas, leídas de los mismos resultados de Google y mostradas " +
      "juntas para cada pregunta del árbol.",
    points: [
      {
        title: "Qué pregunta la gente",
        desc:
          "Una búsqueda abre la cadena de People Also Ask de Google: unas 15 " +
          "preguntas, a cinco niveles de profundidad, en el país y el idioma " +
          "que elijas.",
      },
      {
        title: "Qué preguntas no responde nadie",
        desc:
          "Leemos los resultados de búsqueda de una pregunta y contamos las " +
          "páginas que de verdad la abordan. Pocas o ninguna es un hueco: " +
          "una pregunta que puedes hacer tuya. Cada veredicto muestra su " +
          "evidencia.",
      },
      {
        title: "A quién cita la IA, y si eres tú",
        desc:
          "Cada pregunta comprobada lista los sitios que cita el AI " +
          "Overview de Google. Introduce tu dominio para ver dónde te " +
          "nombran y dónde nombran a un competidor en tu lugar.",
      },
    ],
    demo: {
      badge: "Ejemplo",
      seed: "blanqueamiento dental",
      pagesLabel: "{matching} de {checked} páginas la abordan",
      rows: [
        {
          question: "¿Recomiendan los dentistas el blanqueamiento dental?",
          status: "gap",
          label: "Sin responder",
          matching: 0,
          checked: 8,
          ai: "AI 4",
          you: false,
        },
        {
          question: "¿Qué blanquea los dientes más rápido?",
          status: "weak",
          label: "Apenas respondida",
          matching: 1,
          checked: 7,
          ai: "AI 6",
          you: false,
        },
        {
          question: "¿Cuánto cuesta el blanqueamiento dental?",
          status: "covered",
          label: "Bien respondida",
          matching: 6,
          checked: 8,
          ai: "AI 5 · tú",
          you: true,
        },
      ],
      note:
        "Ilustrativo. Un resultado real lista cada página que leímos y cada " +
        "sitio que cita la IA.",
    },
  },

  playbook: {
    head: "Una guía para la",
    headTinted: "búsqueda con IA",
    headTail: ".",
    lead:
      "Cuatro pasos, que se repiten. El árbol te dice por dónde empezar; " +
      "volver a buscar te dice si funcionó.",
    steps: [
      {
        title: "Busca tu tema",
        desc:
          "Empieza con las palabras que usan tus clientes. Una búsqueda es " +
          "un crédito, y las fuentes del AI Overview vienen incluidas.",
      },
      {
        title: "Elige los huecos",
        desc:
          "Ordena la tabla por páginas que abordan cada pregunta. Las que " +
          "tienen menos son las que carecen de respuesta.",
      },
      {
        title: "Mira a quién cita la IA",
        desc:
          "Introduce tu dominio. Las preguntas en las que la IA nombra a un " +
          "competidor y no a ti son tu segunda lista.",
      },
      {
        title: "Escribe la respuesta y busca de nuevo",
        desc:
          "Publica una página que responda la pregunta directamente y " +
          "repite la búsqueda. Cada resultado lleva fecha, así que puedes " +
          "comparar.",
      },
    ],
  },

  citable: {
    eyebrow: "Escribir para las respuestas de la IA",
    heading: "Qué hace que una página sea fácil de citar.",
    lead:
      "Nadie fuera de Google sabe exactamente cómo elige el AI Overview sus " +
      "fuentes. Estos hábitos hacen que una respuesta sea fácil de " +
      "encontrar, citar y creer, algo que también favorece a los lectores " +
      "humanos.",
    cards: [
      {
        title: "Responde en la primera frase",
        desc:
          "Pon la respuesta directa justo debajo del encabezado y explica " +
          "después. Una respuesta enterrada en el cuarto párrafo es difícil " +
          "de citar.",
      },
      {
        title: "Usa la pregunta como encabezado",
        desc:
          "Formula los encabezados como los formula la gente. Así es como la " +
          "pregunta ya aparece en People Also Ask.",
      },
      {
        title: "Una pregunta, una sección",
        desc:
          "Dale a cada pregunta su propia sección bien delimitada, para que " +
          "un pasaje siga teniendo sentido cuando se extrae por separado.",
      },
      {
        title: "Cubre las preguntas siguientes",
        desc:
          "El árbol muestra lo que la gente pregunta después. Responder a " +
          "las preguntas hijas de una pregunta hace de tu página la fuente " +
          "completa, no una más entre muchas.",
      },
      {
        title: "Muestra tu evidencia",
        desc:
          "Cifras, fuentes con nombre y un autor con nombre. Una afirmación " +
          "concreta es más fácil de creer que una general.",
      },
      {
        title: "Mantenla fechada y al día",
        desc:
          "Indica cuándo se actualizó la página por última vez y revísala " +
          "cuando cambien las preguntas de tu árbol.",
      },
    ],
  },

  limits: {
    eyebrow: "Con claridad",
    heading: "Lo que no afirmamos.",
    lead:
      "La búsqueda con IA es nueva, y muchas herramientas del sector venden " +
      "una certeza que nadie tiene. Esto es exactamente lo que mide " +
      "AnswerGap, y lo que no.",
    items: [
      {
        title: "Solo Google, por ahora",
        desc:
          "Leemos el AI Overview de Google. ChatGPT, Claude y Perplexity no " +
          "se miden, y nadie puede venderte sus volúmenes reales de prompts.",
      },
      {
        title: "Una instantánea, no datos en vivo",
        desc:
          "Cada resultado lleva la hora a la que se obtuvo. Los resultados " +
          "de Google cambian; busca de nuevo para actualizar.",
      },
      {
        title: "El veredicto de hueco es una estimación",
        desc:
          "Se calcula a partir de las páginas que leemos y a veces se " +
          "equivocará. La evidencia siempre se muestra y puedes marcar " +
          "cualquier veredicto como acertado o erróneo.",
      },
      {
        title: "Sin citas garantizadas",
        desc:
          "Nadie puede prometerte que una IA te citará. Te mostramos dónde " +
          "está la oportunidad; la respuesta te toca escribirla a ti.",
      },
    ],
  },

  faq: {
    heading: "El SEO con IA, en breve",
    items: [
      {
        title: "¿Qué es el SEO con IA?",
        desc:
          "El SEO con IA, también llamado GEO (generative engine " +
          "optimization) o AEO (answer engine optimization), es el trabajo " +
          "de lograr que tu contenido se use y se cite en respuestas " +
          "escritas por IA, como el AI Overview de Google, y no solo que " +
          "posicione en los enlaces de debajo.",
      },
      {
        title: "¿El SEO con IA es distinto del SEO de siempre?",
        desc:
          "Se apoya en él. Las respuestas de la IA se nutren de páginas que " +
          "los buscadores ya pueden encontrar, así que el rastreo y la " +
          "calidad siguen importando. Lo que cambia es el objetivo: una " +
          "respuesta clara y citable a una pregunta concreta, en lugar de " +
          "una página que posiciona para una palabra clave.",
      },
      {
        title: "¿Qué motores de IA sigue AnswerGap?",
        desc:
          "El AI Overview de Google, leído de los mismos resultados de " +
          "búsqueda que usamos para encontrar huecos. Hoy no se siguen otros " +
          "asistentes.",
      },
      {
        title: "¿Cómo decide AnswerGap que una pregunta es un hueco?",
        desc:
          "Para cada pregunta obtenemos los resultados de búsqueda, " +
          "comparamos cada página con la pregunta y contamos las páginas que " +
          "de verdad la abordan. Pocas o ninguna significa un hueco. Es una " +
          "estimación, y las páginas en las que se basa siempre se muestran.",
      },
      {
        title: "¿Cuánto cuesta?",
        desc:
          "Cada búsqueda es un crédito, y las fuentes del AI Overview van " +
          "incluidas sin coste adicional. Volver a abrir un resultado que " +
          "ya tienes es gratis.",
      },
    ],
  },

  cta: {
    head: "Encuentra las preguntas que la IA responde sin ti.",
    lead:
      "Busca un tema y mira los huecos, y los sitios a los que cita la IA, " +
      "en una sola vista.",
    primary: "Empieza gratis",
    secondary: "Ver precios",
  },
} as const satisfies AiSeoShape;
