export = requelize

declare function requelize(opts: Requelize.Options) : Requelize.Requelize

declare namespace Requelize {
  export interface Options {
    db: string,
    user?: string,
    password?: string,
    discovery?: boolean,
    pool?: boolean,
    buffer?: number,
    max?: number,
    timeout?: number,
    pingInterval?: number,
    timeoutError?: number,
    timeoutGb?: number,
    maxExponent?: number,
    silent?: boolean,
    servers?: Array<ServerOption>,
    optionalRun?: boolean,
    log?: (message: string) => void
  }

  export interface ServerOption {
    host: string,
    port: number
  }

  export interface Requelize {
     r: any,
     model: (name: string, schema: any, modelOpts?: ModelOptions) => typeof Model,
     ready: Ready,
     opts: Options,
     models: Array<Model>,
     RequelizeError: RequelizeError,
     sync: () => Promise<void>
  }

  export interface ModelOptions {
    primaryKey?: string,
    durability?: string,
    shards?: number,
    replicas?: number|Replicas,
    primaryReplicaTag?: string
  }

  export interface Replicas {
    [key: string]: number
  }

  export interface Ready {
    ready: () => Promise<void>,
    modelReady: (model: Model) => Promise<void>
  }

  export class Model {
    private _data: ObjectData
    private _pivot: ObjectData
    private _validate: boolean
    private _saved: boolean
    private _name: string
    private _schema: any
    private _options: ModelOptions
    private _indexes: Array<Index>
    private _virtuals: Array<Virtual>
    private _joins: Array<Join>
    private _events: Array<Requelize.Event>

    public constructor(initialData: ObjectData)

    static ready(): Promise<void>
    static on(event: string, callback: (inst: Model) => void|Promise<Model>): void
    static index(name: string, func?: (doc: any) => Promise<any>, opts?: IndexOptions): void
    static virtual(name: string, func: (inst: Model) => any): void
    static hasOne(model: string, field: string, foreignKey?: string): void
    static hasMany(model: string, field: string, foreignKey?: string): void
    static belongsTo(model: string, field: string, localKey?: string): void
    static belongsToMany(model: string, field: string, through?: string): void
    static customJoinTable(ModelA: string, ModelB: string): void

    private static _relField(foreignKey: string): void
    private static _relModel(foreignKey: string): void
    private static _parse (obj: ObjectData, opts: ParseOptions): Model

    setPivot(modelName: string, data: ObjectData): void
    getPivot(modelName: string): ObjectData
    validate(newValue: boolean): Model
    isSaved(): boolean
    save(): Promise<Model>
    delete(): Promise<Model>
    saveAll(tree: SaveAllTree): Promise<Model>
  }

  export interface Index {
    name: string,
    func?: (doc: any) => Promise<any>,
    opts?: IndexOptions
  }

  export interface Virtual {
    name: string,
    func: (inst: Model) => any
  }

  export interface Join {
    type: string,
    model: string,
    field: string,
    foreignKey?: string,
    localKey?: string,
    tableName?: string
  }

  export interface Event {
    [key: string]: Array<(inst: Model) => void|Promise<Model>>
  }

  export interface IndexOptions {
    multi?: boolean,
    geo?: boolean
  }

  export interface ParseOptions {
    setIsSaved?: boolean
  }

  export interface SaveAllTree {
    [key: string]: boolean|SaveAllTree
  }

  export interface ObjectData {
    [key: string]: any
  }

  export class RequelizeError extends Error {
    name: string,
    details: any
  }
}
