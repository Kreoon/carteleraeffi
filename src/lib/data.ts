// Countries and their carriers
export const carriersByCountry: Record<string, string[]> = {
  Colombia: [
    "Servientrega",
    "Coordinadora",
    "Envia",
    "Inter Rapidísimo",
    "TCC",
    "Domina"
  ],
  Ecuador: [
    "Servientrega Ecuador",
    "Gintracom Ecuador"
  ],
  "República Dominicana": [
    "Gintracom República Dominicana"
  ],
  Guatemala: [
    "Cargo Expreso"
  ]
};

export const countries = Object.keys(carriersByCountry);

// Currency by country
export const currencyByCountry: Record<string, string> = {
  Colombia: "COP",
  Ecuador: "USD",
  "República Dominicana": "DOP",
  Guatemala: "GTQ"
};

// Field definitions
export interface FieldDefinition {
  id: string;
  label: string;
  type: 'percentage' | 'currency' | 'boolean' | 'text' | 'textarea';
  description?: string;
}

export const fields: FieldDefinition[] = [
  { id: "cumplimiento_ans", label: "Cumplimiento ANS", type: "percentage" },
  { id: "devoluciones", label: "% Devoluciones", type: "percentage" },
  { id: "siniestros", label: "% Siniestros", type: "percentage" },
  { id: "regiones_superior", label: "Regiones con desempeño superior al promedio", type: "textarea" },
  { id: "regiones_inferior", label: "Regiones con desempeño menor al promedio", type: "textarea" },
  { 
    id: "costo_envio_nacional", 
    label: "Costo de un envío nacional", 
    type: "currency",
    description: "Tarifa con bonificación del 20% en fletes, valor declarado mínimo y recaudo de $120.000"
  },
  { id: "beneficios", label: "Beneficios", type: "textarea" },
  { 
    id: "seguro_gratis", 
    label: "Seguro gratis", 
    type: "text",
    description: "En todos los casos se paga el valor declarado"
  },
  { 
    id: "costo_promedio_con_recaudo", 
    label: "Costo promedio flete con recaudo $120.000", 
    type: "currency",
    description: "Bonificación del 20%"
  },
  { id: "comision_recaudo", label: "% Comisión de recaudo", type: "percentage" },
  { id: "costo_manejo", label: "% Costo de manejo (seguro mercancía)", type: "percentage" },
  { id: "politica_peso", label: "Política de peso (peso mínimo a cobrar)", type: "text" },
  { 
    id: "costo_promedio_sin_recaudo", 
    label: "Costo promedio flete SIN recaudo", 
    type: "currency",
    description: "Bonificación del 20%"
  },
  { id: "redireccion_gratis", label: "¿Permite redireccionar paquetes gratis?", type: "boolean" },
  { id: "reclame_oficina", label: "Reclame oficina", type: "boolean" },
  { id: "intentos_entrega", label: "Intentos de entrega", type: "text" },
  { id: "politica_novedades", label: "Política para la gestión de novedades", type: "textarea" },
  { id: "politica_devoluciones", label: "Política para el cobro de devoluciones", type: "textarea" },
  { id: "politica_pqrs", label: "Política para PQRS", type: "textarea" },
  { id: "sms_gratuitos", label: "Ofrece SMS gratuitos", type: "boolean" },
  { id: "particularidades_recaudo", label: "Particularidades del recaudo", type: "textarea" },
  { id: "cubrimiento", label: "Cubrimiento", type: "textarea" }
];

// Type for benchmark data
export type BenchmarkData = Record<string, Record<string, string | number | boolean>>;

// Month names in Spanish
export const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Generate years for selector
export const years = Array.from({ length: 10 }, (_, i) => 2024 + i);
