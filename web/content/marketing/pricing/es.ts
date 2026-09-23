import type { PricingContent } from "./index";

/**
 * Textos de la página de precios - traducción de la versión inglesa.
 *
 * Debe corresponderse con `en.ts` clave por clave y viñeta por viñeta; el tipo
 * convierte lo contrario en un error de compilación. Los precios y el orden de
 * los planes en la tabla comparativa son datos, no texto: se copian tal cual.
 *
 * Lee también el aviso de `en.ts`: esta página describe funciones que todavía
 * no existen, así que no debe anunciarse como disponible hasta que existan o
 * hasta que estas líneas cambien.
 */
export const es: PricingContent = {
  title: "Precios",
  description:
    "Planes para equipos que necesitan saber qué preguntas responde la " +
    "búsqueda con IA, cuáles no y a quién cita.",

  hero: {
    eyebrow: null,
    head: "Precios para la era de la",
    headTinted: "búsqueda con IA.",
    headTail: "",
    lead:
      "Deja de adivinar qué están respondiendo los motores de IA. Descubre " +
      "las preguntas exactas que necesitas para dominar la visibilidad y " +
      "ganarte las citas.",
  },

  billing: {
    monthly: "Mensual",
    annually: "Anual",
    save: "Ahorra un 20 %",
    billedMonthly: "Facturación mensual",
    billedAnnually: "Facturación anual",
    plusTax: "+ Impuestos",
  },

  plans: [
    {
      name: "Starter",
      desc: "Para creadores y equipos pequeños que empiezan a ganar visibilidad en la búsqueda con IA.",
      priceMonthly: "$9.99",
      priceAnnual: "$7.99",
      per: "/mes",
      cta: "Empieza la prueba de 7 días",
      badge: null,
      featuresHeading: "El mejor plan para empezar",
      features: [
        "100 créditos al mes",
        "Usuarios ilimitados",
        "Todas las regiones",
        "Todos los idiomas",
        "Exportación de imagen PNG",
        "Historial de búsquedas de 24 horas",
      ],
    },
    {
      name: "Lite",
      desc: "Para profesionales del SEO que amplían su autoridad en la búsqueda con IA.",
      priceMonthly: "$19.99",
      priceAnnual: "$15.99",
      per: "/mes",
      cta: "Elige Lite",
      badge: "El más popular",
      featuresHeading: "El más popular",
      features: [
        "300 créditos al mes",
        "Usuarios ilimitados",
        "Todas las regiones",
        "Todos los idiomas",
        "Exportación de imagen PNG",
        "Historial de búsquedas de 1 mes",
        "Búsqueda profunda",
        "Exportación de datos en CSV",
      ],
    },
    {
      name: "Pro",
      desc: "Para equipos de gran volumen y agencias que necesitan marca blanca.",
      priceMonthly: "$39.99",
      priceAnnual: "$31.99",
      per: "/mes",
      cta: "Elige Pro",
      badge: null,
      featuresHeading: "La mejor relación calidad-precio",
      features: [
        "1.000 créditos al mes",
        "Usuarios ilimitados",
        "Todas las regiones",
        "Todos los idiomas",
        "Exportación de imagen PNG",
        "Historial de búsquedas de 1 año",
        "Búsqueda profunda",
        "Exportación de datos en CSV",
        "Búsquedas por lotes",
        "Acceso a la API",
        "Créditos de pago por uso",
        "Servidor MCP",
      ],
    },
  ],

  compare: {
    heading: "Compara las funciones de cada plan",
    featureColumn: "Funciones",
    groupHeading: "Funciones del plan",
    rows: [
      { label: "Créditos al mes", values: ["100", "300", "1.000"] },
      { label: "Usuarios ilimitados", values: [true, true, true] },
      { label: "Todas las regiones", values: [true, true, true] },
      { label: "Todos los idiomas", values: [true, true, true] },
      { label: "Exportación de imagen PNG", values: [true, true, true] },
      { label: "Historial de búsquedas", values: ["24 horas", "1 mes", "1 año"] },
      { label: "Búsqueda profunda", values: [false, true, true] },
      { label: "Exportación de datos en CSV", values: [false, true, true] },
      { label: "Búsquedas por lotes", values: [false, false, true] },
      { label: "Acceso a la API", values: [false, false, true] },
      { label: "Créditos de pago por uso", values: [false, false, true] },
      { label: "Servidor MCP", values: [false, false, true] },
    ],
  },

  faq: {
    heading: "Preguntas frecuentes",
    items: [
      {
        title: "¿Qué cuenta como una consulta?",
        desc:
          "Un crédito es una búsqueda. Desplegar una palabra clave en su " +
          "árbol de preguntas cuesta un solo crédito, vengan las preguntas " +
          "que vengan. Comprobar quién responde de verdad a una pregunta se " +
          "cobra aparte, porque cada comprobación es una petición propia.",
      },
      {
        title: "¿Puedo cambiar de plan más adelante?",
        desc:
          "Sí, cuando quieras. Subir de plan surte efecto de inmediato; bajar " +
          "surte efecto al final del ciclo que ya has pagado. Los créditos " +
          "que ya hayas comprado siguen siendo tuyos.",
      },
      {
        title: "¿Cómo funciona el acceso a la API?",
        desc:
          "Pro incluye acceso a la API y un servidor MCP, así que tus propias " +
          "herramientas y asistentes pueden lanzar búsquedas y leer los " +
          "resultados directamente, sin pasar por esta interfaz.",
      },
      {
        title: "¿Ofrecéis precios a medida para empresas?",
        desc:
          "Sí. Si necesitas más volumen, informes de marca blanca o varios " +
          "espacios de trabajo, escríbenos y prepararemos un plan ajustado al " +
          "volumen que realmente uses.",
      },
    ],
  },

  cta: {
    heading: "¿Listo para descubrir las respuestas?",
    lead:
      "Únete a los equipos de contenido que usan AnswerGap para alinear su " +
      "estrategia con la intención de la búsqueda con IA.",
    primary: "Empieza tu prueba gratuita de 7 días",
    secondary: "Habla con ventas",
  },
};
