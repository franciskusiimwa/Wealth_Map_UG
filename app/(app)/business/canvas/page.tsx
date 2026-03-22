import { redirect } from 'next/navigation'
import { CanvasOutput } from '@/components/business/CanvasOutput'
import { createClient } from '@/lib/supabase/server'
import type { BusinessCanvas } from '@/types'

interface CanvasPageProps {
  searchParams: {
    canvasId?: string | string[]
  }
}

interface CanvasRecord {
  id: string
  sector: string | null
  generated_at: string | null
  canvas_json: unknown
}

function isBusinessCanvas(value: unknown): value is BusinessCanvas {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  const isStringArray = (item: unknown) => Array.isArray(item) && item.every((entry) => typeof entry === 'string')

  return (
    typeof candidate.value_proposition === 'string' &&
    typeof candidate.target_customers === 'string' &&
    isStringArray(candidate.revenue_streams) &&
    isStringArray(candidate.key_activities) &&
    isStringArray(candidate.key_resources) &&
    isStringArray(candidate.cost_structure) &&
    typeof candidate.ugandan_context === 'string' &&
    isStringArray(candidate.quick_wins) &&
    isStringArray(candidate.key_risks) &&
    isStringArray(candidate.first_30_days)
  )
}

/**
 * Generated business canvas page.
 * @returns Canvas result container.
 */
export default async function CanvasPage({ searchParams }: Readonly<CanvasPageProps>) {
  const rawCanvasId = searchParams.canvasId
  const canvasId = Array.isArray(rawCanvasId) ? rawCanvasId[0] : rawCanvasId

  if (!canvasId) {
    redirect('/business')
  }

  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/business')
  }

  const { data, error } = await supabase
    .from('wm_business_canvases')
    .select('id, sector, generated_at, canvas_json')
    .eq('id', canvasId)
    .eq('user_id', user.id)
    .maybeSingle()

  const record = data as CanvasRecord | null

  if (error || !record || !isBusinessCanvas(record.canvas_json)) {
    redirect('/business')
  }

  return (
    <CanvasOutput
      canvas={record.canvas_json}
      metadata={{
        sector: record.sector ?? 'your sector',
        generatedAt: record.generated_at ?? new Date().toISOString()
      }}
    />
  )
}
