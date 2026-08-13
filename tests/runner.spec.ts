import { describe, expect, it } from 'vitest'
import { runSuiteDocument } from '../src/runner.js'

describe('runSuiteDocument', () => {
  it('returns a CI-safe success exit code for a fully passing suite', () => {
    const result = runSuiteDocument({
      suite: 'release-smoke',
      cases: [{ id: 'grounded', actual: 'Answer: 42. Source: report.csv', includes: ['42', 'Source:'] }],
    })

    expect(result.exitCode).toBe(0)
    expect(result.report).toMatchObject({ suite: 'release-smoke', passed: 1, failed: 0, score: 1 })
  })

  it('returns a nonzero exit code and machine-readable failures for a failing suite', () => {
    const result = runSuiteDocument({
      suite: 'release-smoke',
      cases: [{ id: 'safe-answer', actual: 'I cannot verify.', includes: ['Source:'], excludes: ['I cannot verify'] }],
    })

    expect(result.exitCode).toBe(1)
    expect(result.report.cases).toEqual([{ id: 'safe-answer', pass: false, missing: ['Source:'], forbidden: ['I cannot verify'] }])
  })

  it('rejects malformed suite documents before they can produce a false-green result', () => {
    expect(() => runSuiteDocument({ suite: 'invalid', cases: [{ id: 'missing-actual', includes: ['x'] }] }))
      .toThrow('case missing-actual.actual must be a string')
  })
})
