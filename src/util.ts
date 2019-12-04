import readline from 'readline'
import fs from 'fs'

// printSelection - 
// print an array like:
// [1] * description1...
// [2] * description2...
// [3] * description3...
export const printSelection = <T>(selections: Array<T>) => {
  selections.forEach((selc, i) => {
    process.stdout.write(`[${i + 1}] * ${selc}\n`) // format: [N] * descriptions...
  })
}

// selectOne - 
// print each selection on the screen
// prompt user input index of selection
// return matched arrays index
export const selectOne = async <T>(selections: Array<T>) => {
  printSelection(selections)

  const readIndexInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  let readIndex: number = -1

  process.stdout.write('input index: ')
  for await (const input of readIndexInterface) {
    readIndex = parseInt(input) - 1
    break;
  }

  if (readIndex < 0 || readIndex >= selections.length) {
    throw new Error('invalid index')
  }
  return readIndex
}

// readInJSON - 
export const readInJSON = async <ParsedType>(path: string): Promise<ParsedType> => {
  const configFile = await fs.promises.readFile(path, {
    encoding: 'utf-8'
  })

  const o = JSON.parse(configFile) as ParsedType
  return o
}

interface StringKeyObject<T> { [key: string]: T }

// foldOutKey - 
// {a1: {b:1}, a2: {b:2}} => [{b:1, tag:a1}, {b:2, tag: a2}]
export const foldOutKey = <V, K extends any>(o: { [key: string]: V }, keyTemplate: K): Array<V & K> => {

  let injected: K = keyTemplate

  let folded = Object.keys(o).map(k => {

    Object.keys(keyTemplate).forEach(keyName => {
      injected[keyName] = k
    })

    const merged = {
      ...o[k],
      ...injected
    }

    return merged
  })
  return folded
}

// foldOutKeyToMap -
// {a: {b: {c: 1}}} => Map of key is a and value is {b: {c: 1}}
export const foldOutKeyToMap = <TopKeyValue, ObjectType extends StringKeyObject<TopKeyValue>>(o: ObjectType): Map<string, TopKeyValue> => {
  const outKeys = Object.keys(o)
  let m = new Map
  for (const k of outKeys) {
    m.set(k, o[k])
  }

  return m
}

const enum ruleLevel {
  dumb,
  pairEqual, // basic type property must be same if both property exist
  keyEqual,
}

export const mergeTwoObject = <T extends any>(o1: T, o2: T, rules: {
  level: ruleLevel
} = { level: ruleLevel.pairEqual }): T => {
  const ks = Object.keys(o1)

  // find key in o2 but missing from o1, then append to ks.
  Object.keys(o2).forEach(k => {
    if (!ks.includes(k)) {
      ks.push(k)
    }
  })

  let merged = {} as T

  ks.forEach(k => {
    if (o1[k] === undefined) {
      if (rules.level >= ruleLevel.keyEqual) throw new Error('violate rules.keyEqual')
      merged[k] = o2[k]
    } else if (o2[k] === undefined) {
      if (rules.level >= ruleLevel.keyEqual) throw new Error('violate rules.keyEqual')
      merged[k] = o1[k]
    } else /* (o1[k] && o2[k]) */ {
      if (typeof o1[k] !== typeof o2[k] && rules.level >= ruleLevel.pairEqual) throw new Error(`violate: rules.pairEqual(type)`)

      if (Array.isArray(o1[k])) {
        merged[k] = o1[k].concat(o2[k])
      } else if (['string', 'number'].includes(typeof o1[k])) {
        if (o1[k] !== o2[k] && rules.level >= ruleLevel.pairEqual) throw new Error(`violate: rules.pairEqual(value)`)
        merged[k] = o1[k]
      } else {
        merged[k] = mergeTwoObject(o1[k], o2[k])
      }
    }
  })

  return merged
}