import { describe, expect, it } from 'vitest'
import { evaluateSuite } from '../src/evaluate.js'

describe('evaluateSuite', () => {
  it('scores a candidate against required and forbidden golden fragments', () => {
    const report = evaluateSuite({
      suite: 'release-smoke',
      cases: [
        {
          id: 'answer-with-evidence',
          actual: 'The result is 42. Source: benchmark.csv',
          expect: { includes: ['42', 'Source:'], excludes: ['I cannot verify'] },
        },
        {
          id: 'do-not-invent',
          actual: 'The result might be 42, but I cannot verify.',
          expect: { includes: ['42'], excludes: ['I cannot verify'] },
        },
      ],
    })

    expect(report.suite).toBe('release-smoke')
    expect(report.passed).toBe(1)
    expect(report.failed).toBe(1)
    expect(report.score).toBe(0.5)
    expect(report.cases[1]).toMatchObject({
      id: 'do-not-invent',
      pass: false,
      missing: [],
      forbidden: ['I cannot verify'],
    })
  })

  it('reports missing fragments without failing unrelated cases', () => {
    const report = evaluateSuite({
      suite: 'missing-fragment',
      cases: [
        { id: 'one', actual: 'alpha', expect: { includes: ['beta'] } },
        { id: 'two', actual: 'beta', expect: { includes: ['beta'] } },
      ],
    })

    expect(report.cases[0]).toMatchObject({ pass: false, missing: ['beta'], forbidden: [] })
    expect(report.cases[1]).toMatchObject({ pass: true, missing: [], forbidden: [] })
  })

  it('rejects duplicate case identifiers', () => {
    expect(() => evaluateSuite({
      suite: 'invalid',
      cases: [
        { id: 'same', actual: '', expect: {} },
        { id: 'same', actual: '', expect: {} },
      ],
    })).toThrow('duplicate case id: same')
  })
})
