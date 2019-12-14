import * as sshImport from './plugins/ssh'
import * as dbImport from './plugins/db'
import * as pwImport from './plugins/pw'
import * as manImport from './plugins/man'
import * as PlainImport from './plugins/plain'
import * as WhereisImport from './plugins/whereis'
import * as cmdImport from './command'

export const defaultPlugins = [
  sshImport.plugin,
  dbImport.plugin,
  pwImport.plugin,
  manImport.plugin,
  PlainImport.plugin,
  WhereisImport.plugin,
]
export const defaultNsh = () => new cmdImport.Nsh(defaultPlugins)
export const Nsh = cmdImport.Nsh