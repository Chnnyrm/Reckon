import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function rememberPosition({ question, side, entryPrice, openedAt }) {
  const text = `Opened ${side} on ${question} at ${entryPrice} on ${openedAt}.`
  const prefix = process.env.MEMWAL_NAMESPACE_PREFIX || 'default'
  const namespace = `${prefix}-reckon`

  return new Promise((resolve) => {
    let resolved = false
    const pyPath = path.join(__dirname, 'remember.py')
    const child = spawn('python3', [pyPath], {
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        child.kill()
        resolve({ ok: false, reason: 'timeout' })
      }
    }, 20000)

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        try {
          const parsed = JSON.parse(stdout.trim())
          resolve(parsed)
        } catch {
          resolve({ ok: false, reason: stderr || 'parse_error' })
        }
      }
    })

    child.on('error', (err) => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        resolve({ ok: false, reason: err.message })
      }
    })

    child.stdin.write(JSON.stringify({ text, namespace }))
    child.stdin.end()
  })
}

export async function recallPositions(query) {
  const prefix = process.env.MEMWAL_NAMESPACE_PREFIX || 'default'
  const namespace = `${prefix}-reckon`

  return new Promise((resolve) => {
    let resolved = false
    const pyPath = path.join(__dirname, 'recall.py')
    const child = spawn('python3', [pyPath], {
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        child.kill()
        resolve({ ok: false, reason: 'timeout' })
      }
    }, 20000)

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        try {
          const parsed = JSON.parse(stdout.trim())
          resolve(parsed)
        } catch {
          resolve({ ok: false, reason: stderr || 'parse_error' })
        }
      }
    })

    child.on('error', (err) => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        resolve({ ok: false, reason: err.message })
      }
    })

    child.stdin.write(JSON.stringify({ query, namespace }))
    child.stdin.end()
  })
}
