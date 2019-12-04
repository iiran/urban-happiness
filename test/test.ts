import * as cmd from '../src/cmd'

cmd.ssh()
    .then(()=>cmd.db())
    .finally(()=>process.stdout.write("done"))

