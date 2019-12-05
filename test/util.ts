import { ArrayEqual } from '../src/util'

const ReturnCheck = (res: any, predict: Array<any>) => {
  if (Array.isArray(res)) return ArrayEqual(res, predict)
  if (['string', 'number', 'boolean'].includes(typeof res)) return predict.length === 1 ? res == predict[0] : false

  // unknown
  return false
}

interface TestResult {
  ok: boolean
  testName: string
  testParams: Array<any>
  msg?: string
}

export const MethodTest = async (func: Function, params: Array<any>, predict: Array<any>): Promise<TestResult> => {
  let o = {}

  let ok = true
  let msg = ''

  try {
    let funcRes = await func.call(o, ...params)
    ok = ReturnCheck(funcRes, predict)
  } catch (e) {
    msg = e
    ok = false
  }

  return {
    ok: ok,
    testName: func.name,
    testParams: params,
    msg: msg
  }
}

export const ReportTest = (res: Array<TestResult>) => {
  process.stdout.write(`Testing finished.\n`)

  let failed: TestResult[] = []
  res.forEach(r => {
    if (!r.ok) failed.push(r)
  })

  if (failed.length === 0) {
    process.stdout.write(`✅ all test pass.  ${res.length - failed.length} of ${res.length}\n`)
    return
  }
  process.stdout.write(`❌ [${failed.length} of ${res.length}] failed `)
  for (const f of failed) {
    process.stdout.write(` ${f.testName} with parameters ${JSON.stringify(f.testParams)}, detail: ${f.msg}\n`)
  }
}