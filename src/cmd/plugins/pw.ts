import { nshPlugin, nshResult, BasicStore, nshPrint, nshMissingInput, nshBool } from '../command'

let defaultConfigPath = __dirname
let defaultConfigFileName = 'pw.json'

enum Region {
  CN,
  JP,
  US,
}

interface Phone {
  region: Region
  num: string
}

interface QuestionAnswer {
  q: string
  a: string
}

interface ExtraField {
  k: string
  v: string
}

interface Site {
  urls: string[]
  org: string
}

interface PasswordConfig {
  sites: Array<Site>
  accounts: Array<Account>
}

interface Account {
  org?: string
  tag?: string
  username?: string
  nickname?: string
  ID?: string
  password?: string
  email?: string
  phone?: Phone
  region?: Region
  payment?: {
    password?: string
  }
  secure?: {
    qa?: QuestionAnswer[]
  }
  extra?: ExtraField[]
}

class PWStore extends BasicStore<Account, PasswordConfig> {
  virtualStoreProcess(store: PasswordConfig, elem: Account) {
    store.accounts.push(elem)
    return store
  }

  virtualConformQuery(e: Account, k: string, v: string): boolean {
    let stat = true
    switch (k) {
      case 'org':
        if (e.org !== v) stat = false
        break;
      case 'email':
        if (e.email !== v) stat = false
        break;
      default:
        stat = false
        break;
    }
    return stat
  }

  virtualIterate(s: PasswordConfig, thisIdx: number): Account | undefined {
    if (thisIdx >= s.accounts.length) return undefined
    return s.accounts[thisIdx]
  }

  virtualNewElement(m: Map<string, string>): Account | undefined {
    const e: Account = { extra: [] }
    m.forEach((v, k) => {
      if (k === 'org') { e.org = v }
      else if (k === 'username') { e.username = v }
      else if (k === 'password') { e.password = v }
      else if (k === 'tag') { e.tag = v }
      else if (k === 'id' || k === 'ID') { e.ID = v }
      else if (k === 'phone') { e.phone = { region: 0, num: v } }
      else {
        if (!e.extra) e.extra = []
        e.extra.push({ k: k, v: v })
      }
    })
    if (e.username === '') {
      return undefined
    }
    return e
  }
}

const p = new PWStore({ accounts: [], sites: [] }, defaultConfigPath, defaultConfigFileName)

const nshQuery = async (q?: string): Promise<nshResult> => {
  if (!q) return nshMissingInput()
  const rs = p.getElements(q)
  return nshPrint(rs)
}

// nshInsert - 
// format: org steam, username yiran, password abc ...
const nshInsert = async (i?: string): Promise<nshResult> => {
  if (!i) return nshMissingInput()
  const res = p.insertElement(i)
  return nshBool(res, 'insert failed')
}

export const plugin: nshPlugin = {
  setStorePath: (path: string) => {
    defaultConfigPath = path
    p.setStoreDir(path)
  },
  info: {
    name: 'password manager',
  },
  cmds: new Map([
    [{
      name: 'query',
      desc: 'get account from database',
    }, nshQuery],
    [{
      name: 'new account',
      desc: 'insert account into database',
      help: 'org [Organization], username [Username], password [Password] ... [identifier] [value]'
    }, nshInsert]
  ])
}