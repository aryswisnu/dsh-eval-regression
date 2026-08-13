import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { CallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as evaluator from '../src/index.js'

const contexts: Context[] = []
const signal = new AbortController().signal

async function harness() {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  const fiber = await ctx.plugin(evaluator)
  return { ctx, fiber }
}

afterEach(async () => {
  await Promise.allSettled(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

describe('dsh-eval-regression plugin', () => {
  it('registers and executes the evaluator through the real tool pipeline', async () => {
    const { ctx } = await harness()

    expect(ctx.tools.schemas().find(tool => tool.name === 'evaluate_golden_output')).toMatchObject({
      name: 'evaluate_golden_output',
      parameters: { required: ['suite', 'cases'] },
    })

    const result = await ctx.tools.execute({
      signal,
      callId: CallId('eval-1'),
      name: 'evaluate_golden_output',
      arguments: {
        suite: 'smoke',
        cases: [{ id: 'evidence', actual: 'source: report', includes: ['source:'], excludes: ['hallucinated'] }],
      },
    })

    expect(result).toMatchObject({
      isError: false,
      value: { suite: 'smoke', passed: 1, failed: 0, score: 1 },
    })
  })

  it('unregisters its tool when its plugin fiber disposes', async () => {
    const { ctx, fiber } = await harness()
    await fiber.dispose()
    expect(ctx.tools.get('evaluate_golden_output')).toBeUndefined()
  })
})
