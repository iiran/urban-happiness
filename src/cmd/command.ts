import { readInJSON, c_dot, numHash, writeToJSON, readInJSONBatch, fileCount, mergeTwoObject, selectOne, selectOneWithArgs, deleteFileBatch, rawInputParse, c_comma, createShellScript } from "./util"
import * as Path from 'path'
import * as fs from 'fs'

export interface nshInfo {
  readonly name: string
  readonly help?: string
  readonly desc?: string
}

export enum nshResultType {
  Shell,
  Print,
  Error,
}

export interface nshResult {
  typ: nshResultType,
  val: string
}

export const nshPrint = <T>(p: T): nshResult => {
  let v = ''
  if (['string', 'number', 'boolean'].includes(typeof p)) {
    v = `${p}`
  } else {
    v = JSON.stringify(p, null, 2)
  }
  return {
    typ: nshResultType.Print,
    val: v
  }
}

export const nshOk = (): nshResult => {
  return {
    typ: nshResultType.Print,
    val: 'ok'
  }
}

export const nshMissingInput = (): nshResult => {
  return {
    typ: nshResultType.Error,
    val: 'missing input'
  }
}

export const nshBool = (res: any, errMsg: string): nshResult => {
  return res ? nshOk() : nshErr(errMsg)
}

export const nshSh = (code: string): nshResult => {
  return {
    typ: nshResultType.Shell,
    val: code
  }
}

export const nshErr = (msg: string): nshResult => {
  return {
    typ: nshResultType.Error,
    val: msg,
  }
}

export type nshFunc = (args?: string) => Promise<nshResult>

export const cmdNotFoundFunc: nshFunc = async () => {
  return nshErr('comand not exist')
}

export interface nshPlugin {
  readonly info: nshInfo
  readonly cmds: Map<nshInfo, nshFunc>
  setStorePath(dir: string): void
}

export class BasicStore<Element, Store> {
  private m_suffix: string = 'json'
  private m_store?: Store
  private m_temp_store_merge_delay: number = 3
  private m_store_template: Store
  private m_store_dir: string = ''
  private m_store_filename: string = ''

  private setupSuffix(fileName: string) {
    const name_and_ext = fileName.split(c_dot)
    const ext = name_and_ext.pop()
    if (name_and_ext.length > 1 && ext) this.m_suffix = ext
  }

  setStoreDir(p: string) {
    if (this.m_store_dir === p) return
    this.m_store_dir = p
    this.loadStore()
  }

  constructor(empty_store: Store, store_dir: string, store_filename: string = 'store.json') {
    this.m_store_dir = store_dir
    this.m_store_filename = store_filename.split(c_dot)[0] // todo: a.b.json => a.b
    this.m_store_template = empty_store

    this.setupSuffix(store_filename)
  }

  private getTempFileIdentifyPrefix(): string {
    return this.m_store_filename + c_dot + 'temp'
  }

  private getStableFilePath(): string {
    const statbleFileName = this.m_store_filename + c_dot + this.m_suffix
    return Path.join(this.m_store_dir, statbleFileName)
  }

  private getPreStableFilePath(): string {
    const preStatbleFileName = this.m_store_filename + c_dot + 'new' + c_dot + this.m_suffix
    return Path.join(this.m_store_dir, preStatbleFileName)
  }

  private getTempFilePath(): string {
    const tempFileName = this.getTempFileIdentifyPrefix() + numHash() + c_dot + this.m_suffix
    return Path.join(this.m_store_dir, tempFileName)
  }

  private loadStore(): Store | undefined {
    try {
      this.m_store = readInJSON<Store>(this.getStableFilePath())
    } catch (e) {
      return undefined
    }
    return this.m_store
  }

  getStore(): Store {
    if (this.m_store) return this.m_store
    const loaded = this.loadStore()
    if (loaded) return loaded
    return this.m_store_template
  }

  protected virtualConformQuery(e: Element, k: string, v: string): boolean {
    e = e
    k = k
    v = v
    return false
  }

  protected virtualIterate(s: Store, thisIdx: number): Element | undefined {
    s = s
    thisIdx = thisIdx
    return undefined
  }

  // impl:
  // 1. virtualIterate
  // 2. virtualConformQuery
  getElements(q: string): Element[] {
    let i = 0
    let es: Element[] = []
    let m: Map<string, string>
    try {
      m = rawInputParse(q)
    } catch (e) {
      return []
    }

    for (; ;) {
      const elem = this.virtualIterate(this.getStore(), i)
      if (!elem) {
        break;
      }

      let confrom = true
      try {
        const m = rawInputParse(q)
        m.forEach((v, k) => {
          if (!this.virtualConformQuery(elem, k, v)) {
            throw new Error('failed')
          }
        })
      } catch (e) {
        confrom = false
      }

      if (confrom) es.push(elem)
      i++
    }

    return es
  }

  updatePreStable(): boolean {
    const temps = readInJSONBatch<Store>(this.m_store_dir, this.getTempFileIdentifyPrefix())
    if (temps.length === 0) return true
    let writeData = temps[0]
    if (temps.length >= 2) {
      for (const t of temps.slice(1)) {
        writeData = mergeTwoObject(writeData, t)
      }
    }
    if (fs.existsSync(this.getPreStableFilePath())) {
      const oldPre = readInJSON<Store>(this.getPreStableFilePath())
      writeData = mergeTwoObject(oldPre, writeData)
    }
    const writeOk = writeToJSON(this.getPreStableFilePath(), writeData)
    if (!writeOk) return false
    deleteFileBatch(this.m_store_dir, this.getTempFileIdentifyPrefix())
    return true
  }

  protected virtualStoreProcess(store: Store, elem: Element): Store {
    elem = elem
    return store
  }

  protected virtualNewElement(m: Map<string, string>): Element | undefined {
    m = m
    return undefined
  }

  // impl:
  // 1. virtualNewElement
  insertElement(i: string): boolean {
    const m = rawInputParse(i, c_comma)
    const e = this.virtualNewElement(m)
    if (!e) return false
    return this.insertData(e)
  }

  // impl:
  // 1. virtualStoreProcess
  insertData(data: Element): boolean {
    const p = this.getTempFilePath()
    const writeRes = writeToJSON(p, this.virtualStoreProcess(this.m_store_template, data))
    if (!writeRes) return false

    const tempCount = fileCount(this.m_store_dir, this.getTempFileIdentifyPrefix())
    if (tempCount >= this.m_temp_store_merge_delay) {
      this.updatePreStable()
    }

    return true
  }
}

export class ArrayStore<E> extends BasicStore<E, Array<E>> {
  virtualStoreProcess(store: Array<E>, elem: E): Array<E> {
    store.push(elem)
    return store
  }

  virtualIterate(s: Array<E>, thisIdx: number): E | undefined {
    if (thisIdx >= s.length) return undefined
    return s[thisIdx]
  }
}

export class ArrayStoreWithTopKeyEq<E extends { [key: string]: any }> extends ArrayStore<E> {

  virtualConformQuery(e: E, k: string, v: string): boolean {
    let stat = true
    if (!Object.keys(e).includes(k)) {
      stat = false
    } else if (typeof e[k] === 'string') {
      if (e[k] !== v) stat = false
    } else if (typeof e[k] === 'number') {
      if (e[k] !== Number(v)) stat = false
    } else if (Array.isArray(e[k])) {
      const eka = e[k] as Array<any>
      if (!eka.includes(v)) stat = false
    } else if (typeof e[k] === 'boolean') {
      const lowv = v.toLowerCase()
      if (['false', 'f'].includes(lowv)) {
        if (e[k] !== false) stat = false
      } else if (['true', 't'].includes(lowv)) {
        if (e[k] !== true) stat = false
      } else /* e[k] is {} */ {
        stat = false
      }
    }
    return stat
  }
}

export interface nshManager {
  selectCommand(): nshManager
  execCommand(): Promise<boolean>
}

export class Nsh implements nshManager {
  private m_plugins: nshPlugin[] = []
  private m_curr: number = -1
  private m_runtime_path: string
  private m_store_path: string

  constructor(plugins: nshPlugin[], config: { runtimePath?: string, storePath?: string } = {}) {
    this.m_plugins = plugins
    this.m_runtime_path = config.runtimePath || Path.join(__dirname)
    this.m_store_path = config.storePath || Path.join(__dirname)

    for (const p of this.m_plugins) {
      p.setStorePath(this.m_store_path)
    }
  }

  selectCommand(): Nsh {
    if (this.m_plugins.length == 0) return this
    this.m_curr = selectOne(this.m_plugins.map(p => p.info.name), 'select command: ')
    return this
  }

  async execCommand(): Promise<boolean> {
    let ops = []
    for (const k of this.m_plugins[this.m_curr].cmds.keys()) ops.push(k)

    const [opIdx, args] = selectOneWithArgs(ops.map(o => o.name), 'select operation: ')
    const f = this.m_plugins[this.m_curr].cmds.get(ops[opIdx])

    const res = f ? await f(args) : await cmdNotFoundFunc()

    let newShell = ''
    if (res.typ === nshResultType.Print) { process.stdout.write(res.val) }
    else if (res.typ === nshResultType.Shell) { newShell = res.val }
    else if (res.typ === nshResultType.Error) { process.stderr.write(res.val) }
    createShellScript(Path.join(this.m_runtime_path, 'cmd.sh'), newShell)
    return true
  }
}