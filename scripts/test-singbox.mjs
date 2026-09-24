import fs from 'node:fs/promises'

const subUrl = process.env.TEST_SUB_URL

if (!subUrl) {
  throw new Error('TEST_SUB_URL is not set')
}

const target = 'sing-box'

const apiUrl =
  `http://127.0.0.1:3000/sub?target=${target}&url=${encodeURIComponent(subUrl)}`

console.log('Fetching converted sing-box configuration...')

const response = await fetch(apiUrl)

if (!response.ok) {
  throw new Error(`Conversion failed: HTTP ${response.status}`)
}

const text = await response.text()

if (!text.trim()) {
  throw new Error('Conversion returned empty output')
}

let converted

try {
  converted = JSON.parse(text)
} catch {
  throw new Error('Conversion result is not valid JSON')
}

if (!Array.isArray(converted.outbounds)) {
  throw new Error('Conversion result does not contain outbounds[]')
}

if (converted.outbounds.length === 0) {
  throw new Error('Conversion returned zero outbounds')
}

const config = {
  log: {
    level: 'warn'
  },
  inbounds: [],
  outbounds: converted.outbounds,
  route: {}
}

await fs.writeFile(
  'singbox-test.json',
  JSON.stringify(config, null, 2),
  'utf8'
)

console.log(
  `OK: generated sing-box config with ${converted.outbounds.length} outbounds`
)
