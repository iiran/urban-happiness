import { selectOne } from '../util'
import { nshPlugin, nshResult, BasicStore, nshSh, nshPrint, nshMissingInput } from '../command'

let showPassword = true
let defaultStoreDir = __dirname
let defaultStoreFile = `db.json`

interface DBConfig {
  [tag: string]: DBInfo
}

interface DBInfo {
  dialect: string
  host: string
  port: string
  user: string
  password: string
  database: string
}

interface DBClient {
  connect(): string[]
  understand(nickname: string): boolean
  getTag(): string
}

class BaseDB {
  protected m_tag: string
  protected m_info: DBInfo

  constructor(tag: string, info: DBInfo) {
    this.m_tag = tag
    this.m_info = info
  }

  getTag() {
    return this.m_tag
  }
}

class Postgres extends BaseDB implements DBClient {
  static nicknames = ['pg', 'postgres', 'postgresql']

  constructor(tag: string, info: DBInfo) {
    super(tag, info)
  }

  understand = (nickname: string) => Postgres.Understand(nickname)

  static Understand = (nickname: string) => {
    return Postgres.nicknames.includes(nickname.toLowerCase())
  }

  connect(): string[] {
    let cmd = []
    cmd.push(`psql -h ${this.m_info.host} -p ${this.m_info.port} -U ${this.m_info.user} -W ${this.m_info.database}`)
    if (showPassword) cmd.push(this.m_info.password)
    return cmd
  }
}

const newDBClient = (tag: string, info: DBInfo): DBClient => {
  let dbc: DBClient
  if (Postgres.Understand(info.dialect)) {
    dbc = new Postgres(tag, info)
  } else {
    throw new Error('unknown database type');
  }
  return dbc
}

class DBStore extends BasicStore<DBInfo & { tag: string }, DBConfig> {
  virtualConformQuery(e: DBInfo & { tag: string }, k: string, v: string): boolean {
    let stat = true
    switch (k) {
      case 'host':
        if (e.host !== v) stat = false
        break;
      case 'port':
        if (e.port !== v) stat = false
        break;
      default:
        stat = false
        break;
    }
    return stat
  }

  virtualIterate(s: DBConfig, thisIdx: number): DBInfo & { tag: string } | undefined {
    const keys = Object.keys(s)

    if (thisIdx >= keys.length) {
      return undefined
    }
    const sorted = keys.sort()
    return {
      ...s[sorted[thisIdx]],
      tag: sorted[thisIdx]
    }
  }

  virtualStoreProcess(store: DBConfig, elem: DBInfo & { tag: string }): DBConfig {
    const tag = elem.tag
    if (store[tag]) return store
    delete elem.tag
    store[elem.tag] = elem
    return store
  }
}

const p = new DBStore({}, defaultStoreDir, defaultStoreFile)

const nshConnect = async (): Promise<nshResult> => {
  const s = p.getStore()
  const tags = Object.keys(s)
  const tag = tags[selectOne(tags, 'select db target')]
  const client = newDBClient(tag, s[tag])
  return nshSh(client.connect()[0])
}

const nshQuery = async (q?: string): Promise<nshResult> => {
  if (!q) return nshMissingInput()
  const es = p.getElements(q)
  return nshPrint(es)
}

export const plugin: nshPlugin = {
  setStorePath: (path: string) => {
    defaultStoreDir = path
    p.setStoreDir(path)
  },
  info: {
    name: 'DATABASE',
  },
  cmds: new Map([
    [{
      name: 'CONNECT VIA SQL CLIENT',
    }, nshConnect],
    [{
      name: 'QUERY DB INFO'
    }, nshQuery]
  ])
}