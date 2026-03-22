import { NextResponse } from 'next/server'
import { CanvasParseError, generateBusinessCanvas } from '@/lib/claude/canvas'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ApiResponse } from '@/types/api'
import type { BusinessCanvas } from '@/types'

interface CanvasRequestBody {
  name?: string
  background?: string
  capitalRange?: string
  sector?: string
  idea?: string
  concernKey?: string
  revenueRange?: string
  extra?: string
}

interface CanvasCreateResponse {
  canvasId: string
  canvas: BusinessCanvas
}

function getMissingRequiredFields(body: CanvasRequestBody): string[] {
  const requiredFields: Array<keyof CanvasRequestBody> = ['capitalRange', 'sector', 'idea', 'concernKey', 'revenueRange']

  return requiredFields.filter((field) => {
    const value = body[field]
    return typeof value !== 'string' || value.trim().length === 0
  })
}

/**
 * POST API route for business canvas generation via Claude.
 * @param request Incoming JSON request.
 * @returns Typed API response with generated canvas.
 */
export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<ApiResponse<CanvasCreateResponse>>(
        { success: false, error: 'Please log in to generate a business canvas.', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const payload = (await request.json()) as CanvasRequestBody
    const missingFields = getMissingRequiredFields(payload)

    if (missingFields.length > 0) {
      return NextResponse.json<ApiResponse<CanvasCreateResponse>>(
        {
          success: false,
          error: `Missing required field(s): ${missingFields.join(', ')}`,
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      )
    }

    let canvas: BusinessCanvas
    try {
      canvas = await generateBusinessCanvas({
        name: payload.name,
        background: payload.background,
        capitalRange: payload.capitalRange as string,
        sector: payload.sector as string,
        idea: payload.idea as string,
        concernKey: payload.concernKey as string,
        revenueRange: payload.revenueRange as string,
        extra: payload.extra
      })
    } catch (generationError: unknown) {
      if (generationError instanceof CanvasParseError) {
        return NextResponse.json<ApiResponse<CanvasCreateResponse>>(
          { success: false, error: 'Claude response could not be parsed.', code: 'CANVAS_PARSE_FAILED' },
          { status: 500 }
        )
      }
      throw generationError
    }

    const admin = createAdminClient()

    const { data: insertData, error: insertError } = await admin
      .from('wm_business_canvases')
      .insert({
        user_id: user.id,
        sector: payload.sector,
        idea: payload.idea,
        capital_range: payload.capitalRange,
        background: payload.background,
        concern: payload.concernKey,
        revenue_goal_range: payload.revenueRange,
        canvas_json: canvas,
        generated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError || !insertData?.id) {
      throw new Error('Canvas persistence failed')
    }

    return NextResponse.json<ApiResponse<CanvasCreateResponse>>({
      success: true,
      data: { canvasId: insertData.id, canvas }
    })
  } catch (_error: unknown) {
    return NextResponse.json<ApiResponse<CanvasCreateResponse>>(
      { success: false, error: 'Could not generate business canvas right now.', code: 'CANVAS_GENERATION_FAILED' },
      { status: 500 }
    )
  }
}
