import * as shell from 'shelljs'

const files = shell.ls('store/').stdout
if (files.length === 0) {
  shell.cp('-r', 'test/store/*', 'store/')
}