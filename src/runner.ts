import { evaluateSuite, type EvaluationReport, type EvaluationSuite } from './evaluate.js'

export interface SuiteDocumentCase {
  id: string
  actual: string
  includes?: string[]
  excludes?: string[]
}

export interface SuiteDocument {
  suite: string
  cases: SuiteDocumentCase[]
}

export interface SuiteRunResult {
  report: EvaluationReport
  exitCode: 0 | 1
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value as Record<string, unknown>
}

function strings(value: unknown, label: string): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new Error(`${label} must be an array of strings`)
  return value as string[]
}

/** Validate an untrusted JSON suite before deterministic evaluation. */
export function parseSuiteDocument(value: unknown): EvaluationSuite {
  const document = record(value, 'suite document')
  if (typeof document.suite !== 'string' || document.suite.length === 0) throw new Error('suite must be a non-empty string')
  if (!Array.isArray(document.cases)) throw new Error('cases must be an array')

  return {
    suite: document.suite,
    cases: document.cases.map((value, index) => {
      const testCase = record(value, `cases[${index}]`)
      if (typeof testCase.id !== 'string' || testCase.id.length === 0) throw new Error(`cases[${index}].id must be a non-empty string`)
      if (typeof testCase.actual !== 'string') throw new Error(`case ${testCase.id}.actual must be a string`)
      return {
        id: testCase.id,
        actual: testCase.actual,
        expect: {
          includes: strings(testCase.includes, `case ${testCase.id}.includes`),
          excludes: strings(testCase.excludes, `case ${testCase.id}.excludes`),
        },
      }
    }),
  }
}

/** Run a version-controlled JSON evaluation suite and return a CI-safe outcome. */
export function runSuiteDocument(value: unknown): SuiteRunResult {
  const report = evaluateSuite(parseSuiteDocument(value))
  return { report, exitCode: report.failed === 0 ? 0 : 1 }
}
