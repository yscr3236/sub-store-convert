import { Hono } from 'hono'
import { convert } from "@sub-store-convert/core"

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

    if (opts.debug === '1') {
        const tests = [
            ['default', {}],
            ['browser', {
                'User-Agent': 'Mozilla/5.0'
            }],
            ['curl', {
                'User-Agent': 'curl/8.0'
            }],
            ['accept', {
                'User-Agent': 'Mozilla/5.0',
                'Accept': '*/*'
            }]
        ]

        const results = []

        for (const [name, headers] of tests) {
            try {
                const response = await fetch(url, { headers })
                const body = await response.arrayBuffer()

                results.push({
                    name,
                    status: response.status,
                    contentType: response.headers.get('content-type'),
                    contentLength: response.headers.get('content-length'),
                    bytes: body.byteLength
                })
            } catch (e) {
                results.push({
                    name,
                    error: e instanceof Error ? e.message : String(e)
                })
            }
        }

        return c.json({
            ok: true,
            tests: results
        })
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
