import { ArrayStoreWithTopKeyEq, nshPlugin, nshPrint, nshInsertResult } from "../command"

interface WhereisInfo {
  "name": string
  "place": string
  "tag": string
  "time": string
}

let defaultStoreDir = __dirname
let defaultStoreFile = 'whereis.json'

class WhereisStore extends ArrayStoreWithTopKeyEq<WhereisInfo> {
  virtualNewElement(m: Map<string, string>) {
    const e: WhereisInfo = { name: "", place: "", tag: "", time: "" }
    m.forEach((v, k) => {
      if (k === 'name') { e.name = v }
      else if (k === 'place') { e.place = v }
      else if (k === 'tag') { e.tag = v }
    })
    if (e.name === "" || e.place === "") {
      return undefined
    }
    e.time = new Date().toISOString()
    return e;
  }
}

const p = new WhereisStore([], defaultStoreDir, defaultStoreFile)

export const plugin: nshPlugin = {
  setStorePath: (path: string) => p.setStoreDir(path),
  info: { name: 'WHERE-IS' },
  cmds: new Map([
    [{ name: 'FIND MY ITEM' }, async q => nshPrint(p.getElements(q || ''))],
    [{ name: 'REGISTER PLACE' }, async i => nshInsertResult(p.insertElement(i || ''))]
  ])
}