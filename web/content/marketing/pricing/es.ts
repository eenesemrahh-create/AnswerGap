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
      "Deja de adivinar qué quiere saber tu audiencia. Descubre las preguntas que hace la gente y planifica contenido para la búsqueda, AI Overviews y la IA conversacional.",
  },

  billing: {
    monthly: "Mensual",
    annually: "Anual",
    save: "Ahorra un 20 %",
    billedMonthly: "Facturación mensual",
    billedAnnually: "Facturación anual",
    plusTax: "+ Impuestos",
    signUpNow: "Regístrate ahora",
  },

  plans: [
    {
      name: "Starter",
      desc: "Para creadores y equipos pequeños que empiezan a ganar visibilidad en la búsqueda con IA.",
      priceMonthly: "$9.99",
      priceAnnual: "$7.99",
      per: "/mes",
      cta: "Elige Starter",
      badge: null,
      featuresHeading: "El mejor plan para empezar",
      features: [
        "100 créditos al mes",
        "Usuarios ilimitados",
        "Todas las regiones",
        "Todos los idiomas",
        "Exportación de imagen PNG",
        "Historial de búsquedas ilimitado",
        "Búsqueda profunda",
        "Exportación de datos en CSV",
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
        "Historial de búsquedas ilimitado",
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
        "Historial de búsquedas ilimitado",
        "Búsqueda profunda",
        "Exportación de datos en CSV",
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
      { label: "Historial de búsquedas ilimitado", values: [true, true, true] },
      { label: "Búsqueda profunda", values: [true, true, true] },
      { label: "Exportación de datos en CSV", values: [true, true, true] },
    ],
  },

  guide: {
    eyebrow: "Elección de plan",
    title: "¿Qué plan se adapta a tu forma de trabajar?",
    lead: "Todos los planes incluyen usuarios ilimitados, todas las regiones y todos los idiomas. Las diferencias están en los créditos, el tiempo que se guarda el historial y cómo sacas las preguntas de GetTopQuestions.",
    cards: [
      {
        name: "Starter",
        choose: "Elige Starter si",
        points: [
          "investigas unos pocos términos cada semana, hasta 100 créditos al mes",
          "actúas sobre los resultados el mismo día, ya que el historial se guarda 24 horas",
          "compartes los hallazgos como imágenes PNG en lugar de hojas de cálculo"
        ],
        next: "Considera Lite cuando quieras volver a las búsquedas de la semana pasada o abrir los resultados en una hoja de cálculo."
      },
      {
        name: "Lite",
        choose: "Elige Lite si",
        points: [
          "planificas contenido con regularidad y necesitas hasta 300 créditos al mes",
          "vuelves a tu investigación durante varias semanas con 1 mes de historial",
          "quieres búsqueda profunda y exportación CSV para ordenar las preguntas en un plan"
        ],
        next: "Considera Pro cuando investigues muchos términos a la vez o quieras los resultados en tus propias herramientas."
      },
      {
        name: "Pro",
        choose: "Elige Pro si",
        points: [
          "investigas para varios clientes o sitios, hasta 1.000 créditos al mes",
          "necesitas búsquedas masivas, acceso a la API o el servidor MCP",
          "quieres un año de historial de búsqueda o créditos de pago por uso"
        ],
        next: "El acceso a la API, las búsquedas masivas y el servidor MCP solo están en Pro."
      }
    ],
    estimateLabel: "Cómo estimar créditos:",
    estimate: "los créditos se usan al hacer búsquedas. Una forma sencilla de elegir es listar los términos que esperas investigar en un mes típico, en todos tus sitios o clientes, y compararlo con los créditos mensuales de cada plan. Si no estás seguro, empezar con poco y ampliar después es un enfoque razonable."
  },

  faq: {
    heading: "Preguntas frecuentes",
    items: [
      {
        title: "¿Para qué se usan los créditos?",
        desc: "Los créditos se usan para hacer búsquedas. Cada plan incluye una asignación mensual: 100 en Starter, 300 en Lite y 1.000 en Pro. Para saber cómo usa los créditos una búsqueda concreta, contáctanos."
      },
      {
        title: "¿Puedo cambiar de plan más adelante?",
        desc: "Sí, puedes cambiar o cancelar tu suscripción. Si tienes dudas sobre cómo afecta un cambio a tu facturación, contáctanos antes de cambiar."
      },
      {
        title: "¿Qué plan incluye acceso a la API?",
        desc: "El acceso a la API solo está disponible en el plan Pro, junto con las búsquedas masivas, los créditos de pago por uso y el servidor MCP. Te permite llevar la investigación de preguntas a tus propias herramientas y procesos."
      },
      {
        title: "¿Y si mis necesidades superan el plan Pro?",
        desc: "Escríbenos desde la página de contacto y cuéntanos qué necesitas. Te diremos con sinceridad qué es posible."
      },
      {
        title: "¿Algún plan hace seguimiento de posiciones o citas en IA?",
        desc: "No. GetTopQuestions es una herramienta de investigación de preguntas. Te ayuda a descubrir las preguntas que hace la gente para que crees contenido útil. No hace seguimiento de posiciones, no monitoriza marcas ni informa de volúmenes de búsqueda."
      }
    ],
  },

  cta: {
    heading: "¿Listo para descubrir las respuestas?",
    lead:
      "Empieza con un término, encuentra las preguntas que hace la gente y decide qué escribir a continuación.",
    primary: "Empieza gratis",
    secondary: "Habla con ventas",
  },
};
