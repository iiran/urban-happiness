import {readInJSON, mergeTwoObject} from "../util";

let _store_cache: PasswordConfig

const defaultConfigPath = 'conf/pw.json'

enum Region {
  CN,
  JP,
  US,
}

interface Phone {
  region: Region
  num: string
}

const getRegionCode = (region: Region) => {
  switch (region) {
    case Region.CN:
      return 86
  }
  return -1;
}

interface QuestionAnswer {
  q: string
  a: string
}

interface ExtraField {
  k: string
  v: string
}

interface Site {
  urls: string[]
  org: string
}

interface PasswordConfig {
  sites: Array<Site>
  accounts: Array<Account>
}

interface Account {
  org: string
  tag?: string
  username?: string
  nickname?: string
  ID?: string
  password?: string
  email?: string
  phone?: Phone
  region?: Region
  payment?: {
    password?: string
  }
  secure?: {
    qa?: QuestionAnswer[]
  }
  extra?: ExtraField[]
}

const loadPasswordStore = async (path: string): Promise<PasswordConfig> => {
  const conf = await readInJSON<PasswordConfig>(path)
  return conf
}

const mergePasswordStore = (cfg: PasswordConfig, tempCfg: PasswordConfig): PasswordConfig => {
  return mergeTwoObject(cfg,tempCfg)
}

const compressPasswordStore = (fatCfg: PasswordConfig): PasswordConfig => {
  return fatCfg
}

const addAccount = async (a: Account):Promise<boolean> => {
  const store = await getPasswordStore()
  store.accounts.push(a)
  return true
}

const getPasswordStore = async (): Promise<PasswordConfig> => {
  if (!_store_cache) {
    _store_cache = await loadPasswordStore(defaultConfigPath)
  }
  return _store_cache
}

export const getAllAccounts = async () => {
  const store = await getPasswordStore()
  return store.accounts
}

export const getSiteAccounts =  (store:PasswordConfig, org: string):Account[] => {
  return store.accounts.filter(a => a.org === org)
}

export const fetchSiteAccounts = async (hint: string): Promise<Account[]> => {
  const store = await getPasswordStore()

  // predict: hint is key
  let hitKey = store.sites.find(s => s.org === hint)
  if (hitKey) {
    return getSiteAccounts(store, hitKey.org)
  }

  // predict: hint in url
  let hitURL = store.sites.find(s => s.urls.includes(hint))
  if (hitURL) {
   return getSiteAccounts(store, hitURL.org)
  }

  // miss
  return []
}
