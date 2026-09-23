import type { ContactContent } from "./index";

/**
 * Textos de la página de contacto - traducción de la versión inglesa.
 *
 * Debe corresponderse con `en.ts` clave por clave y línea por línea; el tipo
 * convierte lo contrario en un error de compilación. `form.privacy` es una
 * promesa, así que es una frase visible y no un texto de ayuda: si algún día
 * deja de ser cierta, esa línea es lo primero que hay que cambiar.
 */
export const es: ContactContent = {
  title: "Contacto",
  description:
    "Habla con el equipo de AnswerGap sobre volumen para empresas, acceso a " +
    "la API o cualquier otra cosa sobre visibilidad en la búsqueda con IA.",

  hero: {
    eyebrow: "Contacto",
    head: "Construyamos juntos tu",
    headTinted: "visibilidad en IA.",
    headTail: "",
    lead:
      "Si estás valorando un uso a escala empresarial, buscas orientación " +
      "técnica sobre nuestra API o simplemente tienes una duda estratégica " +
      "sobre la búsqueda generativa, nuestro equipo está listo para ayudarte.",
  },

  reasons: [
    {
      title: "Soluciones para empresas",
      desc:
        "Volumen de datos a medida, soporte prioritario y estrategia " +
        "personalizada para grandes marcas.",
    },
    {
      title: "Soporte técnico",
      desc:
        "Te ayudamos a integrar nuestros datos en los paneles y flujos de " +
        "trabajo de SEO que ya usas.",
    },
    {
      title: "Alianzas estratégicas",
      desc:
        "Únete a nosotros para trazar el futuro del descubrimiento de marcas " +
        "en los motores generativos.",
    },
  ],

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
    privacy:
      "Usamos lo que nos envías aquí para responderte, y para nada más. Se " +
      "envía por correo a nuestro buzón de soporte y no se guarda en este sitio.",
  },
};
