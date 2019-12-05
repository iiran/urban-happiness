import { plugin as dbPlugin } from '../src/cmd/plugins/db'
import { plugin as sshPlugin } from '../src/cmd/plugins/ssh'
import { plugin as pwPlugin } from '../src/cmd/plugins/pw'
import { MethodTest, ReportTest } from './util'

const test = async () => {

    const res = await Promise.all([
        MethodTest(() => '', [''], ['']),
    ])
    ReportTest(res)

}

test()