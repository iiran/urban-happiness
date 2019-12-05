import { Nsh, defaultPlugins } from './cmd'

async function main() {
  const nsh = new Nsh(defaultPlugins, { storePath: `store/`, runtimePath: `runtime/` })
  nsh.selectCommand()
  await nsh.execCommand()
}

main()