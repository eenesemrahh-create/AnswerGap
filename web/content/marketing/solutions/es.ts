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
  description: "Cómo fundadores, agencias y equipos de SEO y contenido usan GetTopQuestions para descubrir las preguntas de la gente y planificar contenido útil.",
  hero: {
    eyebrow: "Para todos los que deciden qué escribir a continuación",
    head: "Un término. Muchos equipos.",
    headTinted: "Mejores preguntas.",
    headTail: "",
    lead: "GetTopQuestions ayuda a los equipos a descubrir las preguntas que la gente hace en torno a un término y a convertirlas en contenido útil para la búsqueda tradicional, Google AI Overviews y la búsqueda conversacional con IA."
  },
  heroPrimary: "Empieza gratis",
  heroSecondary: "Ver precios",
  teams: {
    eyebrow: "Soluciones por equipo",
    heading: "Pensado para tu forma de trabajar.",
    lead: "Cada tarjeta muestra un término ilustrativo, una pregunta que podría surgir y el tipo de contenido que un equipo podría crear con ella. Los ejemplos los hemos escrito nosotros, no son resultados de la aplicación.",
    questionLabel: "Pregunta de ejemplo",
    ideaLabel: "Idea de contenido",
    cards: [
      {
        title: "Fundadores de SaaS",
        desc: "Conoce las preguntas que hacen los compradores antes de registrarse y respóndelas en tu sitio con sus palabras.",
        term: "software de onboarding",
        question: "¿Qué debe incluir una lista de onboarding para empleados remotos?",
        idea: "Una página de lista práctica que mencione tu producto solo donde realmente ayude."
      },
      {
        title: "Startups",
        desc: "Cubre tu categoría pronto y de forma útil, para que las nuevas audiencias encuentren respuestas claras en ti.",
        term: "contabilidad de carbono",
        question: "¿Las empresas pequeñas deben informar de sus emisiones?",
        idea: "Una explicación en lenguaje sencillo con una sección clara de «depende» según cada situación."
      },
      {
        title: "Agencias de marketing",
        desc: "Lleva la investigación de preguntas a las reuniones iniciales con clientes y conviértela en propuestas basadas en curiosidad real.",
        term: "paneles solares para el hogar",
        question: "¿Cuánto tardan los paneles solares en amortizarse?",
        idea: "Un brief listo para el cliente: una guía, tres respuestas FAQ y un guion de vídeo corto."
      },
      {
        title: "Equipos de SEO",
        desc: "Suma la investigación de preguntas al trabajo con palabras clave y planifica páginas que cubran un tema a fondo para la búsqueda y las respuestas de IA.",
        term: "refinanciación de hipoteca",
        question: "¿Merece la pena refinanciar por una pequeña bajada de tipos?",
        idea: "Reestructura una página existente con subtítulos basados en preguntas y respuestas directas."
      },
      {
        title: "Equipos de contenido",
        desc: "Llena la planificación editorial con preguntas que tus lectores hacen de verdad y decide cuáles merecen una pieza.",
        term: "cuidado de plantas de interior",
        question: "¿Por qué se ponen amarillas las hojas de mi monstera?",
        idea: "Una guía de solución de problemas y una serie de respuestas cortas para redes sociales."
      },
      {
        title: "Ecommerce",
        desc: "Responde las preguntas previas a la compra en páginas de producto, categoría y guías para ayudar a decidir.",
        term: "sartén de hierro fundido",
        question: "¿Se puede usar jabón en una sartén de hierro fundido?",
        idea: "Una sección de cuidados en la página de producto y una guía más larga de curado."
      },
      {
        title: "Marketing interno",
        desc: "Da a tus compañeros de marca, contenido y búsqueda una lista compartida de preguntas de clientes.",
        term: "seguro de viaje de negocios",
        question: "¿El seguro de viaje cubre conferencias canceladas?",
        idea: "Una biblioteca de FAQ compartida por el blog, el centro de ayuda y el equipo de ventas."
      },
      {
        title: "Grandes marcas",
        desc: "Investiga temas en distintas regiones e idiomas para ver cómo cambian las preguntas de un mercado a otro.",
        term: "bomba de calor",
        question: "¿Funcionan las bombas de calor en inviernos muy fríos?",
        idea: "Respuestas localizadas por mercado, revisadas por expertos regionales."
      },
      {
        title: "Editores y medios",
        desc: "Encuentra las preguntas que los lectores siguen haciendo sobre una historia y crea una cobertura útil y explicativa.",
        term: "semana laboral de cuatro días",
        question: "¿La semana de cuatro días reduce el sueldo?",
        idea: "Una pieza explicativa que responda las preguntas que una noticia deja abiertas."
      }
    ]
  },
  advantage: {
    eyebrow: "Una ventaja compartida",
    heading: "Pasa de las preguntas al contenido útil.",
    cards: [
      {
        title: "Descubre preguntas reales",
        desc: "Convierte un término en las preguntas relacionadas más frecuentes que la gente plantea mientras aprende, compara y decide.",
        bullets: [
          "Lee las preguntas por intención",
          "Detecta subtemas olvidados",
          "Investiga en distintas regiones e idiomas"
        ]
      },
      {
        title: "Encuentra huecos de contenido",
        desc: "Compara las preguntas con lo que ya has publicado y mira dónde puede ayudar tu experiencia.",
        bullets: [
          "Selecciona las preguntas que puedes responder bien",
          "Detecta páginas sin FAQ",
          "Elige qué merece su propia pieza"
        ]
      },
      {
        title: "Crea con confianza",
        desc: "Da a los redactores un punto de partida basado en preguntas para cada página, vídeo o publicación.",
        bullets: [
          "Planifica contenido conectado a mano",
          "Exporta preguntas en los planes compatibles",
          "Mantén la escritura en tu voz"
        ]
      }
    ]
  },
  workflow: {
    heading: "Un proceso sencillo para un panorama de búsqueda cambiante.",
    lead: "Da a todos, desde creadores individuales hasta grandes equipos de búsqueda, el mismo punto de partida sencillo: ¿qué pregunta la gente?",
    steps: [
      {
        title: "Escribe un tema",
        desc: "Empieza con un producto, una categoría, un problema del cliente o una palabra clave estratégica."
      },
      {
        title: "Mapea las preguntas",
        desc: "GetTopQuestions muestra las preguntas relacionadas más frecuentes en torno a tu término."
      },
      {
        title: "Aprovecha la oportunidad",
        desc: "Elige las preguntas que mejor puedes responder y crea contenido útil con tu propia voz."
      }
    ]
  },
  cta: {
    head: "Encuentra las preguntas que tu audiencia ya está haciendo.",
    lead: "Empieza con un término y termina con una idea clara de qué escribir a continuación.",
    primary: "Empieza gratis",
    secondary: "Habla con nosotros"
  }
};
