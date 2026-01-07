import { BenchmarkData, CellValue } from './data';

// Helper to create a cell value
function cell(value: string | number | boolean, note = '', color: CellValue['color'] = 'none'): CellValue {
  return { value, note, color };
}

// Sample data for Colombia - October 2025
export const sampleDataColombiaOct2025: BenchmarkData = {
  "Servientrega": {
    cumplimiento_ans: cell(98.42, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos movilizados por transportadora.", "green"),
    devoluciones: cell(11.99, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos movilizados por transportadora.", "green"),
    siniestros: cell(0.01, "", "green"),
    regiones_superior: cell("Meta, Tolima, Nariño, Guaviare"),
    regiones_inferior: cell("Arauca, Chocó, Magdalena, Cesar"),
    costo_envio_nacional: cell(18800, "Con recaudo: 18,800\nSin recaudo: 14,800", "green"),
    beneficios: cell("", "Si el cliente no puede recibir el envío, Servientrega lo guardará 7 días en el punto más cercano.\n- No cobro de devoluciones"),
    seguro_gratis: cell("No, tiene un costo del 1% - rojo", "", "red"),
    costo_promedio_con_recaudo: cell(12500, "Urbano: 12,500\nZonal: 17000\nSemiurbano: 19,800\nRegional: 27,800\nEspecial: 45,800", "green"),
    comision_recaudo: cell(3.5, "Es el 3.5% sobre el valor a recaudar, con un valor mínimo de $4,000.", "yellow"),
    costo_manejo: cell(1, "Es el 1% sobre el Valor Declarado, con un valor mínimo de $900.\nCuando la guía es con recaudo el valor a recaudar reemplaza el valor declarado."),
    politica_peso: cell("Mínimo de 1KG"),
    costo_promedio_sin_recaudo: cell(8000, "Urbano: 8,000\nZonal: 12,500\nSemiurbano: 16,500\nEspecial: 40,500"),
    redireccion_gratis: cell(true, "Solo si es en la misma ciudad (sin costo adicional). Permite cambiar el nombre del destinatario."),
    reclame_oficina: cell(true, "184 oficinas habilitadas. Las puedes consultar en la matriz de cubrimiento"),
    intentos_entrega: cell("2"),
    politica_novedades: cell("Una vez se genera la primer novedad la transportadora realiza reintento(s) al destinatario y/o remitente, sino se obtiene solución se genera constancia de reporto y el producto llega o se mueve a cedi.\nLa solicitud debe ser por el portal. En todo caso, prima la información gestionada de manera interna/backOffice por las transportadoras sobre la gestión del panel"),
    politica_devoluciones: cell("En los envíos por SERVIENTREGA que sean devolución definitiva, se cobrará el trayecto de ida al 100% del flete de ida al 100% y la comisión de envío. El valor del Seguro se cobra de ida y de vuelta a 0.35%.\nNo se cobrará el Flete ni el trayecto de la devolución."),
    politica_pqrs: cell("Todas las PQRS deben ser radicadas a través de tu asesor de logística y novedades. Ingresar en política de aquí: https://drive.google.com/file/d/1VPz5QA6eXLw0D3TrLwP85ptcK66TBM/view"),
    sms_gratuitos: cell(true, "Ya no se envían por mensaje de texto, sino por WhatsApp con información actualizada sobre la entrega del pedido"),
    particularidades_recaudo: cell("", "Recaudo efectivo en efectivo de recaudos hasta $2,400,000"),
    cubrimiento: cell("Cubrimiento en 922 municipios de los cuales 307 están habilitados para pago contra entrega")
  },
  "Coordinadora": {
    cumplimiento_ans: cell(94.96, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos movilizados por transportadora.", "yellow"),
    devoluciones: cell(0.06, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos movilizados por transportadora.", "green"),
    siniestros: cell(0.01, "", "green"),
    regiones_superior: cell("Eje cafetero, Cartagena, Popayán"),
    regiones_inferior: cell("Cesar, Huila, Valle"),
    costo_envio_nacional: cell(14900, "Con Recaudo: 14,900\nSin Recaudo: 13,400", "yellow"),
    beneficios: cell("", "Cuenta con la plataforma Wompi que permite realizar pagos electrónicos (Visa/Masterica, PSE, tarjeta crédito/débito)\nOfrece un nuevo servicio de Reexposición para que el destinatario pague el recaudo a través de un código."),
    seguro_gratis: cell("No, tiene un costo del 1% para poblaciones urbanas, regionales, nacionales, zonales y otras; para trayectos especiales es del 2% - rojo", "", "red"),
    costo_promedio_con_recaudo: cell(13900, "Urbano: 13,900\nSemiurbano: 19,800\nRegional: 25,800\nZonal: 30,400\nEspecial: 66,400", "yellow"),
    comision_recaudo: cell(3.5, "La comisión corresponde al 3.5% sobre el valor a recaudar, en cualquiera de las plataformas de cobro, con un valor mínimo de $4,000."),
    costo_manejo: cell(1, "Tiene un costo del 1% para poblaciones urbanas, regionales, nacionales, zonales y otras; para trayectos especiales es del 2%.\nvalor mínimo asegurado para transporte es L a 4Kg es de hasta $500,000"),
    politica_peso: cell("Mínimo de 1KG"),
    costo_promedio_sin_recaudo: cell(8100, "Urbano: 6,000\nRegional: 8,100\nZonal: 20,100\nOtras: 23,600\nEspecial: 41,500"),
    redireccion_gratis: cell(true, "Siempre y cuando sea para una ciudad cubierta por la misma terminal. Consulta con tu asesor logístico antes de solicitar el redirecionamiento"),
    reclame_oficina: cell(true, "222 Of. Habilitadas. Las puedes consultar en la matriz de cubrimiento."),
    intentos_entrega: cell("3"),
    politica_novedades: cell("15 días calendarios contados a partir de la fecha del despacho"),
    politica_devoluciones: cell("En los envíos por COORDINADORA MERCANTIL que sean devolución definitiva, se cobrará el trayecto de ida: al 100% del flete de ida al 100% y la comisión de envío.\nEn los servicios con DEVOLUCIÓN GRATIS, solo pagará adicional, solo se cobrará el trayecto de ida: al 50% del flete de ida al 100% de la comisión de manejo y 0% de la comisión de recaudo"),
    politica_pqrs: cell("Todas las PQRS deben ser radicadas a través de tu asesor de logística y novedades. Para conocer la política de aquí: https://www.coordinadora.com/rastrear/novedades-proceso-de-recepcion-y-entrega-de-paquetes/"),
    sms_gratuitos: cell(true, "Habilitados. Solo envían un mensaje de texto y el segundo por WhatsApp con información actualizada sobre la entrega del pedido"),
    particularidades_recaudo: cell("", "Recaudo efectivo y pasarela de pagos Wompi (transferencia, tarjeta débito/crédito, PSE). Para el recaudo el tope es de $2,000,000. La pasarela alineada con esta transportadora infiere el pago de una comisión del 2.9%+$900\nseguro de pago a través del recaudo al destinatario por medio de un enlace llamado Aprepago. Esta comisión es externa a la transportadora y al cliente, la tienen o tener en cuenta el pago del mismo con una tarjeta de crédito externa"),
    cubrimiento: cell("Cubrimiento en 1100 municipios de los cuales 368 están habilitados para pago contraentrega")
  },
  "Envia": {
    cumplimiento_ans: cell(94.09, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos movilizados por transportadora.", "yellow"),
    devoluciones: cell(14.09, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos movilizados por transportadora.", "yellow"),
    siniestros: cell(0.11, "", "yellow"),
    regiones_superior: cell("Eje Cafetero, Ibagué, Valledupar"),
    regiones_inferior: cell("Cali, Bogotá, Cartagena"),
    costo_envio_nacional: cell(20000, "Es la transportadora con los precios más competitivos del mercado.\nCon recaudo: 20,000\nSin recaudo: 13,000", "yellow"),
    beneficios: cell("", "Medio electrónico para el recaudo.\nCall y app Carriers con mayor Modelos con tipología Regional"),
    seguro_gratis: cell("Solo para paquetes asegurados hasta $8,000 - amarillo", "", "yellow"),
    costo_promedio_con_recaudo: cell(13200, "Urbano: 11,200\nRegional: 13,600\nEspecial Lejano: 55,200\nVereda: 94,160", "yellow"),
    comision_recaudo: cell(0, "RANGO - TARIFA\n$25,000 - $50,000 = $2,500\n$50,001 - $3,000,000 = 0%", "green"),
    costo_manejo: cell(0, "Es el 2% del valor declarado para pedidos asegurados entre $0 a $10,000 y el 1% para pedidos asegurados por un valor mayor o igual a $10,001. Con esta transportadora podría ahorrarse un 20% de valor asegurado diferente al 1% del recaudo.\nEnvíos de 0.3kg hasta 2 Kg: Valor mínimo a declarar de $4,000"),
    politica_peso: cell("Mínimo de 1Kg"),
    costo_promedio_sin_recaudo: cell(8400, "Urbanos: 6,500\nRegional: 8,100\nEspecial Lejano: 51,200\nVereda: 87,400"),
    redireccion_gratis: cell(false, "", "red"),
    reclame_oficina: cell(true, "371 Of. Habilitadas. Las puedes consultar en la matriz de cubrimiento"),
    intentos_entrega: cell("3", "En caso de la novedad reflejada (pedido incompleto), no genera contrarepago que genere devolución automática"),
    politica_novedades: cell("Una vez se genera la primer novedad la transportadora realiza reintento(s) al destinatario y/o remitente, sino se obtiene solución en el primer contacto telefónico la novedad posteriormente la responsabilidad será del área de novedades de OTI para ser resuelta."),
    politica_devoluciones: cell("En devoluciones de la tienda online. Tendrá un descuento del 30%, importante que el flete 60 de 60 días.\nIngresar descuento del 60%. No cobra comisión completa de la comisión del 6% de el recaudo y el 1% del valor declarado."),
    politica_pqrs: cell("Todos los PQRS deben ser radicados a través de tu asesor de logística y novedades. Para conocer la política de aquí: www.enviasoluciones.com/pqr/"),
    sms_gratuitos: cell(false, "No, ellos utilizan algunos de los paquetes de SMS a usar efectivo para pagar de este servicio", "red"),
    particularidades_recaudo: cell("", "Recaudo en efectivo de máximo 34,562,618"),
    cubrimiento: cell("Cubrimiento total en 1,154 municipios de los cuales 1,011 están habilitados para pago contraentrega")
  },
  "Inter Rapidísimo": {
    cumplimiento_ans: cell(94.72, "Este es el resultado de calcular el total de pedidos movilizados por transportadora.", "green"),
    devoluciones: cell(14.72, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos movilizados por transportadora.", "yellow"),
    siniestros: cell(0.18, "", "yellow"),
    regiones_superior: cell("Bucaramanga, Sincelejo, Eje cafetero"),
    regiones_inferior: cell("Bogotá, Cúcuta, Pasto"),
    costo_envio_nacional: cell(17900, "Con Recaudo: 17,900\nSin Recaudo: 13,700", "yellow"),
    beneficios: cell("", "- Especialista en última milla para informar la trazabilidad de los envíos, así mismo esta transportadora realiza labores de telemercadeo y contacto vía mail por los destinatarios para la gestión de novedades.\n- Realiza la devolución del recaudo para los pedidos que sean devolución"),
    seguro_gratis: cell("No, tiene un costo del 1% - rojo", "", "red"),
    costo_promedio_con_recaudo: cell(16700, "Urbano: 18,700\nRegional: 17,100\nZonal: 21,800\nEspecial: 44,280"),
    comision_recaudo: cell(3.3, "3.3% sobre el valor a recaudar con un valor mínimo de $5,200", "yellow"),
    costo_manejo: cell(1, "3.5% sobre el valor a declarar con un valor mínimo de $900", "yellow"),
    politica_peso: cell("Mínimo de 1Kg"),
    costo_promedio_sin_recaudo: cell(12500, "Urbano: 12,500\nRegional: 12,900\nZonal: 9,300\nEspecial: 30,000"),
    redireccion_gratis: cell(true, "Solo redirecciona si es para el mismo cliente y a la misma ciudad (sin costo adicional)"),
    reclame_oficina: cell(true, "17 Of. Habilitadas, solo permite pago de recaudo en oficinas principales"),
    intentos_entrega: cell("3"),
    politica_novedades: cell("La transportadora puede contactar al destinatario el número de veces que considere ofrecerle una solución y el paquete seguir a devolución si así se decide. En este caso, prima la información gestionada de manera interna/backOffice la transportadora sobre la gestión de novedades"),
    politica_devoluciones: cell("No cobra devoluciones, el flete de ida en las ida de cobra completo sin embargo el 1% de el recaudo y el 1% del seguro de mercancía."),
    politica_pqrs: cell("Todas las PQRS deben ser radicadas a través de tu asesor de logística y novedades. Para conocer la política de aquí: https://fie.com.co/servicios/terminos-y-condiciones/"),
    sms_gratuitos: cell(true, "Sí"),
    particularidades_recaudo: cell("", "Recaudo en efectivo. Para el comercio el tope es de $6,000,000 y no permite recaudos electrónicos deben contactar con tu asesor de logística y novedades"),
    cubrimiento: cell("Cubrimiento en 643 municipios")
  },
  "TCC": {
    cumplimiento_ans: cell(96.94, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos movilizados por transportadora.", "green"),
    devoluciones: cell(14.59, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos.", "yellow"),
    siniestros: cell(0.06, "", "green"),
    regiones_superior: cell("Bogotá, Antioquia, Valle del Cauca"),
    regiones_inferior: cell("Norte de Santander, Valledupar, Sucre"),
    costo_envio_nacional: cell(25700, "Es la transportadora con los precios más competitivos del mercado PYMES CON RECAUDO.\n\nCon Recaudo: 25,700\nSin Recaudo: 13,780", "red"),
    beneficios: cell("", "- Ayudan a generar información al destinatario de los envíos al momento de tocar las bolsas por el contacto de fiux"),
    seguro_gratis: cell("1, para paquetes asegurados hasta $120,000 - verde", "", "green"),
    costo_promedio_con_recaudo: cell(18700, "Urbano: 18,700\nRegional: 13,402\nZonal: 29,500\nEspecial: 34,200", "red"),
    comision_recaudo: cell(0, "RANGO VALOR A RECAUDAR\nDESDE - HASTA - NOTA\n$188.81 - 2% - $10,000 0% - 0%", "green"),
    costo_manejo: cell(1, "Es el 1% del valor a asegurar para envíos superiores a $120,001. si el valor a asegurar está en el rango de entre $0 a $100,000 no se cobra. Cuando la guía es con recaudo y transporte podría exonerarlo un valor a asegurar diferente al del recaudo.", "yellow"),
    politica_peso: cell("Mínimo de 3Kg"),
    costo_promedio_sin_recaudo: cell(5300, "Urbano: 5,500\nRegional: 5,100\nZonal: 21,300\nEspecial: 30,000"),
    redireccion_gratis: cell(true, "Solo redirecciona si es para el mismo cliente y a la misma ciudad (sin costo adicional, utilizando whatsapp)"),
    reclame_oficina: cell(true, "21 Of. Habilitadas. Las puedes consultar en la matriz de cubrimiento"),
    intentos_entrega: cell("3"),
    politica_novedades: cell("5 días hábiles desde la fecha de reporte de la novedad"),
    politica_devoluciones: cell("No cobra devoluciones, el flete de ida en las ida de cobra completo sin embargo el 1% de el recaudo y el 1% del seguro de la guía de el paquete se devolución."),
    politica_pqrs: cell("Todas las PQRS deben ser radicadas a través de tu asesor de logística y novedades. Para conocer la política de aquí: https://www.tcc.com.co/tratamiento-y-condiciones/"),
    sms_gratuitos: cell(true, "Sí"),
    particularidades_recaudo: cell("", "Recaudo en efectivo. Para el comercio el tope es de $6,000,000 y no permite recaudos electrónicos deben contactar con tu asesor de logística y novedades"),
    cubrimiento: cell("Cubrimiento en 643 municipios")
  },
  "Domina": {
    cumplimiento_ans: cell(97.00, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos movilizados por transportadora.", "green"),
    devoluciones: cell(0.09, "Este es el resultado de calcular el total de pedidos en devolución por el total de pedidos.", "green"),
    siniestros: cell(0.06, "", "green"),
    regiones_superior: cell("Bogotá, Antioquia, Valle del Cauca"),
    regiones_inferior: cell("Norte de Santander, Valledupar, Sucre"),
    costo_envio_nacional: cell(25700, "Es la transportadora con los precios más competitivos del mercado PYMES CON RECAUDO.\n\nCon Recaudo: 25,700\nSin Recaudo: 13,780"),
    beneficios: cell("", "- Ayudan a generar información al destinatario de los envíos al momento de tocar las bolsas por el contacto de fiux"),
    seguro_gratis: cell("1, para paquetes asegurados hasta $120,000 - verde", "", "green"),
    costo_promedio_con_recaudo: cell(18700, "Urbano: 18,700\nRegional: 13,402\nZonal: 29,500\nEspecial: 34,200"),
    comision_recaudo: cell(0, "Variable dependiendo el rango", "green"),
    costo_manejo: cell(1, "Es el 1% del valor a asegurar para envíos superiores a $120,001. si el valor a asegurar está en el rango de entre $0 a $100,000 no se cobra."),
    politica_peso: cell("Mínimo de 3Kg"),
    costo_promedio_sin_recaudo: cell(5300, "Urbano: 5,500\nRegional: 5,100\nZonal: 21,300\nEspecial: 30,000"),
    redireccion_gratis: cell(true, "Solo redirecciona si es para el mismo cliente y a la misma ciudad (sin costo adicional, utilizando whatsapp)"),
    reclame_oficina: cell(true, "21 Of. Habilitadas. Las puedes consultar en la matriz de cubrimiento"),
    intentos_entrega: cell("3"),
    politica_novedades: cell("5 días hábiles desde la fecha de reporte de la novedad"),
    politica_devoluciones: cell("No cobra devoluciones, el flete de ida en las ida de cobra completo sin embargo el 1% de el recaudo y el 1% del seguro de la guía de el paquete se devolución."),
    politica_pqrs: cell("Todas las PQRS deben ser radicadas a través de tu asesor de logística y novedades."),
    sms_gratuitos: cell(true, "Sí"),
    particularidades_recaudo: cell("", "Recaudo en efectivo. Para el comercio el tope es de $6,000,000 y no permite recaudos electrónicos"),
    cubrimiento: cell("Cubrimiento en 643 municipios")
  }
};

// Function to seed sample data to localStorage
export function seedSampleData() {
  const STORAGE_KEY = 'efficommerce_benchmark_data';
  const storageKey = 'Colombia_2025_9'; // October 2025 (month 9 = October in 0-indexed)
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allData = stored ? JSON.parse(stored) : {};
    
    // Only seed if data doesn't already exist
    if (!allData[storageKey]) {
      allData[storageKey] = sampleDataColombiaOct2025;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      console.log('Sample data seeded for Colombia October 2025');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error seeding sample data:', error);
    return false;
  }
}
