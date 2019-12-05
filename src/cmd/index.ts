import * as sshImport from './plugins/ssh'
import * as dbImport from './plugins/db'
import * as pwImport from './plugins/pw'
import * as cmdImport from './command'

export const defaultPlugins = [sshImport.plugin, dbImport.plugin, pwImport.plugin]
export const defaultNsh = () => new cmdImport.Nsh(defaultPlugins)
export const Nsh = cmdImport.Nsh