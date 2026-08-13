/** Deterministic golden-fragment evaluation for DeepSeek Harness outputs. */
export interface Expectation {
  /** Fragments that must appear in the candidate output. */
  includes?: readonly string[]
  /** Fragments that must not appear in the candidate output. */
  excludes?: readonly string[]
}

export interface EvaluationCase {
  /** Stable identifier used in reports and CI output. */
  id: string
  /** Candidate output from a replay, model run, or external test driver. */
  actual: string
  /** Deterministic acceptance criteria. */
  expect: Expectation
}

export interface EvaluationSuite {
  /** Human-readable suite name. */
  suite: string
  /** Cases evaluated in report order. */
  cases: readonly EvaluationCase[]
}

export interface CaseResult {
  id: string
  pass: boolean
  missing: string[]
  forbidden: string[]
}

export interface EvaluationReport {
  suite: string
  passed: number
  failed: number
  score: number
  cases: CaseResult[]
}

/** Evaluate deterministic golden fragments without interpreting model output. */
export function evaluateSuite(suite: EvaluationSuite): EvaluationReport {
  const seen = new Set<string>()
  const cases = suite.cases.map((testCase) => {
    if (seen.has(testCase.id)) throw new Error(`duplicate case id: ${testCase.id}`)
    seen.add(testCase.id)

    const missing = (testCase.expect.includes ?? []).filter((fragment) => !testCase.actual.includes(fragment))
    const forbidden = (testCase.expect.excludes ?? []).filter((fragment) => testCase.actual.includes(fragment))
    return { id: testCase.id, pass: missing.length === 0 && forbidden.length === 0, missing, forbidden }
  })
  const passed = cases.filter((result) => result.pass).length
  return {
    suite: suite.suite,
    passed,
    failed: cases.length - passed,
    score: cases.length === 0 ? 1 : passed / cases.length,
    cases,
  }
}
