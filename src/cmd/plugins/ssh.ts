import { selectOne } from '../util'
import { nshPlugin, nshResult, nshSh, nshPrint, ArrayStoreWithTopKeyEq, nshMissingInput, nshBool, nshInsertResult } from '../command'

interface SSHInfo {
  tag: string
  host: string
  user: string
}

let defaultStoreDir = __dirname
let defaultStoreFile = 'ssh.json'

class SSHStore extends ArrayStoreWithTopKeyEq<SSHInfo> {
  virtualNewElement(m: Map<string, string>): SSHInfo | undefined {
    const e: SSHInfo = { tag: "", host: "", user: "" }
    m.forEach((v, k) => {
      if (k === 'tag') { e.tag = v }
      else if (k === 'host') { e.host = v }
      else if (k === 'user') { e.user = v }
    })
    if (e.host === '' || e.user === '') {
      return undefined
    }
    return e
  }
}

const p = new SSHStore([], defaultStoreDir, defaultStoreFile)

const genSSHCommand = (user: string, host: string) => `ssh ${user}@${host}`

const nshConnect = async (): Promise<nshResult> => {
  const idx = selectOne(p.getStore().map(v => v.tag), 'select ssh target')
  const target = p.getStore()[idx]
  return nshSh(genSSHCommand(target.user, target.host))
}

const nshInsert = async (i?: string): Promise<nshResult> => {
  if (!i) return nshMissingInput()
  const r = p.insertElement(i)
  return nshInsertResult(r)
}

const nshQuery = async (q?: string): Promise<nshResult> => {
  if (!q) return nshMissingInput()
  const r = p.getElements(q)
  return nshPrint(r)
}

export const plugin: nshPlugin = {
  setStorePath: (path: string) => {
    defaultStoreDir = path
    p.setStoreDir(path)
  },
  info: {
    name: 'SSH',
  },
  cmds: new Map([
    [{
      name: 'CONNECT',
    }, nshConnect],
    [{
      name: 'CREATE NEW SSH INFO',
      help: 'insert help',
    }, nshInsert],
    [{
      name: 'QUERY SSH INFO',
      help: 'find help',
    }, nshQuery],
  ])
}