import * as readlineSync from 'readline-sync'
import fs from 'fs'
import * as Path from 'path'
import * as Shell from 'shelljs'

export const c_comma = ','
export const c_space = ' '
export const c_dot = '.'
export const c_single_quote = `'`

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
export const selectOne = <T>(selections: Array<T>, prompt?: string) => {
  const defaultPrompt = 'input index: '

  printSelection(selections)
  const readIndex = readlineSync.questionInt(prompt || defaultPrompt) - 1

  if (readIndex < 0 || readIndex >= selections.length) {
    throw new Error('invalid index')
  }
  return readIndex
}

export const selectOneWithArgs = <T>(selections: Array<T>, prompt?: string): [number, string] => {
  const defaultPrompt = 'input index, (follow with args): '

  printSelection(selections)

  let _input = readlineSync.question(prompt || defaultPrompt)
  let input = eatRedundantSpace(_input).split(c_space)

  let readIndex = parseInt(input[0]) - 1
  let args = input.length > 1 ? input.slice(1).join(c_space) : ''

  return [readIndex, args]
}


// readInJSON - 
export const readInJSON = <ParsedType>(path: string): ParsedType => {
  const configFile = fs.readFileSync(path, {
    encoding: 'utf-8'
  })

  const o = JSON.parse(configFile) as ParsedType
  return o
}

export const readInJSONBatch = <ParsedType>(dir: string, prefix: string): Array<ParsedType> => {
  const filePaths = fs.readdirSync(dir)

  let os: Array<ParsedType> = []
  for (const filePath of filePaths) {
    if (filePath.indexOf(prefix) === 0) {
      const p = Path.join(dir, filePath)
      const f = fs.readFileSync(p, { encoding: 'utf-8' })
      const o = JSON.parse(f) as ParsedType
      os.push(o)
    }
  }

  return os
}

export const writeToJSON = <T>(path: string, jdata: T): boolean => {
  const o = JSON.stringify(jdata)
  try {
    fs.writeFileSync(path, o, {
      encoding: 'utf-8'
    })
  } catch (e) {
    return false
  }
  return true
}

// file count with same prefix
export const fileCount = (dir: string, prefix: string): number => {
  let n = 0
  try {
    const files = fs.readdirSync(dir)
    for (const f of files) {
      if (f.indexOf(prefix) === 0) {
        n++
      }
    }
  } catch (e) {
    n = 0
  }
  return n
}

export const updateJSON = <T>(path: string, callback: (data: T) => T): boolean => {
  let o = readInJSON<T>(path)
  o = callback(o)
  writeToJSON(path, o)
  return true
}

export const deleteFileBatch = (dir: string, prefix: string) => {
  let files = fs.readdirSync(dir)
  for (const f of files) {
    if (f.indexOf(prefix) == 0) {
      const fpath = Path.join(dir, f)
      fs.unlinkSync(fpath)
    }
  }
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
} = { level: ruleLevel.pairEqual }): any => {
  if (Array.isArray(o1) && Array.isArray(o2)) {
    const ao1 = o1 as Array<any>
    const ao2 = o2 as Array<any>
    return [...ao1, ...ao2]
  }


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
// ArrayEqual - 
// compare two arrays, with === operator at each elements. 
export const ArrayEqual = <T>(a1: Array<T>, a2: Array<T>): boolean => {
  if (a1.length !== a2.length) return false
  for (let i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i]) return false
  }
  return true
}

export const splitWithEx = (i: string, split: string, except: string): string[] => {
  i = i.trim()

  let inEx = false
  let res: string[] = []
  let thisBlock = ''

  for (const c of i) {

    if (inEx) {
      if (c === except) {
        inEx = false
        res.push(thisBlock)
        thisBlock = ''
      } else {
        thisBlock += c
      }
    } else {
      if (c === except) {
        inEx = true
      } else if (c !== split) {
        thisBlock += c
      } else {
        res.push(thisBlock)
        thisBlock = ''
      }
    }
  }
  if (thisBlock !== '') {
    res.push(thisBlock)
    thisBlock = ''
  }
  return res
}

// eatRedundantSpace
// example: 
// `      s           a              w        `   -> 's a w'
// `      s    a       w   ' w   b '` -> `s a w ' w   b '`
export const eatRedundantSpace = (origin: string, except: string[] = []): string => {
  origin = origin.trim()

  if (origin.length === 0)
    return origin

  let res = ''
  let topIsSpace = false
  let inblock = false
  let c_inblock = ''

  for (let i = 0; i < origin.length; i++) {
    let c = origin[i]

    if (inblock) {
      if (c === c_inblock) {
        inblock = false
        c_inblock = ''
        res += c
      } else {
        res += c
      }
    } else {
      if (except.some(e => e === c)) {
        inblock = true
        c_inblock = c
        res += c
      } else {
        if (c !== c_space) {
          res += c
          topIsSpace = false
        } else if (!topIsSpace) {
          res += c_space
          topIsSpace = true
        }
      }
    }
  }

  if (inblock === true) {
    throw new Error('except not pair')
  }
  return res
}

export const numHash = (): string => {
  return (Math.random() * 1_000_000_000).toString()
}

export const rawInputParse = (i: string, seg_split: string = c_comma): Map<string, string> => {
  const frags = i.split(seg_split)

  const kvMap = new Map<string, string>()

  for (const _f of frags) {
    const f = eatRedundantSpace(_f, [c_single_quote])
    const kv = splitWithEx(f, c_space, c_single_quote)
    if (kvMap.has(kv[0]))
      throw new Error(`duplicate input, see here -> '${_f}'`)
    if (kv.length < 2) {
      throw new Error(`no pair value, see here -> '${_f}'`)
    }
    kvMap.set(kv[0], kv.slice(1).join(c_comma)) // k: "a", v: "1,2,3"
  }
  return kvMap
}

export const createShellScript = (scriptPath: string, cmd: string) => {
  const shHead = `#!/bin/zsh\n\n`
  fs.writeFileSync(scriptPath, shHead + cmd, {
    encoding: 'utf-8'
  })
  Shell.chmod('+x', scriptPath)
}