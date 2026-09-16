export type FormFieldType = 'text' | 'number' | 'textarea'

export type FormFieldSection = 'route' | 'physical' | 'finance' | 'custom'

export interface FormFieldConfig {
  id: string
  key: string
  label: string
  placeholder?: string
  type: FormFieldType
  section: FormFieldSection
  required: boolean
  enabled: boolean
  /** Built-in fields map to TripItem; custom fields store in customFields */
  builtin: boolean
  order: number
}

const STORAGE_KEY = 'trip-form-fields-v1'

export const SECTION_LABELS: Record<FormFieldSection, string> = {
  route: 'Route & Cargo',
  physical: 'Physical Departure',
  finance: 'Freight Accounting',
  custom: 'Custom Fields',
}

/** Display units for trip field values (print / forms) */
export const FIELD_UNITS: Record<string, string> = {
  startMeterReading: 'KM',
  endMeterReading: 'KM',
  destinationKm: 'KM',
  cargoWeight: 'MT',
  dieselQuantity: 'Litres',
  ureaQuantity: 'Litres',
  freightAmount: '₹',
  fuelExpenses: '₹',
  otherExpenses: '₹',
  hiredTruckPayout: '₹',
  expenseGiven: '₹',
  expenseReturned: '₹',
  advancesTotal: '₹',
  netProfit: '₹',
}

export function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')

  const unit = FIELD_UNITS[key]

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return ''
    if (unit === '₹') return `₹${value.toLocaleString('en-IN')}`
    const n = value.toLocaleString('en-IN')
    return unit ? `${n} ${unit}` : n
  }

  const text = String(value).trim()
  if (!text) return ''
  if (!unit || unit === '₹') return text
  // Avoid doubling unit if already present in text
  const upper = text.toUpperCase()
  if (upper.endsWith(` ${unit}`) || upper.endsWith(unit)) return text
  return `${text} ${unit}`
}

/** Label without trailing unit in parentheses, for cleaner print rows */
export function fieldLabelWithoutUnit(label: string): string {
  return label.replace(/\s*\((KM|MT|Litres?|L|₹)\)\s*$/i, '').trim()
}

export const DEFAULT_TRIP_FORM_FIELDS: FormFieldConfig[] = [
  {
    id: 'origin',
    key: 'origin',
    label: 'Origin Plant / Yard',
    placeholder: 'Wadi Cement Works (Plant)',
    type: 'text',
    section: 'route',
    required: true,
    enabled: true,
    builtin: true,
    order: 10,
  },
  {
    id: 'destination',
    key: 'destination',
    label: 'Destination Customer / Site',
    placeholder: 'e.g. Bengaluru Depot / Metro Site',
    type: 'text',
    section: 'route',
    required: true,
    enabled: true,
    builtin: true,
    order: 20,
  },
  {
    id: 'cargoDetails',
    key: 'cargoDetails',
    label: 'Cargo Description & Tonnage',
    placeholder: 'e.g. PPC Cement 600 Bags / 30 MT',
    type: 'text',
    section: 'route',
    required: true,
    enabled: true,
    builtin: true,
    order: 30,
  },
  {
    id: 'startMeterReading',
    key: 'startMeterReading',
    label: 'Start Meter Reading (KM)',
    placeholder: 'e.g. 150000',
    type: 'number',
    section: 'physical',
    required: false,
    enabled: true,
    builtin: true,
    order: 40,
  },
  {
    id: 'destinationKm',
    key: 'destinationKm',
    label: 'Est. Distance (KM)',
    placeholder: 'e.g. 450',
    type: 'number',
    section: 'physical',
    required: false,
    enabled: true,
    builtin: true,
    order: 50,
  },
  {
    id: 'cargoWeight',
    key: 'cargoWeight',
    label: 'Cargo Weight (MT)',
    placeholder: 'e.g. 30',
    type: 'number',
    section: 'physical',
    required: false,
    enabled: true,
    builtin: true,
    order: 60,
  },
  {
    id: 'dieselQuantity',
    key: 'dieselQuantity',
    label: 'Diesel Filled (Litres)',
    placeholder: 'e.g. 200',
    type: 'number',
    section: 'physical',
    required: false,
    enabled: true,
    builtin: true,
    order: 70,
  },
  {
    id: 'ureaQuantity',
    key: 'ureaQuantity',
    label: 'UREA Filled (Litres)',
    placeholder: 'e.g. 20',
    type: 'number',
    section: 'physical',
    required: false,
    enabled: true,
    builtin: true,
    order: 80,
  },
  {
    id: 'expenseGiven',
    key: 'expenseGiven',
    label: 'Departure Expense Given (₹)',
    placeholder: 'e.g. 5000',
    type: 'number',
    section: 'physical',
    required: false,
    enabled: true,
    builtin: true,
    order: 90,
  },
  {
    id: 'helpers',
    key: 'helpers',
    label: 'Helper Name(s)',
    placeholder: 'Comma separated names',
    type: 'text',
    section: 'physical',
    required: false,
    enabled: true,
    builtin: true,
    order: 100,
  },
  {
    id: 'freightAmount',
    key: 'freightAmount',
    label: 'Total Freight Amount (₹)',
    placeholder: '55000',
    type: 'number',
    section: 'finance',
    required: true,
    enabled: true,
    builtin: true,
    order: 110,
  },
  {
    id: 'fuelExpenses',
    key: 'fuelExpenses',
    label: 'Fuel Expense Allocation (₹)',
    placeholder: '15000',
    type: 'number',
    section: 'finance',
    required: false,
    enabled: true,
    builtin: true,
    order: 120,
  },
  {
    id: 'otherExpenses',
    key: 'otherExpenses',
    label: 'Toll & Miscellaneous (₹)',
    placeholder: '2000',
    type: 'number',
    section: 'finance',
    required: false,
    enabled: true,
    builtin: true,
    order: 130,
  },
  {
    id: 'hiredTruckPayout',
    key: 'hiredTruckPayout',
    label: 'Hired Operator Payout (₹)',
    placeholder: '0',
    type: 'number',
    section: 'finance',
    required: false,
    enabled: true,
    builtin: true,
    order: 140,
  },
]

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || `field_${Date.now()}`
}

export function loadTripFormFields(): FormFieldConfig[] {
  if (typeof window === 'undefined') return DEFAULT_TRIP_FORM_FIELDS.map((f) => ({ ...f }))
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_TRIP_FORM_FIELDS.map((f) => ({ ...f }))
    const parsed = JSON.parse(raw) as FormFieldConfig[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_TRIP_FORM_FIELDS.map((f) => ({ ...f }))
    }

    // Merge defaults so new builtin fields appear after upgrades
    const byId = new Map(parsed.map((f) => [f.id, f]))
    const merged = DEFAULT_TRIP_FORM_FIELDS.map((def) => {
      const existing = byId.get(def.id)
      if (!existing) return { ...def }
      return {
        ...def,
        label: existing.label ?? def.label,
        placeholder: existing.placeholder ?? def.placeholder,
        type: existing.type ?? def.type,
        section: existing.section ?? def.section,
        order: typeof existing.order === 'number' ? existing.order : def.order,
        required: Boolean(existing.required),
        enabled: existing.enabled === undefined ? true : Boolean(existing.enabled),
        builtin: true,
        key: def.key,
        id: def.id,
      }
    })
    const custom = parsed
      .filter((f) => !f.builtin && !DEFAULT_TRIP_FORM_FIELDS.some((d) => d.id === f.id))
      .map((f) => ({
        ...f,
        required: Boolean(f.required),
        enabled: f.enabled === undefined ? true : Boolean(f.enabled),
        builtin: false,
      }))
    return [...merged, ...custom].sort((a, b) => a.order - b.order)
  } catch {
    return DEFAULT_TRIP_FORM_FIELDS.map((f) => ({ ...f }))
  }
}

export function saveTripFormFields(fields: FormFieldConfig[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields))
  window.dispatchEvent(new Event('trip-form-fields-updated'))
}

export function resetTripFormFields() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('trip-form-fields-updated'))
  return DEFAULT_TRIP_FORM_FIELDS
}

export function createCustomField(partial: {
  label: string
  type: FormFieldType
  section?: FormFieldSection
  required?: boolean
  placeholder?: string
}): FormFieldConfig {
  const key = `custom_${slugify(partial.label)}_${Date.now().toString(36)}`
  return {
    id: key,
    key,
    label: partial.label.trim() || 'New field',
    placeholder: partial.placeholder || '',
    type: partial.type,
    section: partial.section || 'custom',
    required: Boolean(partial.required),
    enabled: true,
    builtin: false,
    order: Date.now(),
  }
}

export function getEnabledFields(fields: FormFieldConfig[], section?: FormFieldSection) {
  return fields
    .filter((f) => f.enabled && (!section || f.section === section))
    .sort((a, b) => a.order - b.order)
}

export function useTripFormFields() {
  // Kept as plain helpers; pages use useEffect + loadTripFormFields
  return { loadTripFormFields, saveTripFormFields, resetTripFormFields }
}
