# dsh-eval-regression

A small, deterministic regression-evaluation plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

It registers `evaluate_golden_output`, a model-callable tool that compares supplied candidate output against required and forbidden fragments. It does not call a model, persist data, or claim semantic correctness. Its job is repeatable pass/fail evidence, not vibes-based architecture in a trench coat.

## Why

Agent changes routinely regress answers that appear superficially acceptable. A stable corpus of expected fragments gives a cheap, transparent signal for release smoke tests and replayed transcripts:

- required fragments catch omissions
- forbidden fragments catch known bad claims or unsafe fallbacks
- per-case reports make failures reviewable
- deterministic scoring is suitable for CI thresholds

## Install

```sh
npm install dsh-eval-regression
```

Add the package to a DeepSeek Harness Cordis composition after `@deepseek-ai/dsh-tools`:

```yaml
- name: '@deepseek-ai/dsh-tools'
- name: 'dsh-eval-regression'
```

## Tool example

```json
{
  "suite": "release-smoke",
  "cases": [
    {
      "id": "grounded-answer",
      "actual": "The result is 42. Source: benchmark.csv",
      "includes": ["42", "Source:"],
      "excludes": ["I cannot verify"]
    }
  ]
}
```

The canonical result includes total passed and failed cases, a `0..1` score, and each case's missing or forbidden fragments.

## Boundaries

This is intentionally a narrow deterministic evaluator. It does not replace model-quality review, factual grounding, tool execution checks, or snapshot replay. Use it as one gate in an evaluation harness, then add stronger signals where the product needs them.

## Development

```sh
npm install
npm test
npm run typecheck
npm run build
```

MIT License.
