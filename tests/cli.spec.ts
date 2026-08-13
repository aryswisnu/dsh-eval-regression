import { describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = new URL('..', import.meta.url)
const cli = new URL('../src/cli.ts', import.meta.url)

function fixture(contents: unknown): { directory: string, file: string } {
  const directory = mkdtempSync(join(tmpdir(), 'dsh-eval-runner-'))
  const file = join(directory, 'suite.json')
  writeFileSync(file, JSON.stringify(contents))
  return { directory, file }
}

describe('dsh-eval-regression CLI', () => {
  it('prints a JSON report and exits zero for a passing suite', () => {
    const { directory, file } = fixture({ suite: 'smoke', cases: [{ id: 'one', actual: 'ok', includes: ['ok'] }] })
    try {
      const result = spawnSync(process.execPath, ['--import', 'tsx', cli.pathname, file], { cwd: root.pathname, encoding: 'utf8' })
      expect(result.status).toBe(0)
      expect(JSON.parse(result.stdout)).toMatchObject({ suite: 'smoke', passed: 1, failed: 0, score: 1 })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('exits one and reports case-level evidence for a failed suite', () => {
    const { directory, file } = fixture({ suite: 'smoke', cases: [{ id: 'one', actual: 'unsafe', excludes: ['unsafe'] }] })
    try {
      const result = spawnSync(process.execPath, ['--import', 'tsx', cli.pathname, file], { cwd: root.pathname, encoding: 'utf8' })
      expect(result.status).toBe(1)
      expect(JSON.parse(result.stdout)).toMatchObject({ failed: 1, cases: [{ id: 'one', forbidden: ['unsafe'] }] })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
