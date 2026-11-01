import type { ContactContent } from "./index";

/**
 * Página de contacto - traducción de la versión inglesa. Debe coincidir con
 * `en.ts` campo por campo; el tipo lo convierte en un error de compilación.
 */
export const es: ContactContent = {
  title: "Contacto",
  description:
    "¿Tienes preguntas sobre planes, configuración o cómo convertir la investigación de preguntas en contenido? Escribe al equipo de GetTopQuestions.",

  hero: {
    eyebrow: "Contacto",
    head: "¿Preguntas sobre",
    headTinted: "GetTopQuestions",
    headTail: "? Pregúntanos.",
    lead: "Tanto si estás eligiendo un plan como conectando la API de Pro o pensando cómo convertir la investigación de preguntas en contenido, escríbenos."
  },

  reasons: [
    {
      title: "Equipos más grandes",
      desc: "Cuéntanos cuántos términos, sitios o clientes investigas y hablaremos de lo que encaja."
    },
    {
      title: "Soporte técnico",
      desc: "Ayuda con tu cuenta, las exportaciones y la configuración de la API o MCP en el plan Pro."
    },
    {
      title: "Colaboraciones y comentarios",
      desc: "Ideas, propuestas de colaboración o comentarios sobre cómo encaja la investigación de preguntas en tu trabajo."
    }
  ],

  before: {
    heading: "Antes de escribir",
    intro: "Incluir algunos detalles nos ayuda a darte una respuesta útil a la primera:",
    items: [
      "Los términos o temas que investigas",
      "El plan que usas o estás considerando",
      "Para preguntas sobre API, búsquedas masivas o MCP: con qué quieres conectarlo",
      "Para preguntas de facturación o cuenta: el correo con el que te registraste"
    ],
    pricingLead: "¿Comparando planes? La ",
    pricingLink: "página de precios",
    pricingTail: " enumera cada función por plan.",
    solutionsLead: " ¿Quieres saber cómo usan otros equipos la investigación de preguntas? Mira ",
    solutionsLink: "soluciones",
    solutionsTail: "."
  },

  form: {
    name: "Nombre completo",
    namePlaceholder: "Ana García",
    email: "Correo electrónico",
    emailPlaceholder: "ana@ejemplo.com",
    company: "Empresa (opcional)",
    companyPlaceholder: "Acme S.L.",
    subject: "Asunto",
    subjectPlaceholder: "¿En qué podemos ayudarte?",
    message: "Mensaje",
    messagePlaceholder: "Cuéntanos un poco sobre lo que necesitas...",
    submit: "Enviar mensaje",
    sending: "Enviando…",
    sent: "Gracias: tu mensaje va de camino.",
    sentDetail: "Leemos todos los mensajes y solemos responder en dos días laborables.",
    failed: "No se ha podido enviar. Inténtalo de nuevo o escríbenos directamente.",
    tooMany: "Son muchos mensajes desde un mismo sitio. Inténtalo más tarde.",
  },
};
