import type { TermsContent } from "./index";

/**
 * Términos de Servicio - traducción de la versión inglesa.
 *
 * La versión vinculante es la inglesa (véase el apartado 1). Este archivo debe
 * corresponderse con `en.ts` cláusula por cláusula y viñeta por viñeta; el tipo
 * convierte lo contrario en un error de compilación.
 */
export const es: TermsContent = {
  title: "Términos de Servicio",
  description:
    "El acuerdo entre usted y AnswerGap sobre cuentas, créditos, reembolsos y la exactitud de las puntuaciones de hueco.",
  lead: "Estos términos rigen su uso de AnswerGap. Lea el apartado 6, que explica qué son y qué no son nuestras puntuaciones de hueco.",
  effective: "2026-09-20",

  sections: {
    parties: {
      heading: "1. Con quién contrata",
      body: [
        {
          p: "AnswerGap está operado por {company}, una {entity} de {state}, Estados Unidos. En estos términos, «nosotros» y «nos» significan {company}; «usted» es la persona u organización que usa el servicio.",
        },
        {
          p: "Al crear una cuenta o usar el servicio acepta estos términos. Si no los acepta, no use el servicio.",
        },
        {
          p: "Estos términos se publican en varios idiomas. La versión vinculante es la inglesa: si una traducción la contradice, prevalece el texto en inglés.",
        },
      ],
    },

    service: {
      heading: "2. Qué hace el servicio",
      body: [
        {
          p: "AnswerGap despliega las preguntas que Google muestra en «Otras preguntas de los usuarios» en un árbol de preguntas, revisa los resultados de búsqueda que hay detrás de cada una y estima cuáles de ellas no aborda bien ninguna página.",
        },
        {
          p: "El servicio está en desarrollo activo. Las funciones pueden cambiar, y algunas se ofrecen en vista previa antes de estar terminadas.",
        },
      ],
    },

    accounts: {
      heading: "3. Cuentas",
      body: [
        {
          p: "Necesita una cuenta para guardar su trabajo y gastar créditos. Una cuenta por persona.",
        },
        {
          ul: [
            "Facilite una dirección de correo que controle. Debe confirmarla antes de poder gastar créditos.",
            "Guarde sus datos de acceso. Usted es responsable de lo que ocurra en su cuenta.",
            "Avísenos sin demora si cree que otra persona ha usado su cuenta.",
          ],
        },
        {
          p: "Podemos suspender una cuenta que incumpla estos términos y podemos denegar el servicio.",
        },
      ],
    },

    credits: {
      heading: "4. Créditos, packs y suscripciones",
      body: [
        {
          p: "El trabajo en AnswerGap se paga con créditos. Se consume un crédito cuando hacemos, por cuenta suya, una petición de pago a un proveedor de datos de búsqueda.",
        },
        {
          ul: [
            "Una búsqueda cuesta un crédito. Los resultados que ya hemos recuperado y almacenado son gratuitos: volver a abrirlos no cuesta nada.",
            "Comprobar una pregunta concreta se cobra aparte del descubrimiento de preguntas, porque cada comprobación nos cuesta una petición de búsqueda distinta.",
            "Los créditos pueden venderse en packs puntuales o incluirse en una suscripción periódica. El precio, el número de créditos y el plazo de la suscripción, si lo hay, se muestran antes de pagar.",
            "Los créditos de pack no caducan mientras su cuenta esté activa.",
            "Una petición que falla por nuestra parte no se cobra.",
          ],
        },
        {
          p: "Mientras el servicio está en vista previa no se vende nada: los créditos se conceden a mano y no se pueden comprar. Este apartado describe lo que se aplicará cuando se abra la venta.",
        },
      ],
    },

    refunds: {
      heading: "5. Reembolsos y cancelación",
      body: [
        {
          p: "Durante la vista previa no se vende nada, así que todavía no hay nada que reembolsar. Cuando se abra la venta se aplicará lo siguiente.",
        },
        {
          ul: [
            "Los créditos de pack no usados pueden reembolsarse dentro de los 14 días siguientes a la compra. Los créditos ya gastados no se reembolsan, porque el coste de esas búsquedas se incurrió con nuestro proveedor de datos y no puede recuperarse.",
            "Una suscripción puede cancelarse en cualquier momento. Continúa hasta el final del periodo ya pagado; no reembolsamos periodos parciales.",
            "Si el servicio no entrega aquello por lo que pagó —una búsqueda que falló por nuestra parte o un cargo duplicado—, díganoslo y lo corregiremos.",
          ],
        },
        {
          p: "Para pedir un reembolso, escriba a {email} indicando el correo de la cuenta y la fecha del pago. Respondemos en cinco días hábiles.",
        },
      ],
    },

    accuracy: {
      heading: "6. Exactitud — lea este apartado",
      body: [
        {
          p: "Las puntuaciones de hueco son estimaciones. No son hechos y no son asesoramiento.",
        },
        {
          p: "Una puntuación de hueco se obtiene comparando una pregunta con los títulos y las direcciones de resultados de búsqueda públicos mediante un método automático. Ese método está en desarrollo activo y cabe esperar que se equivoque en una proporción considerable de casos. Preferimos decirlo aquí antes que dar a entender una precisión que hoy no podemos demostrar.",
        },
        {
          ul: [
            "Las cifras de volumen de búsqueda, donde se muestran, son estimaciones de terceros y se etiquetan como tales.",
            "Los resultados reflejan lo que devolvió el buscador en el momento en que los recuperamos. Cada resultado lleva su fecha de recuperación y nunca presentamos los datos como si fueran en vivo.",
            "Una pregunta que no hemos comprobado se muestra como desconocida, no como hueco. Desconocido no es lo mismo que sin responder.",
            "Nada en el servicio garantiza posición alguna en buscadores, ni tráfico, ni resultado comercial.",
          ],
        },
        {
          p: "Las decisiones que tome a partir de estas puntuaciones son suyas. Trate el resultado como punto de partida para su criterio, no como sustituto de él.",
        },
      ],
    },

    sources: {
      heading: "7. De dónde vienen los datos",
      body: [
        {
          p: "Los resultados se derivan de resultados de búsqueda de acceso público obtenidos mediante proveedores externos. No controlamos los buscadores de los que proceden y no podemos garantizar que los datos estén disponibles, completos o correctos.",
        },
        {
          p: "Si un proveedor cambia lo que devuelve, o deja de devolverlo, partes del servicio pueden cambiar o dejar de funcionar.",
        },
      ],
    },

    use: {
      heading: "8. Uso aceptable",
      body: [
        { p: "No haga lo siguiente:" },
        {
          ul: [
            "revender o redistribuir los datos brutos de resultados como si fueran su propio conjunto de datos;",
            "acceder al servicio por medios automatizados más allá de los créditos que tenga;",
            "eludir los límites de crédito, la franquicia diaria gratuita o cualquier otra restricción;",
            "sondear, escanear o perturbar el servicio, ni intentar alcanzar datos que no sean suyos;",
            "usar el servicio para infringir la ley o los derechos de terceros.",
          ],
        },
        {
          p: "Los informes y análisis que elabore para usted o su clientela son suyos. La restricción recae sobre la redistribución de los datos subyacentes como producto.",
        },
      ],
    },

    content: {
      heading: "9. Su contenido",
      body: [
        {
          p: "Las palabras clave y preguntas que introduce siguen siendo suyas. Nos concede el permiso necesario para ejecutar búsquedas con ellas, almacenar los resultados y operar el corpus compartido de preguntas descrito en nuestra Política de Privacidad.",
        },
        {
          p: "Tenga en cuenta que las preguntas y sus puntuaciones se guardan en un corpus compartido por toda la clientela, no en una copia privada por cuenta. Nuestra Política de Privacidad explica exactamente qué expone esto y qué no.",
        },
        {
          link: { text: "Leer la Política de Privacidad", href: "/privacy" },
        },
      ],
    },

    availability: {
      heading: "10. Disponibilidad",
      body: [
        {
          p: "El servicio se ofrece tal cual, en vista previa, sin compromiso de disponibilidad. Podemos cambiar, suspender o descontinuar cualquier parte de él.",
        },
        {
          p: "Avisaremos con antelación razonable antes de retirar algo que usted haya pagado, y reembolsaremos los créditos que por ello no pueda usar.",
        },
      ],
    },

    liability: {
      heading: "11. Exención y limitación de responsabilidad",
      body: [
        {
          p: "En la máxima medida que permita la ley, el servicio se presta «tal cual» y «según disponibilidad», sin garantías de ningún tipo, expresas o implícitas, incluidas las de idoneidad para un fin determinado y no infracción.",
        },
        {
          p: "En la máxima medida que permita la ley, nuestra responsabilidad total derivada del servicio o relacionada con él se limita al importe que nos haya pagado en los doce meses anteriores al hecho que origine la reclamación. No respondemos por lucro cesante, pérdida de ingresos, pérdida de datos ni daños indirectos o consecuenciales.",
        },
        {
          p: "Nada en estos términos excluye ni limita la responsabilidad que no pueda excluirse o limitarse legalmente, incluida la responsabilidad por dolo.",
        },
      ],
    },

    termination: {
      heading: "12. Fin del acuerdo",
      body: [
        {
          p: "Puede cerrar su cuenta cuando quiera desde los ajustes de la cuenta o escribiendo a {email}. Nuestra Política de Privacidad explica qué se elimina y qué se conserva.",
        },
        {
          p: "Podemos suspender o terminar su acceso si incumple estos términos. Cuando el acceso termina por incumplimiento, los créditos no usados no se reembolsan.",
        },
      ],
    },

    changes: {
      heading: "13. Cambios en estos términos",
      body: [
        {
          p: "Podemos actualizar estos términos. La fecha al principio de esta página indica cuándo cambiaron por última vez, y avisaremos por correo a quienes tengan cuenta de los cambios que les afecten de forma sustancial.",
        },
        {
          p: "Seguir usando el servicio después de un cambio significa que acepta los términos actualizados.",
        },
      ],
    },

    law: {
      heading: "14. Ley aplicable",
      body: [
        {
          p: "Estos términos se rigen por las leyes del Estado de {state}, Estados Unidos, sin atender a sus normas de conflicto de leyes. Los tribunales de {state} tienen jurisdicción exclusiva sobre cualquier disputa, salvo que cualquiera de las partes podrá solicitar medidas cautelares ante cualquier tribunal competente.",
        },
      ],
    },

    contact: {
      heading: "15. Contacto",
      body: [
        { p: "Preguntas sobre estos términos:" },
        {
          link: { text: "{email}", href: "mailto:{email}" },
        },
        { p: "{company}, {state}, Estados Unidos." },
      ],
    },
  },
};
