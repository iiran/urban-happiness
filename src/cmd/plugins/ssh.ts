import { selectOne } from '../util'
import { nshPlugin, nshResult, BasicStore, nshErr, nshSh, nshOk, nshPrint } from '../command'

interface SSHInfo {
  tag: string
  host: string
  user: string
}

type SSHConfig = Array<SSHInfo>

let defaultStoreDir = __dirname
let defaultStoreFile = 'ssh.json'

class SSHStore extends BasicStore<SSHInfo, SSHConfig> {
  virtualStoreProcess(store: SSHConfig, elem: SSHInfo): SSHConfig {
    store.push(elem)
    return store
  }

  virtualConformQuery(e: SSHInfo, k: string, v: string): boolean {
    let stat = true
    switch (k) {
      case 'host':
        if (e.host !== v) stat = false
        break;
      case 'user':
        if (e.user !== v) stat = false
        break;
      case 'tag':
        if (e.tag !== v) stat = false
        break;
      default:
        stat = false
        break;
    }
    return stat
  }

  virtualIterate(s: SSHConfig, thisIdx: number): SSHInfo | undefined {
    if (thisIdx >= s.length) return undefined
    return s[thisIdx]
  }

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

const genSSHCommand = (user: string, host: string) => {
  return `ssh ${user}@${host}`
}

const nshConnect = async (): Promise<nshResult> => {
  const idx = selectOne(p.getStore().map(v => v.tag), 'select ssh target')
  const target = p.getStore()[idx]
  return nshSh(genSSHCommand(target.user, target.host))
}

const nshInsert = async (i?: string): Promise<nshResult> => {
  if (!i) return nshErr('missing input')
  const r = p.insertElement(i)
  return r ? nshOk() : nshErr('insert fail')
}

const nshQuery = async (q?: string): Promise<nshResult> => {
  if (!q) return nshErr('missing input')
  const r = p.getElements(q)
  return nshPrint(r)
}

export const plugin: nshPlugin = {
  setStorePath: (path: string) => {
    defaultStoreDir = path
    p.setStoreDir(path)
  },
  info: {
    name: 'ssh',
  },
  cmds: new Map([
    [{
      name: 'connect',
    }, nshConnect],
    [{
      name: 'insert',
      help: 'insert help',
    }, nshInsert],
    [{
      name: 'find',
      help: 'find help',
    }, nshQuery],
  ])
}