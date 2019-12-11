import { selectOne, c_comma } from '../util'
import { nshPlugin, ArrayStoreWithTopKeyEq, nshSh, nshBool, nshInsertResult } from '../command'

interface PlainInfo {
  "name": string
  "seq": string[]
}

let defaultStoreDir = __dirname
let defaultStoreFile = 'plain.json'

class PlainStore extends ArrayStoreWithTopKeyEq<PlainInfo> {
  virtualNewElement(m: Map<string, string>): PlainInfo | undefined {
    const e: PlainInfo = { name: "", seq: [] }
    m.forEach((v, k) => {
      if (k === 'name') { e.name = v }
      else if (k === 'seq') {
        e.seq.push(...v.split(c_comma))
      }
    })
    if (e.name === "" || e.seq.length === 0) {
      return undefined
    }
    return e
  }
}

const p = new PlainStore([], defaultStoreDir, defaultStoreFile)

export const plugin: nshPlugin = {
  setStorePath: (path: string) => {
    defaultStoreDir = path
    p.setStoreDir(path)
  },
  info: {
    name: 'SEQUENCE',
  },
  cmds: new Map([
    [{
      name: 'EXECUTE SEQUENCE COMMAND'
    }, async () => {
      const idx = selectOne(p.getStore().map(v => v.name), 'select cmd seq')
      const target = p.getStore()[idx]
      return nshSh(target.seq.join(' && '))
    }],
    [{
      name: 'INSERT SEQUENCE COMMAND'
    }, async (i?: string) => {
      const r = p.insertElement(i || '')
      return nshInsertResult(r)
    }]
  ])
}