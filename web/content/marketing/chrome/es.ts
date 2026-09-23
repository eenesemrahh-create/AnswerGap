import type { ChromeContent } from "./index";

/**
 * Menú superior y pie de página de las páginas de marketing - traducción de la
 * versión inglesa.
 *
 * Debe corresponderse con `en.ts` clave por clave y línea por línea; el tipo
 * convierte lo contrario en un error de compilación. Aquí solo se listan
 * enlaces a páginas que existen de verdad; `nav.aiSeo` y `nav.blog` todavía no
 * tienen página, así que se muestran como texto y no como enlace.
 */
export const es: ChromeContent = {
  nav: {
    pricing: "Precios",
    solutions: "Soluciones",
    aiSeo: "AI SEO",
    blog: "Blog",
    contact: "Contacto",
    signIn: "Inicia sesión",
    signUp: "Regístrate",
  },
  footer: {
    tagline:
      "Encuentra las preguntas que la búsqueda con IA necesita responder y " +
      "convierte tu marca en la fuente de confianza que recomienda.",
    product: "Producto",
    resources: "Recursos",
    company: "Empresa",
    links: {
      features: "Funciones",
      solutions: "Soluciones",
      pricing: "Precios",
      blog: "Blog",
      about: "Sobre nosotros",
      contact: "Contacto",
      privacy: "Política de Privacidad",
      terms: "Términos de Servicio",
    },
  },
};
