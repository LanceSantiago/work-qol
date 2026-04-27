/// <reference types="@cloudflare/workers-types" />
import type { AbsenceEntry } from '../../../src/types/absence'

interface Env {
  ABSENCE_ICS_URL: string
}

function parseIcsDate(value: string): Date {
  // DATE format: YYYYMMDD
  if (value.length === 8) {
    return new Date(
      Date.UTC(
        parseInt(value.slice(0, 4)),
        parseInt(value.slice(4, 6)) - 1,
        parseInt(value.slice(6, 8))
      )
    )
  }
  // DATETIME format: YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss
  return new Date(
    value.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/, '$1-$2-$3T$4:$5:$6$7')
  )
}

function parseVEvents(ics: string): AbsenceEntry[] {
  const entries: AbsenceEntry[] = []
  const eventBlocks = ics.split('BEGIN:VEVENT').slice(1)

  for (const block of eventBlocks) {
    const get = (key: string): string | null => {
      const match = block.match(new RegExp(`^${key}[;:][^\r\n]*`, 'm'))
      if (!match) return null
      return match[0].replace(/^[^:]+:/, '').trim()
    }

    const uid = get('UID') ?? crypto.randomUUID()
    const summary = get('SUMMARY') ?? 'Unknown'
    const dtStartRaw = get('DTSTART')
    const dtEndRaw = get('DTEND')

    if (!dtStartRaw || !dtEndRaw) continue

    const dashIdx = summary.indexOf(' - ')
    const type = dashIdx !== -1 ? summary.slice(0, dashIdx) : 'Absence'
    const userName = dashIdx !== -1 ? summary.slice(dashIdx + 3) : summary

    entries.push({
      userId: uid,
      userName,
      type,
      start: parseIcsDate(dtStartRaw).toISOString(),
      end: parseIcsDate(dtEndRaw).toISOString(),
      reason: null,
    })
  }

  return entries
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const icsUrl = context.env.ABSENCE_ICS_URL

  if (!icsUrl) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  let res: globalThis.Response
  try {
    res = await fetch(icsUrl)
  } catch {
    return Response.json({ error: 'upstream_unreachable' }, { status: 502 })
  }

  if (!res.ok) {
    return Response.json({ error: 'upstream_error', status: res.status }, { status: 502 })
  }

  const icsText = await res.text()

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  const absences = parseVEvents(icsText).filter((e) => {
    const start = new Date(e.start).getTime()
    const end = new Date(e.end).getTime()
    // DTEND for all-day events is exclusive, so use < not <=
    return start <= todayMs && end > todayMs
  })

  return Response.json(absences, {
    headers: { 'Cache-Control': 'max-age=300' },
  })
}
