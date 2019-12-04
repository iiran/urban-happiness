import { selectOne, readInJSON } from '../util'

let showPassword = true

interface DBConfig {
  [tag: string]: DBInfo & { dialect: string }
}

interface DBInfo {
  host: string
  port: string
  user: string
  password: string
  database: string
}

interface DBClient {
  connect(): string
  understand(nickname: string): boolean
  getTag(): string
}

class BaseDB {
  protected tag: string
  protected info: DBInfo

  constructor(tag: string, info: DBInfo) {
    this.tag = tag
    this.info = info
  }

  getTag() {
    return this.tag
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

  connect(): string {
    const cmd = `psql -h ${this.info.host} -p ${this.info.port} -U ${this.info.user} -W ${this.info.database}\n${showPassword ? this.info.password : ''}\n`
    return cmd
  }
}

const newDBClient = (dialect: string, tag: string, info: DBInfo): DBClient => {
  let dbc: DBClient
  if (Postgres.Understand(dialect)) {
    dbc = new Postgres(tag, info)
  } else {
    throw new Error('unknown database type');
  }
  return dbc
}

const loadDBInfo = async (configPath: string): Promise<DBClient[]> => {
  const conf = await readInJSON<DBConfig>(configPath)

  const infos: DBClient[] = Object.keys(conf).map(tag => {
    const dia = conf[tag].dialect
    return newDBClient(dia, tag, conf[tag])
  })

  return infos
}

export const db = async () => {
  const infos = await loadDBInfo('conf/db.json')
  const idx = await selectOne(infos.map(i => i.getTag()))
  const conn = infos[idx].connect()
  process.stdout.write(conn)
}