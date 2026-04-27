/// <reference types="@cloudflare/workers-types" />
import type { AbsenceEntry } from '../../../src/types/absence'

interface Env {
  ABSENCE_API_ID: string
  ABSENCE_API_KEY: string
}

interface AbsenceioAbsence {
  _id: string
  assignedTo: { _id: string; name: string } | null
  reasonId: { name: string } | null
  startDate: string
  endDate: string
  reason: string | null
}

interface AbsenceioResponse {
  data: AbsenceioAbsence[]
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiId = context.env.ABSENCE_API_ID
  const apiKey = context.env.ABSENCE_API_KEY

  if (!apiId || !apiKey) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const tomorrowIso = tomorrow.toISOString()

  let res: globalThis.Response
  try {
    res = await fetch('https://app.absence.io/api/v2/absences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-api-id': apiId,
      },
      body: JSON.stringify({
        filter: {
          start: { $lte: tomorrowIso },
          end: { $gte: todayIso },
        },
        relations: ['assignedTo', 'reasonId'],
      }),
    })
  } catch {
    return Response.json({ error: 'upstream_unreachable' }, { status: 502 })
  }

  if (!res.ok) {
    return Response.json({ error: 'upstream_error', status: res.status }, { status: 502 })
  }

  const data: AbsenceioResponse = await res.json()

  const absences: AbsenceEntry[] = (data.data ?? []).map((a) => ({
    userId: a._id,
    userName: a.assignedTo?.name ?? 'Unknown',
    type: a.reasonId?.name ?? 'Absence',
    start: a.startDate,
    end: a.endDate,
    reason: a.reason,
  }))

  return Response.json(absences, {
    headers: { 'Cache-Control': 'max-age=300' },
  })
}
