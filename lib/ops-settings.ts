export interface OpsSettings {
  companyName: string
  companyAddress: string
  gateId: string
  terminalId: string
  autoPrint: boolean
  requireMeter: boolean
}

export const DEFAULT_OPS_SETTINGS: OpsSettings = {
  companyName: 'EASTERN INDIA CEMENT PRIVATE LIMITED',
  companyAddress:
    'PHASE IV, PLOT NO. B 5 & B 10, BALIDIH, INDUSTRIAL AREA, BOKARO JHARKHAND - 827014',
  gateId: 'Gate 2',
  terminalId: 'EIC-WB-04',
  autoPrint: true,
  requireMeter: true,
}

const STORAGE_KEY = 'ops-settings'

const PLACEHOLDER_NAMES = new Set([
  '',
  'Durgapur Grinding Plant #01',
  'Wadi Cement Works',
  'Company name',
])

export function loadOpsSettings(): OpsSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_OPS_SETTINGS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_OPS_SETTINGS }
    const parsed = JSON.parse(raw)
    const existingName = String(parsed.companyName || parsed.plantName || '').trim()
    const useDefaultName = !existingName || PLACEHOLDER_NAMES.has(existingName)
    const existingAddress = String(parsed.companyAddress || '').trim()

    return {
      companyName: useDefaultName ? DEFAULT_OPS_SETTINGS.companyName : existingName,
      companyAddress: existingAddress || DEFAULT_OPS_SETTINGS.companyAddress,
      gateId: String(parsed.gateId || DEFAULT_OPS_SETTINGS.gateId),
      terminalId: String(parsed.terminalId || DEFAULT_OPS_SETTINGS.terminalId),
      autoPrint: typeof parsed.autoPrint === 'boolean' ? parsed.autoPrint : true,
      requireMeter: typeof parsed.requireMeter === 'boolean' ? parsed.requireMeter : true,
    }
  } catch {
    return { ...DEFAULT_OPS_SETTINGS }
  }
}

export function saveOpsSettings(settings: OpsSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...settings,
      // keep legacy key so older code still reads a name
      plantName: settings.companyName,
    })
  )
}

export function resetOpsSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_OPS_SETTINGS }
  localStorage.removeItem(STORAGE_KEY)
  saveOpsSettings({ ...DEFAULT_OPS_SETTINGS })
  return { ...DEFAULT_OPS_SETTINGS }
}
