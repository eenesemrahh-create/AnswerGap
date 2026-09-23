import type { SolutionsContent } from "./index";

/**
 * Textos de la página de soluciones - traducción de la versión inglesa.
 *
 * Debe corresponderse con `en.ts` tarjeta por tarjeta y línea por línea; el
 * tipo convierte lo contrario en un error de compilación. Las nueve tarjetas
 * de equipos describen para quién es el producto, no funciones que tenga, y
 * las tres tarjetas de la ventaja común están redactadas en torno a lo que se
 * mide y no a lo que se promete.
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
          "Cada pregunta sale de «Otras preguntas de los usuarios» del propio " +
          "Google, desplegada en un árbol y no en una lista, así que ves cómo " +
          "un tema se ramifica en el siguiente.",
      },
      {
        title: "Encuentra huecos de visibilidad",
        desc:
          "Para cualquier pregunta recuperamos las páginas que se posicionan " +
          "y contamos cuántas la responden de verdad. Que pocas páginas " +
          "superen el listón es la oportunidad, y es la cifra sobre la que " +
          "está construido este producto.",
      },
      {
        title: "Crea con confianza",
        desc:
          "Consulta qué fuentes cita el resumen con IA de Google en cada " +
          "pregunta, y si tu propio dominio está entre ellas, antes de decidir " +
          "qué escribir.",
      },
    ],
  },
};
