import type { SolutionsContent } from "./index";

/**
 * Textos de la página de soluciones - traducción de la versión inglesa.
 *
 * Debe corresponderse con `en.ts` tarjeta por tarjeta y línea por línea; el
 * tipo convierte lo contrario en un error de compilación. Las nueve tarjetas
 * de equipos describen para quién es el producto, no funciones que tenga.
 *
 * LOS PUNTOS DE LA VENTAJA COMÚN NO SON TODOS CIERTOS TODAVÍA: son la
 * traducción de los de `en.ts`, donde está anotado cuáles están pendientes
 * («explora por intención», «exporta los datos», «mide el avance»). Los pasos
 * del flujo de trabajo y el cierre describen lo que el producto ya hace.
 */
export const es: SolutionsContent = {
  title: "Soluciones",
  description:
    "Cómo los equipos de SEO, las agencias, los medios y las marcas usan " +
    "AnswerGap para encontrar las preguntas que la búsqueda con IA aún no ha " +
    "respondido.",

  hero: {
    eyebrow: "Pensado para todos los equipos que dan forma al descubrimiento con IA",
    head: "Una plataforma. Más formas de ganar en la",
    headTinted: "búsqueda con IA.",
    headTail: "",
    lead:
      "AnswerGap ayuda a los equipos a entender qué pregunta la gente, dónde " +
      "se quedan cortas las respuestas de la IA y qué crear para convertirse " +
      "en la fuente que la IA recomienda.",
  },
  heroPrimary: "Empieza gratis",
  heroSecondary: "Ver precios",

  teams: {
    eyebrow: "Soluciones por equipo",
    heading: "Pensado en torno a tu forma de trabajar.",
    lead:
      "Desde la primera búsqueda de una categoría hasta un programa global de " +
      "contenidos, AnswerGap da a cada equipo un siguiente paso práctico.",
    cards: [
      {
        title: "Fundadores de SaaS",
        desc:
          "Sigue la visibilidad en IA de tu SaaS y descubre las preguntas que " +
          "hacen los compradores antes de convertir.",
      },
      {
        title: "Startups",
        desc:
          "Haz que la IA te descubra pronto y construye autoridad antes de " +
          "que tu categoría se sature.",
      },
      {
        title: "Agencias de marketing",
        desc:
          "Informa de la visibilidad en IA de cada cliente y convierte los " +
          "huecos de citas en nuevas oportunidades de campaña.",
      },
      {
        title: "Equipos de SEO",
        desc:
          "Amplía los informes de SEO tradicional a las respuestas de la IA, " +
          "las citas y la demanda de búsqueda conversacional.",
      },
      {
        title: "Equipos de contenido",
        desc:
          "Demuestra qué contenidos impulsan la visibilidad en IA y prioriza " +
          "las preguntas que más merece la pena responder.",
      },
      {
        title: "Ecommerce",
        desc:
          "Descubre qué marcas recomienda la IA y crea contenido útil para " +
          "los recorridos de descubrimiento de producto.",
      },
      {
        title: "Marketing interno",
        desc:
          "Une a los equipos de marca, contenido y búsqueda en torno a una " +
          "sola estrategia medible de visibilidad en IA.",
      },
      {
        title: "Grandes marcas",
        desc:
          "Vigila temas, regiones e idiomas a escala mientras identificas los " +
          "huecos de toda tu cartera.",
      },
      {
        title: "Medios y editores",
        desc:
          "Encuentra grupos de preguntas emergentes y crea una cobertura " +
          "autorizada que los sistemas de IA puedan citar.",
      },
    ],
  },

  advantage: {
    eyebrow: "Una ventaja común",
    heading: "Pasa de las preguntas a acciones medibles.",
    cards: [
      {
        title: "Descubre demanda real",
        desc:
          "Convierte un solo tema en las preguntas conectadas que la gente " +
          "hace a lo largo de su proceso de decisión.",
        bullets: [
          "Explora las preguntas por intención",
          "Encuentra grupos de temas que nadie cubre",
          "Investiga cada mercado y cada idioma",
        ],
      },
      {
        title: "Encuentra huecos de visibilidad",
        desc:
          "Mira dónde las respuestas actuales son débiles, incompletas o no " +
          "existen, y dónde tu experiencia puede aportar algo.",
        bullets: [
          "Prioriza las preguntas con más oportunidad",
          "Entiende cuánta cobertura tiene cada respuesta",
          "Detecta los puntos ciegos de la competencia",
        ],
      },
      {
        title: "Crea con confianza",
        desc:
          "Da a los equipos de contenido y de SEO un brief claro y basado en " +
          "datos para cada página que publiquen.",
        bullets: [
          "Crea planes de contenido conectados",
          "Exporta los datos a tu flujo de trabajo",
          "Mide el avance con el tiempo",
        ],
      },
    ],
  },

  workflow: {
    head: "Un flujo de trabajo sencillo para una",
    headTinted: "búsqueda en constante cambio",
    headTail: ".",
    lead:
      "Da a todo el mundo, desde fundadores hasta equipos de búsqueda de " +
      "grandes empresas, la misma visión clara de la demanda y la oportunidad.",
    steps: [
      {
        title: "Introduce un tema",
        desc:
          "Empieza por un producto, una categoría, un problema de tus " +
          "clientes o una palabra clave estratégica.",
      },
      {
        title: "Mapea las preguntas",
        desc:
          "AnswerGap muestra las búsquedas relacionadas y los huecos que " +
          "dejan las respuestas de la IA que ya existen.",
      },
      {
        title: "Actúa sobre la oportunidad",
        desc:
          "Prioriza, exporta y crea contenido pensado para convertirse en una " +
          "fuente de referencia.",
      },
    ],
  },

  cta: {
    head: "Encuentra los huecos que tu público ya está buscando.",
    lead:
      "Empieza por un tema y convierte la demanda real de la búsqueda con IA " +
      "en una estrategia de visibilidad concreta.",
    primary: "Empieza gratis",
    secondary: "Habla con nosotros",
  },
};
