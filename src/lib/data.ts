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
  type: 'percentage' | 'currency' | 'boolean' | 'text' | 'textarea' | 'multi-currency';
  description?: string;
  hideNote?: boolean;
  subFields?: string[];
}

export const fields: FieldDefinition[] = [
  { id: "cumplimiento_ans", label: "Cumplimiento ANS", type: "percentage", hideNote: true },
  { id: "devoluciones", label: "% Devoluciones", type: "percentage" },
  { id: "siniestros", label: "% Siniestros", type: "percentage", hideNote: true },
  { id: "regiones_superior", label: "Regiones con desempeño superior al promedio", type: "textarea" },
  { id: "regiones_inferior", label: "Regiones con desempeño menor al promedio", type: "textarea" },
  { 
    id: "costo_envio_nacional", 
    label: "Costo de un envío nacional", 
    type: "multi-currency",
    description: "Tarifa con bonificación del 20% en fletes, valor declarado mínimo y recaudo de $120.000",
    subFields: ["Valor Con Recaudo", "Valor Sin Recaudo"]
  },
  { id: "beneficios", label: "Beneficios", type: "textarea", hideNote: true },
  { 
    id: "seguro_gratis", 
    label: "Seguro gratis", 
    type: "textarea",
    description: "En todos los casos se paga el valor declarado",
    hideNote: true
  },
  { 
    id: "costo_promedio_con_recaudo", 
    label: "Costo promedio flete con recaudo $120.000", 
    type: "multi-currency",
    description: "Bonificación del 20%",
    subFields: ["Urbano", "Regional", "Zonal", "Territorial", "Otros", "Especial", "Difícil Acceso", "Veredas"]
  },
  { id: "comision_recaudo", label: "% Comisión de recaudo", type: "textarea", hideNote: true },
  { id: "costo_manejo", label: "% Costo de manejo (seguro mercancía)", type: "textarea", hideNote: true },
  { id: "politica_peso", label: "Política de peso (peso mínimo a cobrar)", type: "text" },
  { 
    id: "costo_promedio_sin_recaudo", 
    label: "Costo promedio flete SIN recaudo", 
    type: "multi-currency",
    description: "Bonificación del 20%",
    subFields: ["Urbano", "Regional", "Zonal", "Territorial", "Otros", "Especial", "Difícil Acceso", "Veredas"]
  },
  { id: "redireccion_gratis", label: "¿Permite redireccionar paquetes gratis?", type: "boolean" },
  { id: "reclame_oficina", label: "Reclame oficina", type: "boolean" },
  { id: "intentos_entrega", label: "Intentos de entrega", type: "text" },
  { id: "politica_novedades", label: "Política para la gestión de novedades", type: "textarea" },
  { id: "politica_devoluciones", label: "Política para el cobro de devoluciones", type: "textarea" },
  { id: "politica_pqrs", label: "Política para PQRS", type: "textarea" },
  { id: "sms_gratuitos", label: "Ofrece SMS gratuitos", type: "boolean" },
  { id: "particularidades_recaudo", label: "Particularidades del recaudo", type: "textarea", hideNote: true },
  { id: "cubrimiento", label: "Cubrimiento", type: "textarea" }
];

// Cell value structure (supports value + note + color)
export interface CellValue {
  value: string | number | boolean;
  note?: string;
  color?: 'green' | 'yellow' | 'red' | 'none';
}

// Type for benchmark data - each cell can be a simple value or CellValue object
export type BenchmarkData = Record<string, Record<string, CellValue>>;

// Helper to normalize cell values
export function normalizeCellValue(val: any): CellValue {
  if (val && typeof val === 'object' && 'value' in val) {
    return val as CellValue;
  }
  return { value: val ?? '', note: '', color: 'none' };
}

// Month names in Spanish
export const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Generate years for selector
export const years = Array.from({ length: 10 }, (_, i) => 2024 + i);
