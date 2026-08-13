# dsh-eval-regression

A small, deterministic regression-evaluation plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

It registers `evaluate_golden_output`, a model-callable tool that compares supplied candidate output against required and forbidden fragments. It does not call a model, persist data, or claim semantic correctness. Its job is repeatable pass/fail evidence, not vibes-based architecture in a trench coat.

## Why

Agent changes routinely regress answers that appear superficially acceptable. A stable corpus of expected fragments gives a cheap, transparent signal for release smoke tests and replayed transcripts:

- required fragments catch omissions
- forbidden fragments catch known bad claims or unsafe fallbacks
- per-case reports make failures reviewable
- deterministic scoring is suitable for CI thresholds

## Install as a DSH plugin

```sh
dsh plugin --profile <profile> add github:aryswisnu/dsh-eval-regression
```

The package is a DSH bundle. Its `cordis.patch.yml` registers the tool automatically after the profile's base tool runtime.

For local development:

```sh
git clone https://github.com/aryswisnu/dsh-eval-regression.git
cd dsh-eval-regression
npm install
npm run build
dsh plugin --profile <profile> add .
```

## Run a version-controlled suite in CI

The plugin also ships a small CLI. It reads a JSON suite, prints an evaluation report to stdout, exits `0` when every case passes, exits `1` when any case fails, and exits `2` for invalid input or usage errors.

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

```sh
npx dsh-eval-regression suites/release-smoke.json
# or, from this repository:
npm run evaluate -- suites/release-smoke.json
```

The report includes total passed and failed cases, a `0..1` score, and case-level missing or forbidden fragments. This makes the evaluation corpus ordinary, reviewable source code and makes a failed expectation fail the CI job.

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
