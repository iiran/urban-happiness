import { ArrayStoreWithTopKeyEq, nshResult, nshPrint, nshPlugin, nshBool, nshMissingInput } from '../command'
import { c_comma } from '../util'

interface ManInfo {
  "exec": string
  "opts": string[]
}

let defaultStoreDir = __dirname
let defaultStoreFile = 'man.json'

class ManStore extends ArrayStoreWithTopKeyEq<ManInfo> {
  virtualNewElement(m: Map<string, string>): ManInfo | undefined {
    const e: ManInfo = { exec: '', opts: [] }
    m.forEach((v, k) => {
      if (k === 'exec') {
        e.exec = v
      } else if (k === 'opts') {
        e.opts.push(...v.split(c_comma))
      }
    })
    if (e.exec === '' || e.opts.length === 0) {
      return undefined
    }
    return e
  }
}

const p = new ManStore([], defaultStoreDir, defaultStoreFile)

const nshQuery = async (q?: string): Promise<nshResult> => {
  if (!q) return nshMissingInput()
  const r = p.getElements(q)
  return nshPrint(r)
}

const nshInsert = async (i?: string): Promise<nshResult> => {
  if (!i) return nshMissingInput()
  const r = p.insertElement(i)
  return nshBool(r, 'insertfail')
}

export const plugin: nshPlugin = {
  setStorePath: (path: string) => {
    defaultStoreDir = path
    p.setStoreDir(path)
  },
  info: {
    name: 'man'
  },
  cmds: new Map([
    [{
      name: 'query'
    }, nshQuery],
    [{
      name: 'insert'
    }, nshInsert]
  ])
}
