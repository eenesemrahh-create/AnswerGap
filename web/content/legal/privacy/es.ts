import type { PrivacyContent } from "./index";

/** Política de Privacidad - traducción de la versión inglesa, que es la vinculante. */
export const es: PrivacyContent = {
  title: "Política de Privacidad",
  description:
    "Qué recoge AnswerGap, quién más lo recibe, qué queda oculto al resto de la clientela y qué sobrevive al borrar su cuenta.",
  lead: "Aquí explicamos qué recogemos y por qué, con la claridad que querríamos de cualquier otro. El apartado 5 trata de lo que otras personas pueden ver y lo que no; el 7, de lo que borrar su cuenta elimina y lo que no.",
  effective: "2026-09-20",

  sections: {
    scope: {
      heading: "1. A quién afecta",
      body: [
        {
          p: "Esta política cubre AnswerGap en {site}, operado por {company} en Estados Unidos. {company} decide cómo y por qué se tratan los datos descritos aquí.",
        },
        {
          p: "Esta política se publica en varios idiomas. La versión vinculante es la inglesa; si una traducción la contradice, prevalece el texto en inglés.",
        },
      ],
    },

    collect: {
      heading: "2. Qué recogemos",
      body: [
        { p: "Si crea una cuenta:" },
        {
          ul: [
            "Su dirección de correo, escrita al registrarse o facilitada por Google si inicia sesión con Google.",
            "Su nombre, si lo indica, o el de su perfil de Google. Es opcional.",
            "Un enlace a su foto de perfil de Google, si inicia sesión con Google. Guardamos el enlace, no una copia de la imagen.",
            "Un hash de su contraseña, si se registró por correo. Nunca guardamos la contraseña en sí.",
            "El estado de su cuenta y las fechas de creación, última visita y confirmación.",
          ],
        },
        { p: "A medida que usa el servicio:" },
        {
          ul: [
            "Las palabras clave y preguntas que busca. Se guardan asociadas a su cuenta o, si ha cerrado sesión, a un identificador aleatorio guardado en su navegador.",
            "Qué preguntas nos pidió comprobar y qué resultados de búsqueda recuperamos para ellas.",
            "Un registro de cada crédito añadido o gastado en su cuenta, y por qué.",
            "Registros de uso: qué se hizo, si funcionó o fue rechazado, cuántos créditos consumió y cuánto nos costó.",
          ],
        },
        {
          p: "No almacenamos su dirección IP. Derivamos de ella un hash criptográfico con sal y truncado, y guardamos solo eso, para contar la búsqueda diaria gratuita y frenar los abusos. La dirección en sí existe únicamente mientras se atiende la petición y no se anota en ningún sitio; como el hash lleva una sal secreta que podemos cambiar, los valores guardados pueden volverse irrelevantes cuando queramos. Nuestro proveedor de alojamiento mantiene sus propios registros de conexión, fuera de nuestro control.",
        },
      ],
    },

    storage: {
      heading: "3. Cookies y lo que guarda su navegador",
      body: [
        {
          p: "El sitio de AnswerGap no usa cookies. No hay analítica, ni gestor de etiquetas, ni ningún script de terceros. Las tipografías se sirven desde nuestro propio dominio en lugar de pedirse a nadie.",
        },
        {
          p: "Su navegador guarda localmente, en su dispositivo, unos pocos valores que no podemos leer en remoto:",
        },
        {
          ul: [
            "Su sesión, durante catorce días. Cerrar sesión la elimina.",
            "Un identificador aleatorio que cuenta la búsqueda diaria gratuita de quienes no han iniciado sesión.",
            "Su preferencia de tema claro u oscuro.",
            "El idioma de la interfaz.",
            "Su preferencia de país e idioma para las búsquedas.",
            "La dirección de su propio sitio web, si escribió una para comprobar si aparece citado. Esa nunca llega hasta nosotros: la comparación ocurre dentro de su navegador.",
          ],
        },
        {
          p: "Nuestra herramienta interna de administración usa una cookie de sesión. La clientela nunca se topa con ella.",
        },
      ],
    },

    processors: {
      heading: "4. Quién más recibe datos",
      body: [
        { p: "Usamos pocos proveedores y enviamos a cada uno solo lo que necesita:" },
        {
          ul: [
            "Nuestro proveedor de datos de búsqueda recibe la palabra clave o el texto de la pregunta. No recibe su correo, ni su IP, ni identificador alguno de cuenta.",
            "Nuestro proveedor de coincidencia semántica, cuando esa función está activa, recibe el texto de las preguntas y los títulos y direcciones de los resultados. No recibe identificadores.",
            "Nuestro proveedor de correo recibe su dirección y el mensaje, para que lleguen los correos de verificación y de restablecimiento.",
            "Nuestro proveedor de pagos recibe lo que usted introduce en su propia página de pago.",
            "Google no recibe nada más allá del intercambio de inicio de sesión, y solo si elige entrar con Google.",
            "Nuestro proveedor de alojamiento ejecuta el servicio; el de buzón guarda lo que escriba a soporte.",
          ],
        },
        {
          p: "Los números de tarjeta nunca llegan a nosotros. La página de pago la aloja el proveedor de pagos y nosotros solo conservamos el registro del pago que nos devuelve.",
        },
        {
          p: "No vendemos sus datos ni los compartimos con fines publicitarios.",
        },
      ],
    },

    sharing: {
      heading: "5. Qué queda oculto a otras personas — y qué no",
      body: [
        {
          p: "Esto merece una respuesta franca más que tranquilizadora, porque el diseño es deliberado.",
        },
        {
          ul: [
            "Su lista de búsquedas es privada. Otra persona no puede ver qué palabras buscó ni abrir sus análisis guardados. Pedir un análisis ajeno devuelve «no encontrado» y no «no permitido», porque la mera existencia de una búsqueda ya es información.",
            "Los datos de preguntas son compartidos. Las preguntas, sus puntuaciones, los resultados en caché y los veredictos de hueco viven en un corpus común a toda la clientela, no en una copia privada por cuenta. Si usted y otra persona buscan la misma palabra, verán el mismo árbol, y la segunda búsqueda no cuesta nada porque la primera ya la pagó. Eso es lo que mantiene asequible el servicio.",
            "Los veredictos que da con los botones de «¿esto es realmente un hueco?» se guardan sin vincularse a su cuenta y sirven para mejorar el funcionamiento de la puntuación.",
            "Si ha cerrado sesión, el acceso a sus propios análisis depende del identificador aleatorio del navegador. Eso los mantiene lejos de desconocidos, pero no es protección criptográfica: si borra el almacenamiento del navegador, pierde el acceso.",
          ],
        },
      ],
    },

    why: {
      heading: "6. En qué nos amparamos",
      body: [
        {
          p: "Para prestar el servicio que ha pedido, gestionar cuentas y facturación, evitar el abuso de un servicio que nos cuesta dinero por petición, y mejorar la exactitud de nuestra puntuación.",
        },
        {
          p: "Cuando nos basamos en su consentimiento, puede retirarlo cerrando su cuenta.",
        },
      ],
    },

    deletion: {
      heading: "7. Borrar su cuenta — y qué conservamos",
      body: [
        {
          p: "Puede borrar su cuenta usted misma o usted mismo desde los ajustes, o pedírnoslo en {email}. El borrado elimina su nombre, su foto de perfil, su contraseña, sus preferencias guardadas y el vínculo entre usted y las búsquedas que hizo.",
        },
        {
          p: "Dos cosas se conservan a propósito, y preferimos decírselo antes que dejar que lo suponga:",
        },
        {
          ul: [
            "Su dirección de correo, para que si vuelve podamos reconocer la cuenta y devolverle el saldo de créditos que hubiera pagado.",
            "Sus registros de pago —importes, fechas y moneda—, que las normas fiscales y contables nos obligan a conservar.",
          ],
        },
        {
          p: "Si también quiere que eliminemos su dirección de correo, escriba a {email} y dígalo, y la eliminaremos. Después no tendremos forma de reconocerle, así que no podrá recuperarse un saldo anterior.",
        },
        {
          p: "Las preguntas que buscó permanecen en el corpus compartido del apartado 5, porque tras el borrado ya no se guardan asociadas a usted.",
        },
      ],
    },

    rights: {
      heading: "8. Sus opciones",
      body: [
        {
          p: "Escriba a {email} para obtener una copia de los datos que tenemos sobre usted, corregirlos u oponerse a su uso. Respondemos en 30 días.",
        },
        {
          p: "Según dónde viva, puede además tener derecho a reclamar ante una autoridad de protección de datos. Preferiríamos que acudiera antes a nosotros, pero la vía es suya.",
        },
      ],
    },

    children: {
      heading: "9. Menores",
      body: [
        {
          p: "AnswerGap no está dirigido a menores de 16 años y no recogemos sus datos a sabiendas. Si cree que un menor ha creado una cuenta, escriba a {email} y la eliminaremos.",
        },
      ],
    },

    transfers: {
      heading: "10. Dónde se guardan los datos",
      body: [
        {
          p: "Operamos desde Estados Unidos y nuestros proveedores funcionan en Estados Unidos y la Unión Europea. Usar el servicio implica que sus datos pueden tratarse en cualquiera de los dos.",
        },
      ],
    },

    changes: {
      heading: "11. Cambios en esta política",
      body: [
        {
          p: "Publicaremos los cambios en esta página y actualizaremos la fecha del principio. Si un cambio le afecta de forma sustancial, avisaremos por correo a quienes tengan cuenta en lugar de confiar en que se dé cuenta.",
        },
        { p: "Preguntas sobre todo esto:" },
        {
          link: { text: "{email}", href: "mailto:{email}" },
        },
      ],
    },
  },
};
