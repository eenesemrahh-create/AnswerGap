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
      "Descubre las preguntas que la gente hace sobre tu tema y crea contenido útil que las responda.",
    product: "Producto",
    resources: "Recursos",
    company: "Empresa",
    rights: "Todos los derechos reservados.",
    links: {
      features: "Funciones",
      solutions: "Soluciones",
      pricing: "Precios",
      api: "API",
      changelog: "Novedades",
      blog: "Blog",
      seoGuides: "Guías de SEO",
      helpCenter: "Centro de ayuda",
      community: "Comunidad",
      about: "Sobre nosotros",
      contact: "Contacto",
      privacy: "Política de Privacidad",
      terms: "Términos de Servicio",
    },
  },
};
