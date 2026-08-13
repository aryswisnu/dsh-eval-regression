#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { runSuiteDocument } from './runner.js'

function usage(): string {
  return 'usage: dsh-eval-regression <suite.json>'
}

function main(argv: string[]): number {
  const file = argv[2]
  if (!file || argv.length !== 3) {
    console.error(usage())
    return 2
  }

  try {
    const document: unknown = JSON.parse(readFileSync(file, 'utf8'))
    const result = runSuiteDocument(document)
    process.stdout.write(`${JSON.stringify(result.report)}\n`)
    return result.exitCode
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`dsh-eval-regression: ${message}\n`)
    return 2
  }
}

process.exitCode = main(process.argv)
