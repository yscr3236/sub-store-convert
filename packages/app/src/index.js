import { Hono } from 'hono'
import { convert, parsers } from "@sub-store-convert/core"

const app = new Hono()

app.get('/', (c) => {
    return c.redirect('https://github.com/tbxark/sub-store-convert', 302)
})

app.get('/sub', async (c) => {
    const opts = c.req.query()
    const target = opts.target
    const url = opts.url

    if (!target || !url) {
        return c.text('Missing target or url', 400)
    }

    // Temporary diagnostic mode.
    // Does not return the subscription URL or decoded node contents.
    if (opts.debug === '1') {
        try {
            const response = await fetch(url)
            const raw = await response.text()

            const firstChar = raw.length > 0 ? raw[0] : ''
            const contentType = response.headers.get('content-type')
            const contentLength = response.headers.get('content-length')

            let base64Valid = false
            let decodedBytes = 0
            let decodedFirstChar = ''
            let decodedLines = 0
            let ssLines = 0
            let ssParsed = 0

            try {
                const normalized = raw.replace(/\s/g, '')
                const padded =
                    normalized +
                    '='.repeat((4 - normalized.length % 4) % 4)

                const decoded = atob(padded)

                base64Valid = decoded.length > 0
                decodedBytes = decoded.length
                decodedFirstChar = decoded.length > 0 ? decoded[0] : ''

                const lines = decoded
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(Boolean)

                decodedLines = lines.length

                for (const line of lines) {
                    if (/^ss:\/\//.test(line)) {
                        ssLines++

                        for (const parser of parsers) {
                            try {
                                if (parser.test(line)) {
                                    const parsed = parser.parse(line)
                                    if (parsed) {
                                        ssParsed++
                                    }
                                    break
                                }
                            } catch {
                                // ignore individual parser errors
                            }
                        }
                    }
                }
            } catch {
                base64Valid = false
            }

            return c.json({
                ok: true,
                httpStatus: response.status,
                contentType,
                contentLength,
                bytes: raw.length,
                firstChar,
                base64Valid,
                decodedBytes,
                decodedFirstChar,
                decodedLines,
                ssLines,
                ssParsed
            })
        } catch (e) {
            return c.json({
                ok: false,
                error: e instanceof Error ? e.message : String(e)
            }, 500)
        }
    }

    delete opts.target
    delete opts.url
    delete opts.debug

    try {
        for (const key in opts) {
            const val = opts[key]

            if (typeof val !== 'string') continue

            if (val === 'true') {
                opts[key] = true
            } else if (val === 'false') {
                opts[key] = false
            } else if (
                val !== '' &&
                val.trim() !== '' &&
                !isNaN(val)
            ) {
                opts[key] = Number(val)
            }
        }

        const res = await convert(url, target, opts)
        return c.text(res, 200)
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        return c.text(msg, 500)
    }
})

export default app
