import { ArrayStoreWithTopKeyEq, nshPrint, nshPlugin, nshMissingInput, nshInsertResult, nshUpdateResult } from '../command'
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

export const plugin: nshPlugin = {
  setStorePath: (path: string) => {
    defaultStoreDir = path
    p.setStoreDir(path)
  },
  info: {
    name: 'MANUAL'
  },
  cmds: new Map([
    [{
      name: 'QUERY MANUAL'
    }, async (q?: string) => {
      if (!q) return nshMissingInput()
      const r = p.getElements(q)
      return nshPrint(r)
    }],
    [{
      name: 'INSERT MANUAL'
    }, async (i?: string) => {
      if (!i) return nshMissingInput()
      const r = p.insertElement(i)
      return nshInsertResult(r)
    }],
    [{
      name: 'UPDATE MANUAL STOREAGE'
    }, async () => {
      const r = p.updateStable()
      return nshUpdateResult(r)
    }]
  ])
}
