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
    "Gintracom Ecuador",
    "Laarcourier"
  ],
  "República Dominicana": [
    "Gintracom República Dominicana"
  ],
  Guatemala: [
    "Cargo Expreso"
  ],
  "Costa Rica": [
    "Red Logistic"
  ]
};

export const countries = Object.keys(carriersByCountry);

// Currency by country
export const currencyByCountry: Record<string, string> = {
  Colombia: "COP",
  Ecuador: "USD",
  "República Dominicana": "DOP",
  Guatemala: "GTQ",
  "Costa Rica": "CRC"
};

// SubFields for freight cost by country
const freightSubFieldsByCountry: Record<string, string[]> = {
  Colombia: ["Urbano", "Regional", "Zonal", "Territorial", "Otros", "Especial", "Difícil Acceso", "Veredas"],
  Ecuador: ["Local", "Local Especial", "Cantonal", "Provincial", "Provincial Especial", "Especial", "Principal", "Secundaria", "Oriente"],
  "República Dominicana": ["Local", "Local Especial", "Cantonal", "Provincial", "Provincial Especial", "Nacional Especial"],
  Guatemala: ["Urbano", "Regional", "Zonal", "Territorial", "Otros", "Especial", "Difícil Acceso", "Veredas"],
  "Costa Rica": ["Urbano", "Regional", "Zonal", "Territorial", "Otros", "Especial", "Difícil Acceso", "Veredas"]
};

// Get subfields for freight cost based on country
export function getFreightSubFields(country: string): string[] {
  return freightSubFieldsByCountry[country] || freightSubFieldsByCountry.Colombia;
}

// Field definitions
export interface FieldDefinition {
  id: string;
  label: string;
  type: 'percentage' | 'currency' | 'boolean' | 'text' | 'textarea' | 'multi-currency';
  description?: string;
  hideNote?: boolean;
  subFields?: string[];
  dynamicSubFields?: boolean; // Indicates subfields depend on country
}

export const fields: FieldDefinition[] = [
  { id: "cumplimiento_ans", label: "Cumplimiento ANS", type: "percentage", description: "Este indicador nos muestra el % de pedidos que fueron entregados a tiempo de acuerdo con la promesa de días de entrega de la transportadora" },
  { id: "devoluciones", label: "% Devoluciones", type: "percentage" },
  { id: "siniestros", label: "% Siniestros", type: "percentage", hideNote: true, description: "% de paquetes que pasaron a indemnización" },
  { id: "regiones_superior", label: "Regiones con desempeño superior al promedio", type: "textarea", description: "Regiones donde la transportadora presentó un desempeño superior al promedio en cuanto a calidad, servicio y tiempos de entrega" },
  { id: "regiones_inferior", label: "Regiones con desempeño menor al promedio", type: "textarea", description: "Regiones donde la transportadora presentó un desempeño inferior al promedio en cuanto a calidad, servicio y tiempos de entrega" },
  { 
    id: "costo_envio_nacional", 
    label: "Costo de un envío nacional", 
    type: "multi-currency",
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
    label: "Costo promedio flete con recaudo", 
    type: "currency",
    description: "Costo promedio con bonificación del 20% y recaudo de $120.000"
  },
  { 
    id: "costo_promedio_con_recaudo_detalle", 
    label: "Detalle costo flete con recaudo", 
    type: "multi-currency",
    description: "Desglose por tipo de trayecto",
    dynamicSubFields: true
  },
  { id: "comision_recaudo", label: "% Comisión de recaudo", type: "textarea", hideNote: true },
  { id: "costo_manejo", label: "% Costo de manejo (seguro mercancía)", type: "textarea", hideNote: true },
  { id: "politica_peso", label: "Política de peso (peso mínimo a cobrar)", type: "text" },
  { 
    id: "costo_promedio_sin_recaudo", 
    label: "Costo promedio flete SIN recaudo", 
    type: "currency",
    description: "Costo promedio sin recaudo con bonificación del 20%"
  },
  { 
    id: "costo_promedio_sin_recaudo_detalle", 
    label: "Detalle costo flete SIN recaudo", 
    type: "multi-currency",
    description: "Desglose por tipo de trayecto",
    dynamicSubFields: true
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
