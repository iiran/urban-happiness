import { selectOne, readInJSON, foldOutKey } from '../util'


interface SSHConfig {
  [tag: string]: SSHInfo
}

interface SSHInfo {
  host: string
  user: string
}

const loadSSHInfo = async (configPath: string): Promise<Array<SSHInfo & { tag: string }>> => {
  const conf = await readInJSON<SSHConfig>(configPath)
  const infos = foldOutKey(conf,{"tag":"ss"})
  return infos
}

const genSSHCommand = (user: string, host: string) => {
  return `ssh ${user}@${host}`
}

export const ssh = async () => {
  const infos = await loadSSHInfo('conf/ssh.json')
  const idx = await selectOne(infos.map(i => i.tag))
  const sshCmd = genSSHCommand(infos[idx].user, infos[idx].host)
  process.stdout.write(`${sshCmd}\n`)
}