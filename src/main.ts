import * as cmd from './cmd'

function main() {
  cmd.getAllAccounts().then(() => {
    //console.log(a)
  }).then(()=> {
    cmd.fetchSiteAccounts('icloud.com').then(v=>{
      console.log(v)
    })
  })
}

main()