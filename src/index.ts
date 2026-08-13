/**
 * DeepSeek Harness plugin exposing deterministic golden-output evaluation.
 * @module dsh-eval-regression
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export * from './evaluate.js'
export * from './runner.js'
import { evaluateSuite, type EvaluationSuite } from './evaluate.js'

export const name = 'dsh-eval-regression'
export const inject = ['tools']

/** Register an opt-in tool for evaluating externally supplied candidate output. */
export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'evaluate_golden_output',
    description: 'Evaluate candidate output against deterministic required and forbidden text fragments.',
    parameters: {
      suite: { type: 'string', required: true, description: 'Name for this evaluation suite.' },
      cases: {
        type: 'array', required: true, description: 'Ordered candidate outputs and their golden-fragment expectations.',
        items: {
          type: 'object', additionalProperties: false, properties: {
            id: { type: 'string', required: true, description: 'Stable case identifier.' },
            actual: { type: 'string', required: true, description: 'Candidate output to evaluate.' },
            includes: { type: 'array', items: { type: 'string' }, description: 'Fragments that must appear.' },
            excludes: { type: 'array', items: { type: 'string' }, description: 'Fragments that must not appear.' },
          },
        },
      },
    },
    output: {
      schema: {
        type: 'object', additionalProperties: false, properties: {
          suite: { type: 'string', required: true },
          passed: { type: 'integer', required: true },
          failed: { type: 'integer', required: true },
          score: { type: 'number', required: true },
          cases: { type: 'array', required: true, items: { type: 'object', additionalProperties: false, properties: {
            id: { type: 'string', required: true },
            pass: { type: 'boolean', required: true },
            missing: { type: 'array', items: { type: 'string' }, required: true },
            forbidden: { type: 'array', items: { type: 'string' }, required: true },
          } } },
        },
      },
      render: (_args, report) => [{ type: 'text', text: JSON.stringify(report) }],
    },
    async execute(args) {
      const input = args as unknown as { suite: string, cases: Array<{ id: string, actual: string, includes?: string[], excludes?: string[] }> }
      const suite: EvaluationSuite = {
        suite: input.suite,
        cases: input.cases.map((testCase) => ({
          id: testCase.id,
          actual: testCase.actual,
          expect: { includes: testCase.includes, excludes: testCase.excludes },
        })),
      }
      return evaluateSuite(suite)
    },
  }))
}
