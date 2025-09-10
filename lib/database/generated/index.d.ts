
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model MonitorSession
 * 
 */
export type MonitorSession = $Result.DefaultSelection<Prisma.$MonitorSessionPayload>
/**
 * Model DaemonStatistics
 * 
 */
export type DaemonStatistics = $Result.DefaultSelection<Prisma.$DaemonStatisticsPayload>
/**
 * Model ComponentStatus
 * 
 */
export type ComponentStatus = $Result.DefaultSelection<Prisma.$ComponentStatusPayload>
/**
 * Model RecoveryAction
 * 
 */
export type RecoveryAction = $Result.DefaultSelection<Prisma.$RecoveryActionPayload>
/**
 * Model ConfigurationHistory
 * 
 */
export type ConfigurationHistory = $Result.DefaultSelection<Prisma.$ConfigurationHistoryPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more MonitorSessions
 * const monitorSessions = await prisma.monitorSession.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more MonitorSessions
   * const monitorSessions = await prisma.monitorSession.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.monitorSession`: Exposes CRUD operations for the **MonitorSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MonitorSessions
    * const monitorSessions = await prisma.monitorSession.findMany()
    * ```
    */
  get monitorSession(): Prisma.MonitorSessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.daemonStatistics`: Exposes CRUD operations for the **DaemonStatistics** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DaemonStatistics
    * const daemonStatistics = await prisma.daemonStatistics.findMany()
    * ```
    */
  get daemonStatistics(): Prisma.DaemonStatisticsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.componentStatus`: Exposes CRUD operations for the **ComponentStatus** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ComponentStatuses
    * const componentStatuses = await prisma.componentStatus.findMany()
    * ```
    */
  get componentStatus(): Prisma.ComponentStatusDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.recoveryAction`: Exposes CRUD operations for the **RecoveryAction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RecoveryActions
    * const recoveryActions = await prisma.recoveryAction.findMany()
    * ```
    */
  get recoveryAction(): Prisma.RecoveryActionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.configurationHistory`: Exposes CRUD operations for the **ConfigurationHistory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ConfigurationHistories
    * const configurationHistories = await prisma.configurationHistory.findMany()
    * ```
    */
  get configurationHistory(): Prisma.ConfigurationHistoryDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.16.0
   * Query Engine version: 1c57fdcd7e44b29b9313256c76699e91c3ac3c43
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    MonitorSession: 'MonitorSession',
    DaemonStatistics: 'DaemonStatistics',
    ComponentStatus: 'ComponentStatus',
    RecoveryAction: 'RecoveryAction',
    ConfigurationHistory: 'ConfigurationHistory'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "monitorSession" | "daemonStatistics" | "componentStatus" | "recoveryAction" | "configurationHistory"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      MonitorSession: {
        payload: Prisma.$MonitorSessionPayload<ExtArgs>
        fields: Prisma.MonitorSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MonitorSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MonitorSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload>
          }
          findFirst: {
            args: Prisma.MonitorSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MonitorSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload>
          }
          findMany: {
            args: Prisma.MonitorSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload>[]
          }
          create: {
            args: Prisma.MonitorSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload>
          }
          createMany: {
            args: Prisma.MonitorSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MonitorSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload>[]
          }
          delete: {
            args: Prisma.MonitorSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload>
          }
          update: {
            args: Prisma.MonitorSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload>
          }
          deleteMany: {
            args: Prisma.MonitorSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MonitorSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MonitorSessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload>[]
          }
          upsert: {
            args: Prisma.MonitorSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorSessionPayload>
          }
          aggregate: {
            args: Prisma.MonitorSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMonitorSession>
          }
          groupBy: {
            args: Prisma.MonitorSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<MonitorSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.MonitorSessionCountArgs<ExtArgs>
            result: $Utils.Optional<MonitorSessionCountAggregateOutputType> | number
          }
        }
      }
      DaemonStatistics: {
        payload: Prisma.$DaemonStatisticsPayload<ExtArgs>
        fields: Prisma.DaemonStatisticsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DaemonStatisticsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DaemonStatisticsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload>
          }
          findFirst: {
            args: Prisma.DaemonStatisticsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DaemonStatisticsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload>
          }
          findMany: {
            args: Prisma.DaemonStatisticsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload>[]
          }
          create: {
            args: Prisma.DaemonStatisticsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload>
          }
          createMany: {
            args: Prisma.DaemonStatisticsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DaemonStatisticsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload>[]
          }
          delete: {
            args: Prisma.DaemonStatisticsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload>
          }
          update: {
            args: Prisma.DaemonStatisticsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload>
          }
          deleteMany: {
            args: Prisma.DaemonStatisticsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DaemonStatisticsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DaemonStatisticsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload>[]
          }
          upsert: {
            args: Prisma.DaemonStatisticsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DaemonStatisticsPayload>
          }
          aggregate: {
            args: Prisma.DaemonStatisticsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDaemonStatistics>
          }
          groupBy: {
            args: Prisma.DaemonStatisticsGroupByArgs<ExtArgs>
            result: $Utils.Optional<DaemonStatisticsGroupByOutputType>[]
          }
          count: {
            args: Prisma.DaemonStatisticsCountArgs<ExtArgs>
            result: $Utils.Optional<DaemonStatisticsCountAggregateOutputType> | number
          }
        }
      }
      ComponentStatus: {
        payload: Prisma.$ComponentStatusPayload<ExtArgs>
        fields: Prisma.ComponentStatusFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ComponentStatusFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ComponentStatusFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload>
          }
          findFirst: {
            args: Prisma.ComponentStatusFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ComponentStatusFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload>
          }
          findMany: {
            args: Prisma.ComponentStatusFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload>[]
          }
          create: {
            args: Prisma.ComponentStatusCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload>
          }
          createMany: {
            args: Prisma.ComponentStatusCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ComponentStatusCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload>[]
          }
          delete: {
            args: Prisma.ComponentStatusDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload>
          }
          update: {
            args: Prisma.ComponentStatusUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload>
          }
          deleteMany: {
            args: Prisma.ComponentStatusDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ComponentStatusUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ComponentStatusUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload>[]
          }
          upsert: {
            args: Prisma.ComponentStatusUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComponentStatusPayload>
          }
          aggregate: {
            args: Prisma.ComponentStatusAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateComponentStatus>
          }
          groupBy: {
            args: Prisma.ComponentStatusGroupByArgs<ExtArgs>
            result: $Utils.Optional<ComponentStatusGroupByOutputType>[]
          }
          count: {
            args: Prisma.ComponentStatusCountArgs<ExtArgs>
            result: $Utils.Optional<ComponentStatusCountAggregateOutputType> | number
          }
        }
      }
      RecoveryAction: {
        payload: Prisma.$RecoveryActionPayload<ExtArgs>
        fields: Prisma.RecoveryActionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RecoveryActionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RecoveryActionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload>
          }
          findFirst: {
            args: Prisma.RecoveryActionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RecoveryActionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload>
          }
          findMany: {
            args: Prisma.RecoveryActionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload>[]
          }
          create: {
            args: Prisma.RecoveryActionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload>
          }
          createMany: {
            args: Prisma.RecoveryActionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RecoveryActionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload>[]
          }
          delete: {
            args: Prisma.RecoveryActionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload>
          }
          update: {
            args: Prisma.RecoveryActionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload>
          }
          deleteMany: {
            args: Prisma.RecoveryActionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RecoveryActionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RecoveryActionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload>[]
          }
          upsert: {
            args: Prisma.RecoveryActionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryActionPayload>
          }
          aggregate: {
            args: Prisma.RecoveryActionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRecoveryAction>
          }
          groupBy: {
            args: Prisma.RecoveryActionGroupByArgs<ExtArgs>
            result: $Utils.Optional<RecoveryActionGroupByOutputType>[]
          }
          count: {
            args: Prisma.RecoveryActionCountArgs<ExtArgs>
            result: $Utils.Optional<RecoveryActionCountAggregateOutputType> | number
          }
        }
      }
      ConfigurationHistory: {
        payload: Prisma.$ConfigurationHistoryPayload<ExtArgs>
        fields: Prisma.ConfigurationHistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConfigurationHistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConfigurationHistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload>
          }
          findFirst: {
            args: Prisma.ConfigurationHistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConfigurationHistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload>
          }
          findMany: {
            args: Prisma.ConfigurationHistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload>[]
          }
          create: {
            args: Prisma.ConfigurationHistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload>
          }
          createMany: {
            args: Prisma.ConfigurationHistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConfigurationHistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload>[]
          }
          delete: {
            args: Prisma.ConfigurationHistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload>
          }
          update: {
            args: Prisma.ConfigurationHistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload>
          }
          deleteMany: {
            args: Prisma.ConfigurationHistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConfigurationHistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ConfigurationHistoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload>[]
          }
          upsert: {
            args: Prisma.ConfigurationHistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationHistoryPayload>
          }
          aggregate: {
            args: Prisma.ConfigurationHistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConfigurationHistory>
          }
          groupBy: {
            args: Prisma.ConfigurationHistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConfigurationHistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConfigurationHistoryCountArgs<ExtArgs>
            result: $Utils.Optional<ConfigurationHistoryCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    monitorSession?: MonitorSessionOmit
    daemonStatistics?: DaemonStatisticsOmit
    componentStatus?: ComponentStatusOmit
    recoveryAction?: RecoveryActionOmit
    configurationHistory?: ConfigurationHistoryOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type MonitorSessionCountOutputType
   */

  export type MonitorSessionCountOutputType = {
    components: number
    recoveryActions: number
  }

  export type MonitorSessionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    components?: boolean | MonitorSessionCountOutputTypeCountComponentsArgs
    recoveryActions?: boolean | MonitorSessionCountOutputTypeCountRecoveryActionsArgs
  }

  // Custom InputTypes
  /**
   * MonitorSessionCountOutputType without action
   */
  export type MonitorSessionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSessionCountOutputType
     */
    select?: MonitorSessionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * MonitorSessionCountOutputType without action
   */
  export type MonitorSessionCountOutputTypeCountComponentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ComponentStatusWhereInput
  }

  /**
   * MonitorSessionCountOutputType without action
   */
  export type MonitorSessionCountOutputTypeCountRecoveryActionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecoveryActionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model MonitorSession
   */

  export type AggregateMonitorSession = {
    _count: MonitorSessionCountAggregateOutputType | null
    _avg: MonitorSessionAvgAggregateOutputType | null
    _sum: MonitorSessionSumAggregateOutputType | null
    _min: MonitorSessionMinAggregateOutputType | null
    _max: MonitorSessionMaxAggregateOutputType | null
  }

  export type MonitorSessionAvgAggregateOutputType = {
    consecIdleCount: number | null
    consecActiveCount: number | null
  }

  export type MonitorSessionSumAggregateOutputType = {
    consecIdleCount: number | null
    consecActiveCount: number | null
  }

  export type MonitorSessionMinAggregateOutputType = {
    id: string | null
    startTime: Date | null
    endTime: Date | null
    lastDetectedState: string | null
    lastIdleClearAt: Date | null
    lastIdlePromptAt: Date | null
    pendingBootstrap: boolean | null
    clearCompletedAt: Date | null
    bootstrapCleared: boolean | null
    lastActiveSeenAt: Date | null
    lastPostrunActionAt: Date | null
    lastDecisionTs: Date | null
    idlePeriodCleared: boolean | null
    consecIdleCount: number | null
    consecActiveCount: number | null
    configPath: string | null
    debugMode: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MonitorSessionMaxAggregateOutputType = {
    id: string | null
    startTime: Date | null
    endTime: Date | null
    lastDetectedState: string | null
    lastIdleClearAt: Date | null
    lastIdlePromptAt: Date | null
    pendingBootstrap: boolean | null
    clearCompletedAt: Date | null
    bootstrapCleared: boolean | null
    lastActiveSeenAt: Date | null
    lastPostrunActionAt: Date | null
    lastDecisionTs: Date | null
    idlePeriodCleared: boolean | null
    consecIdleCount: number | null
    consecActiveCount: number | null
    configPath: string | null
    debugMode: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MonitorSessionCountAggregateOutputType = {
    id: number
    startTime: number
    endTime: number
    lastDetectedState: number
    lastIdleClearAt: number
    lastIdlePromptAt: number
    pendingBootstrap: number
    clearCompletedAt: number
    bootstrapCleared: number
    lastActiveSeenAt: number
    lastPostrunActionAt: number
    lastDecisionTs: number
    idlePeriodCleared: number
    consecIdleCount: number
    consecActiveCount: number
    configPath: number
    debugMode: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type MonitorSessionAvgAggregateInputType = {
    consecIdleCount?: true
    consecActiveCount?: true
  }

  export type MonitorSessionSumAggregateInputType = {
    consecIdleCount?: true
    consecActiveCount?: true
  }

  export type MonitorSessionMinAggregateInputType = {
    id?: true
    startTime?: true
    endTime?: true
    lastDetectedState?: true
    lastIdleClearAt?: true
    lastIdlePromptAt?: true
    pendingBootstrap?: true
    clearCompletedAt?: true
    bootstrapCleared?: true
    lastActiveSeenAt?: true
    lastPostrunActionAt?: true
    lastDecisionTs?: true
    idlePeriodCleared?: true
    consecIdleCount?: true
    consecActiveCount?: true
    configPath?: true
    debugMode?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MonitorSessionMaxAggregateInputType = {
    id?: true
    startTime?: true
    endTime?: true
    lastDetectedState?: true
    lastIdleClearAt?: true
    lastIdlePromptAt?: true
    pendingBootstrap?: true
    clearCompletedAt?: true
    bootstrapCleared?: true
    lastActiveSeenAt?: true
    lastPostrunActionAt?: true
    lastDecisionTs?: true
    idlePeriodCleared?: true
    consecIdleCount?: true
    consecActiveCount?: true
    configPath?: true
    debugMode?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MonitorSessionCountAggregateInputType = {
    id?: true
    startTime?: true
    endTime?: true
    lastDetectedState?: true
    lastIdleClearAt?: true
    lastIdlePromptAt?: true
    pendingBootstrap?: true
    clearCompletedAt?: true
    bootstrapCleared?: true
    lastActiveSeenAt?: true
    lastPostrunActionAt?: true
    lastDecisionTs?: true
    idlePeriodCleared?: true
    consecIdleCount?: true
    consecActiveCount?: true
    configPath?: true
    debugMode?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type MonitorSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorSession to aggregate.
     */
    where?: MonitorSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorSessions to fetch.
     */
    orderBy?: MonitorSessionOrderByWithRelationInput | MonitorSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MonitorSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MonitorSessions
    **/
    _count?: true | MonitorSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MonitorSessionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MonitorSessionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MonitorSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MonitorSessionMaxAggregateInputType
  }

  export type GetMonitorSessionAggregateType<T extends MonitorSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateMonitorSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMonitorSession[P]>
      : GetScalarType<T[P], AggregateMonitorSession[P]>
  }




  export type MonitorSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MonitorSessionWhereInput
    orderBy?: MonitorSessionOrderByWithAggregationInput | MonitorSessionOrderByWithAggregationInput[]
    by: MonitorSessionScalarFieldEnum[] | MonitorSessionScalarFieldEnum
    having?: MonitorSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MonitorSessionCountAggregateInputType | true
    _avg?: MonitorSessionAvgAggregateInputType
    _sum?: MonitorSessionSumAggregateInputType
    _min?: MonitorSessionMinAggregateInputType
    _max?: MonitorSessionMaxAggregateInputType
  }

  export type MonitorSessionGroupByOutputType = {
    id: string
    startTime: Date
    endTime: Date | null
    lastDetectedState: string
    lastIdleClearAt: Date | null
    lastIdlePromptAt: Date | null
    pendingBootstrap: boolean
    clearCompletedAt: Date | null
    bootstrapCleared: boolean
    lastActiveSeenAt: Date | null
    lastPostrunActionAt: Date | null
    lastDecisionTs: Date | null
    idlePeriodCleared: boolean
    consecIdleCount: number
    consecActiveCount: number
    configPath: string | null
    debugMode: boolean
    createdAt: Date
    updatedAt: Date
    _count: MonitorSessionCountAggregateOutputType | null
    _avg: MonitorSessionAvgAggregateOutputType | null
    _sum: MonitorSessionSumAggregateOutputType | null
    _min: MonitorSessionMinAggregateOutputType | null
    _max: MonitorSessionMaxAggregateOutputType | null
  }

  type GetMonitorSessionGroupByPayload<T extends MonitorSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MonitorSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MonitorSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MonitorSessionGroupByOutputType[P]>
            : GetScalarType<T[P], MonitorSessionGroupByOutputType[P]>
        }
      >
    >


  export type MonitorSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    startTime?: boolean
    endTime?: boolean
    lastDetectedState?: boolean
    lastIdleClearAt?: boolean
    lastIdlePromptAt?: boolean
    pendingBootstrap?: boolean
    clearCompletedAt?: boolean
    bootstrapCleared?: boolean
    lastActiveSeenAt?: boolean
    lastPostrunActionAt?: boolean
    lastDecisionTs?: boolean
    idlePeriodCleared?: boolean
    consecIdleCount?: boolean
    consecActiveCount?: boolean
    configPath?: boolean
    debugMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    statistics?: boolean | MonitorSession$statisticsArgs<ExtArgs>
    components?: boolean | MonitorSession$componentsArgs<ExtArgs>
    recoveryActions?: boolean | MonitorSession$recoveryActionsArgs<ExtArgs>
    _count?: boolean | MonitorSessionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["monitorSession"]>

  export type MonitorSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    startTime?: boolean
    endTime?: boolean
    lastDetectedState?: boolean
    lastIdleClearAt?: boolean
    lastIdlePromptAt?: boolean
    pendingBootstrap?: boolean
    clearCompletedAt?: boolean
    bootstrapCleared?: boolean
    lastActiveSeenAt?: boolean
    lastPostrunActionAt?: boolean
    lastDecisionTs?: boolean
    idlePeriodCleared?: boolean
    consecIdleCount?: boolean
    consecActiveCount?: boolean
    configPath?: boolean
    debugMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorSession"]>

  export type MonitorSessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    startTime?: boolean
    endTime?: boolean
    lastDetectedState?: boolean
    lastIdleClearAt?: boolean
    lastIdlePromptAt?: boolean
    pendingBootstrap?: boolean
    clearCompletedAt?: boolean
    bootstrapCleared?: boolean
    lastActiveSeenAt?: boolean
    lastPostrunActionAt?: boolean
    lastDecisionTs?: boolean
    idlePeriodCleared?: boolean
    consecIdleCount?: boolean
    consecActiveCount?: boolean
    configPath?: boolean
    debugMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorSession"]>

  export type MonitorSessionSelectScalar = {
    id?: boolean
    startTime?: boolean
    endTime?: boolean
    lastDetectedState?: boolean
    lastIdleClearAt?: boolean
    lastIdlePromptAt?: boolean
    pendingBootstrap?: boolean
    clearCompletedAt?: boolean
    bootstrapCleared?: boolean
    lastActiveSeenAt?: boolean
    lastPostrunActionAt?: boolean
    lastDecisionTs?: boolean
    idlePeriodCleared?: boolean
    consecIdleCount?: boolean
    consecActiveCount?: boolean
    configPath?: boolean
    debugMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type MonitorSessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "startTime" | "endTime" | "lastDetectedState" | "lastIdleClearAt" | "lastIdlePromptAt" | "pendingBootstrap" | "clearCompletedAt" | "bootstrapCleared" | "lastActiveSeenAt" | "lastPostrunActionAt" | "lastDecisionTs" | "idlePeriodCleared" | "consecIdleCount" | "consecActiveCount" | "configPath" | "debugMode" | "createdAt" | "updatedAt", ExtArgs["result"]["monitorSession"]>
  export type MonitorSessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    statistics?: boolean | MonitorSession$statisticsArgs<ExtArgs>
    components?: boolean | MonitorSession$componentsArgs<ExtArgs>
    recoveryActions?: boolean | MonitorSession$recoveryActionsArgs<ExtArgs>
    _count?: boolean | MonitorSessionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type MonitorSessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type MonitorSessionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $MonitorSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MonitorSession"
    objects: {
      statistics: Prisma.$DaemonStatisticsPayload<ExtArgs> | null
      components: Prisma.$ComponentStatusPayload<ExtArgs>[]
      recoveryActions: Prisma.$RecoveryActionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      startTime: Date
      endTime: Date | null
      lastDetectedState: string
      lastIdleClearAt: Date | null
      lastIdlePromptAt: Date | null
      pendingBootstrap: boolean
      clearCompletedAt: Date | null
      bootstrapCleared: boolean
      lastActiveSeenAt: Date | null
      lastPostrunActionAt: Date | null
      lastDecisionTs: Date | null
      idlePeriodCleared: boolean
      consecIdleCount: number
      consecActiveCount: number
      configPath: string | null
      debugMode: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["monitorSession"]>
    composites: {}
  }

  type MonitorSessionGetPayload<S extends boolean | null | undefined | MonitorSessionDefaultArgs> = $Result.GetResult<Prisma.$MonitorSessionPayload, S>

  type MonitorSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MonitorSessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MonitorSessionCountAggregateInputType | true
    }

  export interface MonitorSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MonitorSession'], meta: { name: 'MonitorSession' } }
    /**
     * Find zero or one MonitorSession that matches the filter.
     * @param {MonitorSessionFindUniqueArgs} args - Arguments to find a MonitorSession
     * @example
     * // Get one MonitorSession
     * const monitorSession = await prisma.monitorSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MonitorSessionFindUniqueArgs>(args: SelectSubset<T, MonitorSessionFindUniqueArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MonitorSession that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MonitorSessionFindUniqueOrThrowArgs} args - Arguments to find a MonitorSession
     * @example
     * // Get one MonitorSession
     * const monitorSession = await prisma.monitorSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MonitorSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, MonitorSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorSessionFindFirstArgs} args - Arguments to find a MonitorSession
     * @example
     * // Get one MonitorSession
     * const monitorSession = await prisma.monitorSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MonitorSessionFindFirstArgs>(args?: SelectSubset<T, MonitorSessionFindFirstArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorSessionFindFirstOrThrowArgs} args - Arguments to find a MonitorSession
     * @example
     * // Get one MonitorSession
     * const monitorSession = await prisma.monitorSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MonitorSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, MonitorSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MonitorSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MonitorSessions
     * const monitorSessions = await prisma.monitorSession.findMany()
     * 
     * // Get first 10 MonitorSessions
     * const monitorSessions = await prisma.monitorSession.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const monitorSessionWithIdOnly = await prisma.monitorSession.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MonitorSessionFindManyArgs>(args?: SelectSubset<T, MonitorSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MonitorSession.
     * @param {MonitorSessionCreateArgs} args - Arguments to create a MonitorSession.
     * @example
     * // Create one MonitorSession
     * const MonitorSession = await prisma.monitorSession.create({
     *   data: {
     *     // ... data to create a MonitorSession
     *   }
     * })
     * 
     */
    create<T extends MonitorSessionCreateArgs>(args: SelectSubset<T, MonitorSessionCreateArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MonitorSessions.
     * @param {MonitorSessionCreateManyArgs} args - Arguments to create many MonitorSessions.
     * @example
     * // Create many MonitorSessions
     * const monitorSession = await prisma.monitorSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MonitorSessionCreateManyArgs>(args?: SelectSubset<T, MonitorSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MonitorSessions and returns the data saved in the database.
     * @param {MonitorSessionCreateManyAndReturnArgs} args - Arguments to create many MonitorSessions.
     * @example
     * // Create many MonitorSessions
     * const monitorSession = await prisma.monitorSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MonitorSessions and only return the `id`
     * const monitorSessionWithIdOnly = await prisma.monitorSession.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MonitorSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, MonitorSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MonitorSession.
     * @param {MonitorSessionDeleteArgs} args - Arguments to delete one MonitorSession.
     * @example
     * // Delete one MonitorSession
     * const MonitorSession = await prisma.monitorSession.delete({
     *   where: {
     *     // ... filter to delete one MonitorSession
     *   }
     * })
     * 
     */
    delete<T extends MonitorSessionDeleteArgs>(args: SelectSubset<T, MonitorSessionDeleteArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MonitorSession.
     * @param {MonitorSessionUpdateArgs} args - Arguments to update one MonitorSession.
     * @example
     * // Update one MonitorSession
     * const monitorSession = await prisma.monitorSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MonitorSessionUpdateArgs>(args: SelectSubset<T, MonitorSessionUpdateArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MonitorSessions.
     * @param {MonitorSessionDeleteManyArgs} args - Arguments to filter MonitorSessions to delete.
     * @example
     * // Delete a few MonitorSessions
     * const { count } = await prisma.monitorSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MonitorSessionDeleteManyArgs>(args?: SelectSubset<T, MonitorSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MonitorSessions
     * const monitorSession = await prisma.monitorSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MonitorSessionUpdateManyArgs>(args: SelectSubset<T, MonitorSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorSessions and returns the data updated in the database.
     * @param {MonitorSessionUpdateManyAndReturnArgs} args - Arguments to update many MonitorSessions.
     * @example
     * // Update many MonitorSessions
     * const monitorSession = await prisma.monitorSession.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MonitorSessions and only return the `id`
     * const monitorSessionWithIdOnly = await prisma.monitorSession.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MonitorSessionUpdateManyAndReturnArgs>(args: SelectSubset<T, MonitorSessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MonitorSession.
     * @param {MonitorSessionUpsertArgs} args - Arguments to update or create a MonitorSession.
     * @example
     * // Update or create a MonitorSession
     * const monitorSession = await prisma.monitorSession.upsert({
     *   create: {
     *     // ... data to create a MonitorSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MonitorSession we want to update
     *   }
     * })
     */
    upsert<T extends MonitorSessionUpsertArgs>(args: SelectSubset<T, MonitorSessionUpsertArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MonitorSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorSessionCountArgs} args - Arguments to filter MonitorSessions to count.
     * @example
     * // Count the number of MonitorSessions
     * const count = await prisma.monitorSession.count({
     *   where: {
     *     // ... the filter for the MonitorSessions we want to count
     *   }
     * })
    **/
    count<T extends MonitorSessionCountArgs>(
      args?: Subset<T, MonitorSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MonitorSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MonitorSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MonitorSessionAggregateArgs>(args: Subset<T, MonitorSessionAggregateArgs>): Prisma.PrismaPromise<GetMonitorSessionAggregateType<T>>

    /**
     * Group by MonitorSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorSessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MonitorSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MonitorSessionGroupByArgs['orderBy'] }
        : { orderBy?: MonitorSessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MonitorSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMonitorSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MonitorSession model
   */
  readonly fields: MonitorSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MonitorSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MonitorSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    statistics<T extends MonitorSession$statisticsArgs<ExtArgs> = {}>(args?: Subset<T, MonitorSession$statisticsArgs<ExtArgs>>): Prisma__DaemonStatisticsClient<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    components<T extends MonitorSession$componentsArgs<ExtArgs> = {}>(args?: Subset<T, MonitorSession$componentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    recoveryActions<T extends MonitorSession$recoveryActionsArgs<ExtArgs> = {}>(args?: Subset<T, MonitorSession$recoveryActionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MonitorSession model
   */
  interface MonitorSessionFieldRefs {
    readonly id: FieldRef<"MonitorSession", 'String'>
    readonly startTime: FieldRef<"MonitorSession", 'DateTime'>
    readonly endTime: FieldRef<"MonitorSession", 'DateTime'>
    readonly lastDetectedState: FieldRef<"MonitorSession", 'String'>
    readonly lastIdleClearAt: FieldRef<"MonitorSession", 'DateTime'>
    readonly lastIdlePromptAt: FieldRef<"MonitorSession", 'DateTime'>
    readonly pendingBootstrap: FieldRef<"MonitorSession", 'Boolean'>
    readonly clearCompletedAt: FieldRef<"MonitorSession", 'DateTime'>
    readonly bootstrapCleared: FieldRef<"MonitorSession", 'Boolean'>
    readonly lastActiveSeenAt: FieldRef<"MonitorSession", 'DateTime'>
    readonly lastPostrunActionAt: FieldRef<"MonitorSession", 'DateTime'>
    readonly lastDecisionTs: FieldRef<"MonitorSession", 'DateTime'>
    readonly idlePeriodCleared: FieldRef<"MonitorSession", 'Boolean'>
    readonly consecIdleCount: FieldRef<"MonitorSession", 'Int'>
    readonly consecActiveCount: FieldRef<"MonitorSession", 'Int'>
    readonly configPath: FieldRef<"MonitorSession", 'String'>
    readonly debugMode: FieldRef<"MonitorSession", 'Boolean'>
    readonly createdAt: FieldRef<"MonitorSession", 'DateTime'>
    readonly updatedAt: FieldRef<"MonitorSession", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MonitorSession findUnique
   */
  export type MonitorSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorSessionInclude<ExtArgs> | null
    /**
     * Filter, which MonitorSession to fetch.
     */
    where: MonitorSessionWhereUniqueInput
  }

  /**
   * MonitorSession findUniqueOrThrow
   */
  export type MonitorSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorSessionInclude<ExtArgs> | null
    /**
     * Filter, which MonitorSession to fetch.
     */
    where: MonitorSessionWhereUniqueInput
  }

  /**
   * MonitorSession findFirst
   */
  export type MonitorSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorSessionInclude<ExtArgs> | null
    /**
     * Filter, which MonitorSession to fetch.
     */
    where?: MonitorSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorSessions to fetch.
     */
    orderBy?: MonitorSessionOrderByWithRelationInput | MonitorSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorSessions.
     */
    cursor?: MonitorSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorSessions.
     */
    distinct?: MonitorSessionScalarFieldEnum | MonitorSessionScalarFieldEnum[]
  }

  /**
   * MonitorSession findFirstOrThrow
   */
  export type MonitorSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorSessionInclude<ExtArgs> | null
    /**
     * Filter, which MonitorSession to fetch.
     */
    where?: MonitorSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorSessions to fetch.
     */
    orderBy?: MonitorSessionOrderByWithRelationInput | MonitorSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorSessions.
     */
    cursor?: MonitorSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorSessions.
     */
    distinct?: MonitorSessionScalarFieldEnum | MonitorSessionScalarFieldEnum[]
  }

  /**
   * MonitorSession findMany
   */
  export type MonitorSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorSessionInclude<ExtArgs> | null
    /**
     * Filter, which MonitorSessions to fetch.
     */
    where?: MonitorSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorSessions to fetch.
     */
    orderBy?: MonitorSessionOrderByWithRelationInput | MonitorSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MonitorSessions.
     */
    cursor?: MonitorSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorSessions.
     */
    skip?: number
    distinct?: MonitorSessionScalarFieldEnum | MonitorSessionScalarFieldEnum[]
  }

  /**
   * MonitorSession create
   */
  export type MonitorSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorSessionInclude<ExtArgs> | null
    /**
     * The data needed to create a MonitorSession.
     */
    data: XOR<MonitorSessionCreateInput, MonitorSessionUncheckedCreateInput>
  }

  /**
   * MonitorSession createMany
   */
  export type MonitorSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MonitorSessions.
     */
    data: MonitorSessionCreateManyInput | MonitorSessionCreateManyInput[]
  }

  /**
   * MonitorSession createManyAndReturn
   */
  export type MonitorSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * The data used to create many MonitorSessions.
     */
    data: MonitorSessionCreateManyInput | MonitorSessionCreateManyInput[]
  }

  /**
   * MonitorSession update
   */
  export type MonitorSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorSessionInclude<ExtArgs> | null
    /**
     * The data needed to update a MonitorSession.
     */
    data: XOR<MonitorSessionUpdateInput, MonitorSessionUncheckedUpdateInput>
    /**
     * Choose, which MonitorSession to update.
     */
    where: MonitorSessionWhereUniqueInput
  }

  /**
   * MonitorSession updateMany
   */
  export type MonitorSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MonitorSessions.
     */
    data: XOR<MonitorSessionUpdateManyMutationInput, MonitorSessionUncheckedUpdateManyInput>
    /**
     * Filter which MonitorSessions to update
     */
    where?: MonitorSessionWhereInput
    /**
     * Limit how many MonitorSessions to update.
     */
    limit?: number
  }

  /**
   * MonitorSession updateManyAndReturn
   */
  export type MonitorSessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * The data used to update MonitorSessions.
     */
    data: XOR<MonitorSessionUpdateManyMutationInput, MonitorSessionUncheckedUpdateManyInput>
    /**
     * Filter which MonitorSessions to update
     */
    where?: MonitorSessionWhereInput
    /**
     * Limit how many MonitorSessions to update.
     */
    limit?: number
  }

  /**
   * MonitorSession upsert
   */
  export type MonitorSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorSessionInclude<ExtArgs> | null
    /**
     * The filter to search for the MonitorSession to update in case it exists.
     */
    where: MonitorSessionWhereUniqueInput
    /**
     * In case the MonitorSession found by the `where` argument doesn't exist, create a new MonitorSession with this data.
     */
    create: XOR<MonitorSessionCreateInput, MonitorSessionUncheckedCreateInput>
    /**
     * In case the MonitorSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MonitorSessionUpdateInput, MonitorSessionUncheckedUpdateInput>
  }

  /**
   * MonitorSession delete
   */
  export type MonitorSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorSessionInclude<ExtArgs> | null
    /**
     * Filter which MonitorSession to delete.
     */
    where: MonitorSessionWhereUniqueInput
  }

  /**
   * MonitorSession deleteMany
   */
  export type MonitorSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorSessions to delete
     */
    where?: MonitorSessionWhereInput
    /**
     * Limit how many MonitorSessions to delete.
     */
    limit?: number
  }

  /**
   * MonitorSession.statistics
   */
  export type MonitorSession$statisticsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
    where?: DaemonStatisticsWhereInput
  }

  /**
   * MonitorSession.components
   */
  export type MonitorSession$componentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
    where?: ComponentStatusWhereInput
    orderBy?: ComponentStatusOrderByWithRelationInput | ComponentStatusOrderByWithRelationInput[]
    cursor?: ComponentStatusWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ComponentStatusScalarFieldEnum | ComponentStatusScalarFieldEnum[]
  }

  /**
   * MonitorSession.recoveryActions
   */
  export type MonitorSession$recoveryActionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
    where?: RecoveryActionWhereInput
    orderBy?: RecoveryActionOrderByWithRelationInput | RecoveryActionOrderByWithRelationInput[]
    cursor?: RecoveryActionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RecoveryActionScalarFieldEnum | RecoveryActionScalarFieldEnum[]
  }

  /**
   * MonitorSession without action
   */
  export type MonitorSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorSession
     */
    select?: MonitorSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorSession
     */
    omit?: MonitorSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorSessionInclude<ExtArgs> | null
  }


  /**
   * Model DaemonStatistics
   */

  export type AggregateDaemonStatistics = {
    _count: DaemonStatisticsCountAggregateOutputType | null
    _avg: DaemonStatisticsAvgAggregateOutputType | null
    _sum: DaemonStatisticsSumAggregateOutputType | null
    _min: DaemonStatisticsMinAggregateOutputType | null
    _max: DaemonStatisticsMaxAggregateOutputType | null
  }

  export type DaemonStatisticsAvgAggregateOutputType = {
    uptimeSeconds: number | null
    restarts: number | null
    configReloads: number | null
    totalDetections: number | null
    totalRecoveries: number | null
    errors: number | null
    decisionMinIntervalSec: number | null
    clearCompletionFallbackSec: number | null
    consecIdleRequired: number | null
    inactivityIdleSec: number | null
    minRecoveryIntervalSec: number | null
  }

  export type DaemonStatisticsSumAggregateOutputType = {
    uptimeSeconds: number | null
    restarts: number | null
    configReloads: number | null
    totalDetections: number | null
    totalRecoveries: number | null
    errors: number | null
    decisionMinIntervalSec: number | null
    clearCompletionFallbackSec: number | null
    consecIdleRequired: number | null
    inactivityIdleSec: number | null
    minRecoveryIntervalSec: number | null
  }

  export type DaemonStatisticsMinAggregateOutputType = {
    id: string | null
    sessionId: string | null
    startTime: Date | null
    uptimeSeconds: number | null
    restarts: number | null
    configReloads: number | null
    totalDetections: number | null
    totalRecoveries: number | null
    errors: number | null
    decisionMinIntervalSec: number | null
    clearCompletionFallbackSec: number | null
    consecIdleRequired: number | null
    inactivityIdleSec: number | null
    minRecoveryIntervalSec: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DaemonStatisticsMaxAggregateOutputType = {
    id: string | null
    sessionId: string | null
    startTime: Date | null
    uptimeSeconds: number | null
    restarts: number | null
    configReloads: number | null
    totalDetections: number | null
    totalRecoveries: number | null
    errors: number | null
    decisionMinIntervalSec: number | null
    clearCompletionFallbackSec: number | null
    consecIdleRequired: number | null
    inactivityIdleSec: number | null
    minRecoveryIntervalSec: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DaemonStatisticsCountAggregateOutputType = {
    id: number
    sessionId: number
    startTime: number
    uptimeSeconds: number
    restarts: number
    configReloads: number
    totalDetections: number
    totalRecoveries: number
    errors: number
    decisionMinIntervalSec: number
    clearCompletionFallbackSec: number
    consecIdleRequired: number
    inactivityIdleSec: number
    minRecoveryIntervalSec: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type DaemonStatisticsAvgAggregateInputType = {
    uptimeSeconds?: true
    restarts?: true
    configReloads?: true
    totalDetections?: true
    totalRecoveries?: true
    errors?: true
    decisionMinIntervalSec?: true
    clearCompletionFallbackSec?: true
    consecIdleRequired?: true
    inactivityIdleSec?: true
    minRecoveryIntervalSec?: true
  }

  export type DaemonStatisticsSumAggregateInputType = {
    uptimeSeconds?: true
    restarts?: true
    configReloads?: true
    totalDetections?: true
    totalRecoveries?: true
    errors?: true
    decisionMinIntervalSec?: true
    clearCompletionFallbackSec?: true
    consecIdleRequired?: true
    inactivityIdleSec?: true
    minRecoveryIntervalSec?: true
  }

  export type DaemonStatisticsMinAggregateInputType = {
    id?: true
    sessionId?: true
    startTime?: true
    uptimeSeconds?: true
    restarts?: true
    configReloads?: true
    totalDetections?: true
    totalRecoveries?: true
    errors?: true
    decisionMinIntervalSec?: true
    clearCompletionFallbackSec?: true
    consecIdleRequired?: true
    inactivityIdleSec?: true
    minRecoveryIntervalSec?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DaemonStatisticsMaxAggregateInputType = {
    id?: true
    sessionId?: true
    startTime?: true
    uptimeSeconds?: true
    restarts?: true
    configReloads?: true
    totalDetections?: true
    totalRecoveries?: true
    errors?: true
    decisionMinIntervalSec?: true
    clearCompletionFallbackSec?: true
    consecIdleRequired?: true
    inactivityIdleSec?: true
    minRecoveryIntervalSec?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DaemonStatisticsCountAggregateInputType = {
    id?: true
    sessionId?: true
    startTime?: true
    uptimeSeconds?: true
    restarts?: true
    configReloads?: true
    totalDetections?: true
    totalRecoveries?: true
    errors?: true
    decisionMinIntervalSec?: true
    clearCompletionFallbackSec?: true
    consecIdleRequired?: true
    inactivityIdleSec?: true
    minRecoveryIntervalSec?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DaemonStatisticsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DaemonStatistics to aggregate.
     */
    where?: DaemonStatisticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DaemonStatistics to fetch.
     */
    orderBy?: DaemonStatisticsOrderByWithRelationInput | DaemonStatisticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DaemonStatisticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DaemonStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DaemonStatistics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DaemonStatistics
    **/
    _count?: true | DaemonStatisticsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DaemonStatisticsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DaemonStatisticsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DaemonStatisticsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DaemonStatisticsMaxAggregateInputType
  }

  export type GetDaemonStatisticsAggregateType<T extends DaemonStatisticsAggregateArgs> = {
        [P in keyof T & keyof AggregateDaemonStatistics]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDaemonStatistics[P]>
      : GetScalarType<T[P], AggregateDaemonStatistics[P]>
  }




  export type DaemonStatisticsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DaemonStatisticsWhereInput
    orderBy?: DaemonStatisticsOrderByWithAggregationInput | DaemonStatisticsOrderByWithAggregationInput[]
    by: DaemonStatisticsScalarFieldEnum[] | DaemonStatisticsScalarFieldEnum
    having?: DaemonStatisticsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DaemonStatisticsCountAggregateInputType | true
    _avg?: DaemonStatisticsAvgAggregateInputType
    _sum?: DaemonStatisticsSumAggregateInputType
    _min?: DaemonStatisticsMinAggregateInputType
    _max?: DaemonStatisticsMaxAggregateInputType
  }

  export type DaemonStatisticsGroupByOutputType = {
    id: string
    sessionId: string
    startTime: Date
    uptimeSeconds: number
    restarts: number
    configReloads: number
    totalDetections: number
    totalRecoveries: number
    errors: number
    decisionMinIntervalSec: number
    clearCompletionFallbackSec: number
    consecIdleRequired: number
    inactivityIdleSec: number
    minRecoveryIntervalSec: number
    createdAt: Date
    updatedAt: Date
    _count: DaemonStatisticsCountAggregateOutputType | null
    _avg: DaemonStatisticsAvgAggregateOutputType | null
    _sum: DaemonStatisticsSumAggregateOutputType | null
    _min: DaemonStatisticsMinAggregateOutputType | null
    _max: DaemonStatisticsMaxAggregateOutputType | null
  }

  type GetDaemonStatisticsGroupByPayload<T extends DaemonStatisticsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DaemonStatisticsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DaemonStatisticsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DaemonStatisticsGroupByOutputType[P]>
            : GetScalarType<T[P], DaemonStatisticsGroupByOutputType[P]>
        }
      >
    >


  export type DaemonStatisticsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    startTime?: boolean
    uptimeSeconds?: boolean
    restarts?: boolean
    configReloads?: boolean
    totalDetections?: boolean
    totalRecoveries?: boolean
    errors?: boolean
    decisionMinIntervalSec?: boolean
    clearCompletionFallbackSec?: boolean
    consecIdleRequired?: boolean
    inactivityIdleSec?: boolean
    minRecoveryIntervalSec?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["daemonStatistics"]>

  export type DaemonStatisticsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    startTime?: boolean
    uptimeSeconds?: boolean
    restarts?: boolean
    configReloads?: boolean
    totalDetections?: boolean
    totalRecoveries?: boolean
    errors?: boolean
    decisionMinIntervalSec?: boolean
    clearCompletionFallbackSec?: boolean
    consecIdleRequired?: boolean
    inactivityIdleSec?: boolean
    minRecoveryIntervalSec?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["daemonStatistics"]>

  export type DaemonStatisticsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    startTime?: boolean
    uptimeSeconds?: boolean
    restarts?: boolean
    configReloads?: boolean
    totalDetections?: boolean
    totalRecoveries?: boolean
    errors?: boolean
    decisionMinIntervalSec?: boolean
    clearCompletionFallbackSec?: boolean
    consecIdleRequired?: boolean
    inactivityIdleSec?: boolean
    minRecoveryIntervalSec?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["daemonStatistics"]>

  export type DaemonStatisticsSelectScalar = {
    id?: boolean
    sessionId?: boolean
    startTime?: boolean
    uptimeSeconds?: boolean
    restarts?: boolean
    configReloads?: boolean
    totalDetections?: boolean
    totalRecoveries?: boolean
    errors?: boolean
    decisionMinIntervalSec?: boolean
    clearCompletionFallbackSec?: boolean
    consecIdleRequired?: boolean
    inactivityIdleSec?: boolean
    minRecoveryIntervalSec?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type DaemonStatisticsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sessionId" | "startTime" | "uptimeSeconds" | "restarts" | "configReloads" | "totalDetections" | "totalRecoveries" | "errors" | "decisionMinIntervalSec" | "clearCompletionFallbackSec" | "consecIdleRequired" | "inactivityIdleSec" | "minRecoveryIntervalSec" | "createdAt" | "updatedAt", ExtArgs["result"]["daemonStatistics"]>
  export type DaemonStatisticsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }
  export type DaemonStatisticsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }
  export type DaemonStatisticsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }

  export type $DaemonStatisticsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DaemonStatistics"
    objects: {
      session: Prisma.$MonitorSessionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sessionId: string
      startTime: Date
      uptimeSeconds: number
      restarts: number
      configReloads: number
      totalDetections: number
      totalRecoveries: number
      errors: number
      decisionMinIntervalSec: number
      clearCompletionFallbackSec: number
      consecIdleRequired: number
      inactivityIdleSec: number
      minRecoveryIntervalSec: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["daemonStatistics"]>
    composites: {}
  }

  type DaemonStatisticsGetPayload<S extends boolean | null | undefined | DaemonStatisticsDefaultArgs> = $Result.GetResult<Prisma.$DaemonStatisticsPayload, S>

  type DaemonStatisticsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DaemonStatisticsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DaemonStatisticsCountAggregateInputType | true
    }

  export interface DaemonStatisticsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DaemonStatistics'], meta: { name: 'DaemonStatistics' } }
    /**
     * Find zero or one DaemonStatistics that matches the filter.
     * @param {DaemonStatisticsFindUniqueArgs} args - Arguments to find a DaemonStatistics
     * @example
     * // Get one DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DaemonStatisticsFindUniqueArgs>(args: SelectSubset<T, DaemonStatisticsFindUniqueArgs<ExtArgs>>): Prisma__DaemonStatisticsClient<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one DaemonStatistics that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DaemonStatisticsFindUniqueOrThrowArgs} args - Arguments to find a DaemonStatistics
     * @example
     * // Get one DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DaemonStatisticsFindUniqueOrThrowArgs>(args: SelectSubset<T, DaemonStatisticsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DaemonStatisticsClient<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DaemonStatistics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DaemonStatisticsFindFirstArgs} args - Arguments to find a DaemonStatistics
     * @example
     * // Get one DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DaemonStatisticsFindFirstArgs>(args?: SelectSubset<T, DaemonStatisticsFindFirstArgs<ExtArgs>>): Prisma__DaemonStatisticsClient<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DaemonStatistics that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DaemonStatisticsFindFirstOrThrowArgs} args - Arguments to find a DaemonStatistics
     * @example
     * // Get one DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DaemonStatisticsFindFirstOrThrowArgs>(args?: SelectSubset<T, DaemonStatisticsFindFirstOrThrowArgs<ExtArgs>>): Prisma__DaemonStatisticsClient<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more DaemonStatistics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DaemonStatisticsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.findMany()
     * 
     * // Get first 10 DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const daemonStatisticsWithIdOnly = await prisma.daemonStatistics.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DaemonStatisticsFindManyArgs>(args?: SelectSubset<T, DaemonStatisticsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a DaemonStatistics.
     * @param {DaemonStatisticsCreateArgs} args - Arguments to create a DaemonStatistics.
     * @example
     * // Create one DaemonStatistics
     * const DaemonStatistics = await prisma.daemonStatistics.create({
     *   data: {
     *     // ... data to create a DaemonStatistics
     *   }
     * })
     * 
     */
    create<T extends DaemonStatisticsCreateArgs>(args: SelectSubset<T, DaemonStatisticsCreateArgs<ExtArgs>>): Prisma__DaemonStatisticsClient<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many DaemonStatistics.
     * @param {DaemonStatisticsCreateManyArgs} args - Arguments to create many DaemonStatistics.
     * @example
     * // Create many DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DaemonStatisticsCreateManyArgs>(args?: SelectSubset<T, DaemonStatisticsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DaemonStatistics and returns the data saved in the database.
     * @param {DaemonStatisticsCreateManyAndReturnArgs} args - Arguments to create many DaemonStatistics.
     * @example
     * // Create many DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DaemonStatistics and only return the `id`
     * const daemonStatisticsWithIdOnly = await prisma.daemonStatistics.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DaemonStatisticsCreateManyAndReturnArgs>(args?: SelectSubset<T, DaemonStatisticsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a DaemonStatistics.
     * @param {DaemonStatisticsDeleteArgs} args - Arguments to delete one DaemonStatistics.
     * @example
     * // Delete one DaemonStatistics
     * const DaemonStatistics = await prisma.daemonStatistics.delete({
     *   where: {
     *     // ... filter to delete one DaemonStatistics
     *   }
     * })
     * 
     */
    delete<T extends DaemonStatisticsDeleteArgs>(args: SelectSubset<T, DaemonStatisticsDeleteArgs<ExtArgs>>): Prisma__DaemonStatisticsClient<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one DaemonStatistics.
     * @param {DaemonStatisticsUpdateArgs} args - Arguments to update one DaemonStatistics.
     * @example
     * // Update one DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DaemonStatisticsUpdateArgs>(args: SelectSubset<T, DaemonStatisticsUpdateArgs<ExtArgs>>): Prisma__DaemonStatisticsClient<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more DaemonStatistics.
     * @param {DaemonStatisticsDeleteManyArgs} args - Arguments to filter DaemonStatistics to delete.
     * @example
     * // Delete a few DaemonStatistics
     * const { count } = await prisma.daemonStatistics.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DaemonStatisticsDeleteManyArgs>(args?: SelectSubset<T, DaemonStatisticsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DaemonStatistics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DaemonStatisticsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DaemonStatisticsUpdateManyArgs>(args: SelectSubset<T, DaemonStatisticsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DaemonStatistics and returns the data updated in the database.
     * @param {DaemonStatisticsUpdateManyAndReturnArgs} args - Arguments to update many DaemonStatistics.
     * @example
     * // Update many DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more DaemonStatistics and only return the `id`
     * const daemonStatisticsWithIdOnly = await prisma.daemonStatistics.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DaemonStatisticsUpdateManyAndReturnArgs>(args: SelectSubset<T, DaemonStatisticsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one DaemonStatistics.
     * @param {DaemonStatisticsUpsertArgs} args - Arguments to update or create a DaemonStatistics.
     * @example
     * // Update or create a DaemonStatistics
     * const daemonStatistics = await prisma.daemonStatistics.upsert({
     *   create: {
     *     // ... data to create a DaemonStatistics
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DaemonStatistics we want to update
     *   }
     * })
     */
    upsert<T extends DaemonStatisticsUpsertArgs>(args: SelectSubset<T, DaemonStatisticsUpsertArgs<ExtArgs>>): Prisma__DaemonStatisticsClient<$Result.GetResult<Prisma.$DaemonStatisticsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of DaemonStatistics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DaemonStatisticsCountArgs} args - Arguments to filter DaemonStatistics to count.
     * @example
     * // Count the number of DaemonStatistics
     * const count = await prisma.daemonStatistics.count({
     *   where: {
     *     // ... the filter for the DaemonStatistics we want to count
     *   }
     * })
    **/
    count<T extends DaemonStatisticsCountArgs>(
      args?: Subset<T, DaemonStatisticsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DaemonStatisticsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DaemonStatistics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DaemonStatisticsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DaemonStatisticsAggregateArgs>(args: Subset<T, DaemonStatisticsAggregateArgs>): Prisma.PrismaPromise<GetDaemonStatisticsAggregateType<T>>

    /**
     * Group by DaemonStatistics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DaemonStatisticsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DaemonStatisticsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DaemonStatisticsGroupByArgs['orderBy'] }
        : { orderBy?: DaemonStatisticsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DaemonStatisticsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDaemonStatisticsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DaemonStatistics model
   */
  readonly fields: DaemonStatisticsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DaemonStatistics.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DaemonStatisticsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    session<T extends MonitorSessionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MonitorSessionDefaultArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DaemonStatistics model
   */
  interface DaemonStatisticsFieldRefs {
    readonly id: FieldRef<"DaemonStatistics", 'String'>
    readonly sessionId: FieldRef<"DaemonStatistics", 'String'>
    readonly startTime: FieldRef<"DaemonStatistics", 'DateTime'>
    readonly uptimeSeconds: FieldRef<"DaemonStatistics", 'Float'>
    readonly restarts: FieldRef<"DaemonStatistics", 'Int'>
    readonly configReloads: FieldRef<"DaemonStatistics", 'Int'>
    readonly totalDetections: FieldRef<"DaemonStatistics", 'Int'>
    readonly totalRecoveries: FieldRef<"DaemonStatistics", 'Int'>
    readonly errors: FieldRef<"DaemonStatistics", 'Int'>
    readonly decisionMinIntervalSec: FieldRef<"DaemonStatistics", 'Float'>
    readonly clearCompletionFallbackSec: FieldRef<"DaemonStatistics", 'Float'>
    readonly consecIdleRequired: FieldRef<"DaemonStatistics", 'Int'>
    readonly inactivityIdleSec: FieldRef<"DaemonStatistics", 'Float'>
    readonly minRecoveryIntervalSec: FieldRef<"DaemonStatistics", 'Float'>
    readonly createdAt: FieldRef<"DaemonStatistics", 'DateTime'>
    readonly updatedAt: FieldRef<"DaemonStatistics", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * DaemonStatistics findUnique
   */
  export type DaemonStatisticsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
    /**
     * Filter, which DaemonStatistics to fetch.
     */
    where: DaemonStatisticsWhereUniqueInput
  }

  /**
   * DaemonStatistics findUniqueOrThrow
   */
  export type DaemonStatisticsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
    /**
     * Filter, which DaemonStatistics to fetch.
     */
    where: DaemonStatisticsWhereUniqueInput
  }

  /**
   * DaemonStatistics findFirst
   */
  export type DaemonStatisticsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
    /**
     * Filter, which DaemonStatistics to fetch.
     */
    where?: DaemonStatisticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DaemonStatistics to fetch.
     */
    orderBy?: DaemonStatisticsOrderByWithRelationInput | DaemonStatisticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DaemonStatistics.
     */
    cursor?: DaemonStatisticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DaemonStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DaemonStatistics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DaemonStatistics.
     */
    distinct?: DaemonStatisticsScalarFieldEnum | DaemonStatisticsScalarFieldEnum[]
  }

  /**
   * DaemonStatistics findFirstOrThrow
   */
  export type DaemonStatisticsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
    /**
     * Filter, which DaemonStatistics to fetch.
     */
    where?: DaemonStatisticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DaemonStatistics to fetch.
     */
    orderBy?: DaemonStatisticsOrderByWithRelationInput | DaemonStatisticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DaemonStatistics.
     */
    cursor?: DaemonStatisticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DaemonStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DaemonStatistics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DaemonStatistics.
     */
    distinct?: DaemonStatisticsScalarFieldEnum | DaemonStatisticsScalarFieldEnum[]
  }

  /**
   * DaemonStatistics findMany
   */
  export type DaemonStatisticsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
    /**
     * Filter, which DaemonStatistics to fetch.
     */
    where?: DaemonStatisticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DaemonStatistics to fetch.
     */
    orderBy?: DaemonStatisticsOrderByWithRelationInput | DaemonStatisticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DaemonStatistics.
     */
    cursor?: DaemonStatisticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DaemonStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DaemonStatistics.
     */
    skip?: number
    distinct?: DaemonStatisticsScalarFieldEnum | DaemonStatisticsScalarFieldEnum[]
  }

  /**
   * DaemonStatistics create
   */
  export type DaemonStatisticsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
    /**
     * The data needed to create a DaemonStatistics.
     */
    data: XOR<DaemonStatisticsCreateInput, DaemonStatisticsUncheckedCreateInput>
  }

  /**
   * DaemonStatistics createMany
   */
  export type DaemonStatisticsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DaemonStatistics.
     */
    data: DaemonStatisticsCreateManyInput | DaemonStatisticsCreateManyInput[]
  }

  /**
   * DaemonStatistics createManyAndReturn
   */
  export type DaemonStatisticsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * The data used to create many DaemonStatistics.
     */
    data: DaemonStatisticsCreateManyInput | DaemonStatisticsCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * DaemonStatistics update
   */
  export type DaemonStatisticsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
    /**
     * The data needed to update a DaemonStatistics.
     */
    data: XOR<DaemonStatisticsUpdateInput, DaemonStatisticsUncheckedUpdateInput>
    /**
     * Choose, which DaemonStatistics to update.
     */
    where: DaemonStatisticsWhereUniqueInput
  }

  /**
   * DaemonStatistics updateMany
   */
  export type DaemonStatisticsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DaemonStatistics.
     */
    data: XOR<DaemonStatisticsUpdateManyMutationInput, DaemonStatisticsUncheckedUpdateManyInput>
    /**
     * Filter which DaemonStatistics to update
     */
    where?: DaemonStatisticsWhereInput
    /**
     * Limit how many DaemonStatistics to update.
     */
    limit?: number
  }

  /**
   * DaemonStatistics updateManyAndReturn
   */
  export type DaemonStatisticsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * The data used to update DaemonStatistics.
     */
    data: XOR<DaemonStatisticsUpdateManyMutationInput, DaemonStatisticsUncheckedUpdateManyInput>
    /**
     * Filter which DaemonStatistics to update
     */
    where?: DaemonStatisticsWhereInput
    /**
     * Limit how many DaemonStatistics to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * DaemonStatistics upsert
   */
  export type DaemonStatisticsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
    /**
     * The filter to search for the DaemonStatistics to update in case it exists.
     */
    where: DaemonStatisticsWhereUniqueInput
    /**
     * In case the DaemonStatistics found by the `where` argument doesn't exist, create a new DaemonStatistics with this data.
     */
    create: XOR<DaemonStatisticsCreateInput, DaemonStatisticsUncheckedCreateInput>
    /**
     * In case the DaemonStatistics was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DaemonStatisticsUpdateInput, DaemonStatisticsUncheckedUpdateInput>
  }

  /**
   * DaemonStatistics delete
   */
  export type DaemonStatisticsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
    /**
     * Filter which DaemonStatistics to delete.
     */
    where: DaemonStatisticsWhereUniqueInput
  }

  /**
   * DaemonStatistics deleteMany
   */
  export type DaemonStatisticsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DaemonStatistics to delete
     */
    where?: DaemonStatisticsWhereInput
    /**
     * Limit how many DaemonStatistics to delete.
     */
    limit?: number
  }

  /**
   * DaemonStatistics without action
   */
  export type DaemonStatisticsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DaemonStatistics
     */
    select?: DaemonStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DaemonStatistics
     */
    omit?: DaemonStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DaemonStatisticsInclude<ExtArgs> | null
  }


  /**
   * Model ComponentStatus
   */

  export type AggregateComponentStatus = {
    _count: ComponentStatusCountAggregateOutputType | null
    _min: ComponentStatusMinAggregateOutputType | null
    _max: ComponentStatusMaxAggregateOutputType | null
  }

  export type ComponentStatusMinAggregateOutputType = {
    id: string | null
    sessionId: string | null
    name: string | null
    status: string | null
    isRunning: boolean | null
    startedAt: Date | null
    stoppedAt: Date | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ComponentStatusMaxAggregateOutputType = {
    id: string | null
    sessionId: string | null
    name: string | null
    status: string | null
    isRunning: boolean | null
    startedAt: Date | null
    stoppedAt: Date | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ComponentStatusCountAggregateOutputType = {
    id: number
    sessionId: number
    name: number
    status: number
    isRunning: number
    startedAt: number
    stoppedAt: number
    lastError: number
    statistics: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ComponentStatusMinAggregateInputType = {
    id?: true
    sessionId?: true
    name?: true
    status?: true
    isRunning?: true
    startedAt?: true
    stoppedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ComponentStatusMaxAggregateInputType = {
    id?: true
    sessionId?: true
    name?: true
    status?: true
    isRunning?: true
    startedAt?: true
    stoppedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ComponentStatusCountAggregateInputType = {
    id?: true
    sessionId?: true
    name?: true
    status?: true
    isRunning?: true
    startedAt?: true
    stoppedAt?: true
    lastError?: true
    statistics?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ComponentStatusAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ComponentStatus to aggregate.
     */
    where?: ComponentStatusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ComponentStatuses to fetch.
     */
    orderBy?: ComponentStatusOrderByWithRelationInput | ComponentStatusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ComponentStatusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ComponentStatuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ComponentStatuses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ComponentStatuses
    **/
    _count?: true | ComponentStatusCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ComponentStatusMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ComponentStatusMaxAggregateInputType
  }

  export type GetComponentStatusAggregateType<T extends ComponentStatusAggregateArgs> = {
        [P in keyof T & keyof AggregateComponentStatus]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateComponentStatus[P]>
      : GetScalarType<T[P], AggregateComponentStatus[P]>
  }




  export type ComponentStatusGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ComponentStatusWhereInput
    orderBy?: ComponentStatusOrderByWithAggregationInput | ComponentStatusOrderByWithAggregationInput[]
    by: ComponentStatusScalarFieldEnum[] | ComponentStatusScalarFieldEnum
    having?: ComponentStatusScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ComponentStatusCountAggregateInputType | true
    _min?: ComponentStatusMinAggregateInputType
    _max?: ComponentStatusMaxAggregateInputType
  }

  export type ComponentStatusGroupByOutputType = {
    id: string
    sessionId: string
    name: string
    status: string
    isRunning: boolean
    startedAt: Date | null
    stoppedAt: Date | null
    lastError: string | null
    statistics: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ComponentStatusCountAggregateOutputType | null
    _min: ComponentStatusMinAggregateOutputType | null
    _max: ComponentStatusMaxAggregateOutputType | null
  }

  type GetComponentStatusGroupByPayload<T extends ComponentStatusGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ComponentStatusGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ComponentStatusGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ComponentStatusGroupByOutputType[P]>
            : GetScalarType<T[P], ComponentStatusGroupByOutputType[P]>
        }
      >
    >


  export type ComponentStatusSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    name?: boolean
    status?: boolean
    isRunning?: boolean
    startedAt?: boolean
    stoppedAt?: boolean
    lastError?: boolean
    statistics?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["componentStatus"]>

  export type ComponentStatusSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    name?: boolean
    status?: boolean
    isRunning?: boolean
    startedAt?: boolean
    stoppedAt?: boolean
    lastError?: boolean
    statistics?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["componentStatus"]>

  export type ComponentStatusSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    name?: boolean
    status?: boolean
    isRunning?: boolean
    startedAt?: boolean
    stoppedAt?: boolean
    lastError?: boolean
    statistics?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["componentStatus"]>

  export type ComponentStatusSelectScalar = {
    id?: boolean
    sessionId?: boolean
    name?: boolean
    status?: boolean
    isRunning?: boolean
    startedAt?: boolean
    stoppedAt?: boolean
    lastError?: boolean
    statistics?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ComponentStatusOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sessionId" | "name" | "status" | "isRunning" | "startedAt" | "stoppedAt" | "lastError" | "statistics" | "createdAt" | "updatedAt", ExtArgs["result"]["componentStatus"]>
  export type ComponentStatusInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }
  export type ComponentStatusIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }
  export type ComponentStatusIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }

  export type $ComponentStatusPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ComponentStatus"
    objects: {
      session: Prisma.$MonitorSessionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sessionId: string
      name: string
      status: string
      isRunning: boolean
      startedAt: Date | null
      stoppedAt: Date | null
      lastError: string | null
      statistics: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["componentStatus"]>
    composites: {}
  }

  type ComponentStatusGetPayload<S extends boolean | null | undefined | ComponentStatusDefaultArgs> = $Result.GetResult<Prisma.$ComponentStatusPayload, S>

  type ComponentStatusCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ComponentStatusFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ComponentStatusCountAggregateInputType | true
    }

  export interface ComponentStatusDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ComponentStatus'], meta: { name: 'ComponentStatus' } }
    /**
     * Find zero or one ComponentStatus that matches the filter.
     * @param {ComponentStatusFindUniqueArgs} args - Arguments to find a ComponentStatus
     * @example
     * // Get one ComponentStatus
     * const componentStatus = await prisma.componentStatus.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ComponentStatusFindUniqueArgs>(args: SelectSubset<T, ComponentStatusFindUniqueArgs<ExtArgs>>): Prisma__ComponentStatusClient<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ComponentStatus that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ComponentStatusFindUniqueOrThrowArgs} args - Arguments to find a ComponentStatus
     * @example
     * // Get one ComponentStatus
     * const componentStatus = await prisma.componentStatus.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ComponentStatusFindUniqueOrThrowArgs>(args: SelectSubset<T, ComponentStatusFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ComponentStatusClient<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ComponentStatus that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComponentStatusFindFirstArgs} args - Arguments to find a ComponentStatus
     * @example
     * // Get one ComponentStatus
     * const componentStatus = await prisma.componentStatus.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ComponentStatusFindFirstArgs>(args?: SelectSubset<T, ComponentStatusFindFirstArgs<ExtArgs>>): Prisma__ComponentStatusClient<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ComponentStatus that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComponentStatusFindFirstOrThrowArgs} args - Arguments to find a ComponentStatus
     * @example
     * // Get one ComponentStatus
     * const componentStatus = await prisma.componentStatus.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ComponentStatusFindFirstOrThrowArgs>(args?: SelectSubset<T, ComponentStatusFindFirstOrThrowArgs<ExtArgs>>): Prisma__ComponentStatusClient<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ComponentStatuses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComponentStatusFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ComponentStatuses
     * const componentStatuses = await prisma.componentStatus.findMany()
     * 
     * // Get first 10 ComponentStatuses
     * const componentStatuses = await prisma.componentStatus.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const componentStatusWithIdOnly = await prisma.componentStatus.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ComponentStatusFindManyArgs>(args?: SelectSubset<T, ComponentStatusFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ComponentStatus.
     * @param {ComponentStatusCreateArgs} args - Arguments to create a ComponentStatus.
     * @example
     * // Create one ComponentStatus
     * const ComponentStatus = await prisma.componentStatus.create({
     *   data: {
     *     // ... data to create a ComponentStatus
     *   }
     * })
     * 
     */
    create<T extends ComponentStatusCreateArgs>(args: SelectSubset<T, ComponentStatusCreateArgs<ExtArgs>>): Prisma__ComponentStatusClient<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ComponentStatuses.
     * @param {ComponentStatusCreateManyArgs} args - Arguments to create many ComponentStatuses.
     * @example
     * // Create many ComponentStatuses
     * const componentStatus = await prisma.componentStatus.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ComponentStatusCreateManyArgs>(args?: SelectSubset<T, ComponentStatusCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ComponentStatuses and returns the data saved in the database.
     * @param {ComponentStatusCreateManyAndReturnArgs} args - Arguments to create many ComponentStatuses.
     * @example
     * // Create many ComponentStatuses
     * const componentStatus = await prisma.componentStatus.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ComponentStatuses and only return the `id`
     * const componentStatusWithIdOnly = await prisma.componentStatus.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ComponentStatusCreateManyAndReturnArgs>(args?: SelectSubset<T, ComponentStatusCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ComponentStatus.
     * @param {ComponentStatusDeleteArgs} args - Arguments to delete one ComponentStatus.
     * @example
     * // Delete one ComponentStatus
     * const ComponentStatus = await prisma.componentStatus.delete({
     *   where: {
     *     // ... filter to delete one ComponentStatus
     *   }
     * })
     * 
     */
    delete<T extends ComponentStatusDeleteArgs>(args: SelectSubset<T, ComponentStatusDeleteArgs<ExtArgs>>): Prisma__ComponentStatusClient<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ComponentStatus.
     * @param {ComponentStatusUpdateArgs} args - Arguments to update one ComponentStatus.
     * @example
     * // Update one ComponentStatus
     * const componentStatus = await prisma.componentStatus.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ComponentStatusUpdateArgs>(args: SelectSubset<T, ComponentStatusUpdateArgs<ExtArgs>>): Prisma__ComponentStatusClient<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ComponentStatuses.
     * @param {ComponentStatusDeleteManyArgs} args - Arguments to filter ComponentStatuses to delete.
     * @example
     * // Delete a few ComponentStatuses
     * const { count } = await prisma.componentStatus.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ComponentStatusDeleteManyArgs>(args?: SelectSubset<T, ComponentStatusDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ComponentStatuses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComponentStatusUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ComponentStatuses
     * const componentStatus = await prisma.componentStatus.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ComponentStatusUpdateManyArgs>(args: SelectSubset<T, ComponentStatusUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ComponentStatuses and returns the data updated in the database.
     * @param {ComponentStatusUpdateManyAndReturnArgs} args - Arguments to update many ComponentStatuses.
     * @example
     * // Update many ComponentStatuses
     * const componentStatus = await prisma.componentStatus.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ComponentStatuses and only return the `id`
     * const componentStatusWithIdOnly = await prisma.componentStatus.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ComponentStatusUpdateManyAndReturnArgs>(args: SelectSubset<T, ComponentStatusUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ComponentStatus.
     * @param {ComponentStatusUpsertArgs} args - Arguments to update or create a ComponentStatus.
     * @example
     * // Update or create a ComponentStatus
     * const componentStatus = await prisma.componentStatus.upsert({
     *   create: {
     *     // ... data to create a ComponentStatus
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ComponentStatus we want to update
     *   }
     * })
     */
    upsert<T extends ComponentStatusUpsertArgs>(args: SelectSubset<T, ComponentStatusUpsertArgs<ExtArgs>>): Prisma__ComponentStatusClient<$Result.GetResult<Prisma.$ComponentStatusPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ComponentStatuses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComponentStatusCountArgs} args - Arguments to filter ComponentStatuses to count.
     * @example
     * // Count the number of ComponentStatuses
     * const count = await prisma.componentStatus.count({
     *   where: {
     *     // ... the filter for the ComponentStatuses we want to count
     *   }
     * })
    **/
    count<T extends ComponentStatusCountArgs>(
      args?: Subset<T, ComponentStatusCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ComponentStatusCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ComponentStatus.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComponentStatusAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ComponentStatusAggregateArgs>(args: Subset<T, ComponentStatusAggregateArgs>): Prisma.PrismaPromise<GetComponentStatusAggregateType<T>>

    /**
     * Group by ComponentStatus.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComponentStatusGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ComponentStatusGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ComponentStatusGroupByArgs['orderBy'] }
        : { orderBy?: ComponentStatusGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ComponentStatusGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetComponentStatusGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ComponentStatus model
   */
  readonly fields: ComponentStatusFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ComponentStatus.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ComponentStatusClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    session<T extends MonitorSessionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MonitorSessionDefaultArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ComponentStatus model
   */
  interface ComponentStatusFieldRefs {
    readonly id: FieldRef<"ComponentStatus", 'String'>
    readonly sessionId: FieldRef<"ComponentStatus", 'String'>
    readonly name: FieldRef<"ComponentStatus", 'String'>
    readonly status: FieldRef<"ComponentStatus", 'String'>
    readonly isRunning: FieldRef<"ComponentStatus", 'Boolean'>
    readonly startedAt: FieldRef<"ComponentStatus", 'DateTime'>
    readonly stoppedAt: FieldRef<"ComponentStatus", 'DateTime'>
    readonly lastError: FieldRef<"ComponentStatus", 'String'>
    readonly statistics: FieldRef<"ComponentStatus", 'Json'>
    readonly createdAt: FieldRef<"ComponentStatus", 'DateTime'>
    readonly updatedAt: FieldRef<"ComponentStatus", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ComponentStatus findUnique
   */
  export type ComponentStatusFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
    /**
     * Filter, which ComponentStatus to fetch.
     */
    where: ComponentStatusWhereUniqueInput
  }

  /**
   * ComponentStatus findUniqueOrThrow
   */
  export type ComponentStatusFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
    /**
     * Filter, which ComponentStatus to fetch.
     */
    where: ComponentStatusWhereUniqueInput
  }

  /**
   * ComponentStatus findFirst
   */
  export type ComponentStatusFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
    /**
     * Filter, which ComponentStatus to fetch.
     */
    where?: ComponentStatusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ComponentStatuses to fetch.
     */
    orderBy?: ComponentStatusOrderByWithRelationInput | ComponentStatusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ComponentStatuses.
     */
    cursor?: ComponentStatusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ComponentStatuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ComponentStatuses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ComponentStatuses.
     */
    distinct?: ComponentStatusScalarFieldEnum | ComponentStatusScalarFieldEnum[]
  }

  /**
   * ComponentStatus findFirstOrThrow
   */
  export type ComponentStatusFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
    /**
     * Filter, which ComponentStatus to fetch.
     */
    where?: ComponentStatusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ComponentStatuses to fetch.
     */
    orderBy?: ComponentStatusOrderByWithRelationInput | ComponentStatusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ComponentStatuses.
     */
    cursor?: ComponentStatusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ComponentStatuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ComponentStatuses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ComponentStatuses.
     */
    distinct?: ComponentStatusScalarFieldEnum | ComponentStatusScalarFieldEnum[]
  }

  /**
   * ComponentStatus findMany
   */
  export type ComponentStatusFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
    /**
     * Filter, which ComponentStatuses to fetch.
     */
    where?: ComponentStatusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ComponentStatuses to fetch.
     */
    orderBy?: ComponentStatusOrderByWithRelationInput | ComponentStatusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ComponentStatuses.
     */
    cursor?: ComponentStatusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ComponentStatuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ComponentStatuses.
     */
    skip?: number
    distinct?: ComponentStatusScalarFieldEnum | ComponentStatusScalarFieldEnum[]
  }

  /**
   * ComponentStatus create
   */
  export type ComponentStatusCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
    /**
     * The data needed to create a ComponentStatus.
     */
    data: XOR<ComponentStatusCreateInput, ComponentStatusUncheckedCreateInput>
  }

  /**
   * ComponentStatus createMany
   */
  export type ComponentStatusCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ComponentStatuses.
     */
    data: ComponentStatusCreateManyInput | ComponentStatusCreateManyInput[]
  }

  /**
   * ComponentStatus createManyAndReturn
   */
  export type ComponentStatusCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * The data used to create many ComponentStatuses.
     */
    data: ComponentStatusCreateManyInput | ComponentStatusCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ComponentStatus update
   */
  export type ComponentStatusUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
    /**
     * The data needed to update a ComponentStatus.
     */
    data: XOR<ComponentStatusUpdateInput, ComponentStatusUncheckedUpdateInput>
    /**
     * Choose, which ComponentStatus to update.
     */
    where: ComponentStatusWhereUniqueInput
  }

  /**
   * ComponentStatus updateMany
   */
  export type ComponentStatusUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ComponentStatuses.
     */
    data: XOR<ComponentStatusUpdateManyMutationInput, ComponentStatusUncheckedUpdateManyInput>
    /**
     * Filter which ComponentStatuses to update
     */
    where?: ComponentStatusWhereInput
    /**
     * Limit how many ComponentStatuses to update.
     */
    limit?: number
  }

  /**
   * ComponentStatus updateManyAndReturn
   */
  export type ComponentStatusUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * The data used to update ComponentStatuses.
     */
    data: XOR<ComponentStatusUpdateManyMutationInput, ComponentStatusUncheckedUpdateManyInput>
    /**
     * Filter which ComponentStatuses to update
     */
    where?: ComponentStatusWhereInput
    /**
     * Limit how many ComponentStatuses to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ComponentStatus upsert
   */
  export type ComponentStatusUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
    /**
     * The filter to search for the ComponentStatus to update in case it exists.
     */
    where: ComponentStatusWhereUniqueInput
    /**
     * In case the ComponentStatus found by the `where` argument doesn't exist, create a new ComponentStatus with this data.
     */
    create: XOR<ComponentStatusCreateInput, ComponentStatusUncheckedCreateInput>
    /**
     * In case the ComponentStatus was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ComponentStatusUpdateInput, ComponentStatusUncheckedUpdateInput>
  }

  /**
   * ComponentStatus delete
   */
  export type ComponentStatusDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
    /**
     * Filter which ComponentStatus to delete.
     */
    where: ComponentStatusWhereUniqueInput
  }

  /**
   * ComponentStatus deleteMany
   */
  export type ComponentStatusDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ComponentStatuses to delete
     */
    where?: ComponentStatusWhereInput
    /**
     * Limit how many ComponentStatuses to delete.
     */
    limit?: number
  }

  /**
   * ComponentStatus without action
   */
  export type ComponentStatusDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComponentStatus
     */
    select?: ComponentStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ComponentStatus
     */
    omit?: ComponentStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComponentStatusInclude<ExtArgs> | null
  }


  /**
   * Model RecoveryAction
   */

  export type AggregateRecoveryAction = {
    _count: RecoveryActionCountAggregateOutputType | null
    _min: RecoveryActionMinAggregateOutputType | null
    _max: RecoveryActionMaxAggregateOutputType | null
  }

  export type RecoveryActionMinAggregateOutputType = {
    id: string | null
    sessionId: string | null
    state: string | null
    actionType: string | null
    timestamp: Date | null
    success: boolean | null
    errorMessage: string | null
    throttledUntil: Date | null
  }

  export type RecoveryActionMaxAggregateOutputType = {
    id: string | null
    sessionId: string | null
    state: string | null
    actionType: string | null
    timestamp: Date | null
    success: boolean | null
    errorMessage: string | null
    throttledUntil: Date | null
  }

  export type RecoveryActionCountAggregateOutputType = {
    id: number
    sessionId: number
    state: number
    actionType: number
    timestamp: number
    success: number
    errorMessage: number
    throttledUntil: number
    _all: number
  }


  export type RecoveryActionMinAggregateInputType = {
    id?: true
    sessionId?: true
    state?: true
    actionType?: true
    timestamp?: true
    success?: true
    errorMessage?: true
    throttledUntil?: true
  }

  export type RecoveryActionMaxAggregateInputType = {
    id?: true
    sessionId?: true
    state?: true
    actionType?: true
    timestamp?: true
    success?: true
    errorMessage?: true
    throttledUntil?: true
  }

  export type RecoveryActionCountAggregateInputType = {
    id?: true
    sessionId?: true
    state?: true
    actionType?: true
    timestamp?: true
    success?: true
    errorMessage?: true
    throttledUntil?: true
    _all?: true
  }

  export type RecoveryActionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RecoveryAction to aggregate.
     */
    where?: RecoveryActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecoveryActions to fetch.
     */
    orderBy?: RecoveryActionOrderByWithRelationInput | RecoveryActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RecoveryActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecoveryActions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecoveryActions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RecoveryActions
    **/
    _count?: true | RecoveryActionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RecoveryActionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RecoveryActionMaxAggregateInputType
  }

  export type GetRecoveryActionAggregateType<T extends RecoveryActionAggregateArgs> = {
        [P in keyof T & keyof AggregateRecoveryAction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRecoveryAction[P]>
      : GetScalarType<T[P], AggregateRecoveryAction[P]>
  }




  export type RecoveryActionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecoveryActionWhereInput
    orderBy?: RecoveryActionOrderByWithAggregationInput | RecoveryActionOrderByWithAggregationInput[]
    by: RecoveryActionScalarFieldEnum[] | RecoveryActionScalarFieldEnum
    having?: RecoveryActionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RecoveryActionCountAggregateInputType | true
    _min?: RecoveryActionMinAggregateInputType
    _max?: RecoveryActionMaxAggregateInputType
  }

  export type RecoveryActionGroupByOutputType = {
    id: string
    sessionId: string
    state: string
    actionType: string
    timestamp: Date
    success: boolean
    errorMessage: string | null
    throttledUntil: Date | null
    _count: RecoveryActionCountAggregateOutputType | null
    _min: RecoveryActionMinAggregateOutputType | null
    _max: RecoveryActionMaxAggregateOutputType | null
  }

  type GetRecoveryActionGroupByPayload<T extends RecoveryActionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RecoveryActionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RecoveryActionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RecoveryActionGroupByOutputType[P]>
            : GetScalarType<T[P], RecoveryActionGroupByOutputType[P]>
        }
      >
    >


  export type RecoveryActionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    state?: boolean
    actionType?: boolean
    timestamp?: boolean
    success?: boolean
    errorMessage?: boolean
    throttledUntil?: boolean
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recoveryAction"]>

  export type RecoveryActionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    state?: boolean
    actionType?: boolean
    timestamp?: boolean
    success?: boolean
    errorMessage?: boolean
    throttledUntil?: boolean
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recoveryAction"]>

  export type RecoveryActionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    state?: boolean
    actionType?: boolean
    timestamp?: boolean
    success?: boolean
    errorMessage?: boolean
    throttledUntil?: boolean
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recoveryAction"]>

  export type RecoveryActionSelectScalar = {
    id?: boolean
    sessionId?: boolean
    state?: boolean
    actionType?: boolean
    timestamp?: boolean
    success?: boolean
    errorMessage?: boolean
    throttledUntil?: boolean
  }

  export type RecoveryActionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sessionId" | "state" | "actionType" | "timestamp" | "success" | "errorMessage" | "throttledUntil", ExtArgs["result"]["recoveryAction"]>
  export type RecoveryActionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }
  export type RecoveryActionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }
  export type RecoveryActionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | MonitorSessionDefaultArgs<ExtArgs>
  }

  export type $RecoveryActionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RecoveryAction"
    objects: {
      session: Prisma.$MonitorSessionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sessionId: string
      state: string
      actionType: string
      timestamp: Date
      success: boolean
      errorMessage: string | null
      throttledUntil: Date | null
    }, ExtArgs["result"]["recoveryAction"]>
    composites: {}
  }

  type RecoveryActionGetPayload<S extends boolean | null | undefined | RecoveryActionDefaultArgs> = $Result.GetResult<Prisma.$RecoveryActionPayload, S>

  type RecoveryActionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RecoveryActionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RecoveryActionCountAggregateInputType | true
    }

  export interface RecoveryActionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RecoveryAction'], meta: { name: 'RecoveryAction' } }
    /**
     * Find zero or one RecoveryAction that matches the filter.
     * @param {RecoveryActionFindUniqueArgs} args - Arguments to find a RecoveryAction
     * @example
     * // Get one RecoveryAction
     * const recoveryAction = await prisma.recoveryAction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RecoveryActionFindUniqueArgs>(args: SelectSubset<T, RecoveryActionFindUniqueArgs<ExtArgs>>): Prisma__RecoveryActionClient<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one RecoveryAction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RecoveryActionFindUniqueOrThrowArgs} args - Arguments to find a RecoveryAction
     * @example
     * // Get one RecoveryAction
     * const recoveryAction = await prisma.recoveryAction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RecoveryActionFindUniqueOrThrowArgs>(args: SelectSubset<T, RecoveryActionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RecoveryActionClient<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RecoveryAction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryActionFindFirstArgs} args - Arguments to find a RecoveryAction
     * @example
     * // Get one RecoveryAction
     * const recoveryAction = await prisma.recoveryAction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RecoveryActionFindFirstArgs>(args?: SelectSubset<T, RecoveryActionFindFirstArgs<ExtArgs>>): Prisma__RecoveryActionClient<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RecoveryAction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryActionFindFirstOrThrowArgs} args - Arguments to find a RecoveryAction
     * @example
     * // Get one RecoveryAction
     * const recoveryAction = await prisma.recoveryAction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RecoveryActionFindFirstOrThrowArgs>(args?: SelectSubset<T, RecoveryActionFindFirstOrThrowArgs<ExtArgs>>): Prisma__RecoveryActionClient<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more RecoveryActions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryActionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RecoveryActions
     * const recoveryActions = await prisma.recoveryAction.findMany()
     * 
     * // Get first 10 RecoveryActions
     * const recoveryActions = await prisma.recoveryAction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const recoveryActionWithIdOnly = await prisma.recoveryAction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RecoveryActionFindManyArgs>(args?: SelectSubset<T, RecoveryActionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a RecoveryAction.
     * @param {RecoveryActionCreateArgs} args - Arguments to create a RecoveryAction.
     * @example
     * // Create one RecoveryAction
     * const RecoveryAction = await prisma.recoveryAction.create({
     *   data: {
     *     // ... data to create a RecoveryAction
     *   }
     * })
     * 
     */
    create<T extends RecoveryActionCreateArgs>(args: SelectSubset<T, RecoveryActionCreateArgs<ExtArgs>>): Prisma__RecoveryActionClient<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many RecoveryActions.
     * @param {RecoveryActionCreateManyArgs} args - Arguments to create many RecoveryActions.
     * @example
     * // Create many RecoveryActions
     * const recoveryAction = await prisma.recoveryAction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RecoveryActionCreateManyArgs>(args?: SelectSubset<T, RecoveryActionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RecoveryActions and returns the data saved in the database.
     * @param {RecoveryActionCreateManyAndReturnArgs} args - Arguments to create many RecoveryActions.
     * @example
     * // Create many RecoveryActions
     * const recoveryAction = await prisma.recoveryAction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many RecoveryActions and only return the `id`
     * const recoveryActionWithIdOnly = await prisma.recoveryAction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RecoveryActionCreateManyAndReturnArgs>(args?: SelectSubset<T, RecoveryActionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a RecoveryAction.
     * @param {RecoveryActionDeleteArgs} args - Arguments to delete one RecoveryAction.
     * @example
     * // Delete one RecoveryAction
     * const RecoveryAction = await prisma.recoveryAction.delete({
     *   where: {
     *     // ... filter to delete one RecoveryAction
     *   }
     * })
     * 
     */
    delete<T extends RecoveryActionDeleteArgs>(args: SelectSubset<T, RecoveryActionDeleteArgs<ExtArgs>>): Prisma__RecoveryActionClient<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one RecoveryAction.
     * @param {RecoveryActionUpdateArgs} args - Arguments to update one RecoveryAction.
     * @example
     * // Update one RecoveryAction
     * const recoveryAction = await prisma.recoveryAction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RecoveryActionUpdateArgs>(args: SelectSubset<T, RecoveryActionUpdateArgs<ExtArgs>>): Prisma__RecoveryActionClient<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more RecoveryActions.
     * @param {RecoveryActionDeleteManyArgs} args - Arguments to filter RecoveryActions to delete.
     * @example
     * // Delete a few RecoveryActions
     * const { count } = await prisma.recoveryAction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RecoveryActionDeleteManyArgs>(args?: SelectSubset<T, RecoveryActionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RecoveryActions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryActionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RecoveryActions
     * const recoveryAction = await prisma.recoveryAction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RecoveryActionUpdateManyArgs>(args: SelectSubset<T, RecoveryActionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RecoveryActions and returns the data updated in the database.
     * @param {RecoveryActionUpdateManyAndReturnArgs} args - Arguments to update many RecoveryActions.
     * @example
     * // Update many RecoveryActions
     * const recoveryAction = await prisma.recoveryAction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more RecoveryActions and only return the `id`
     * const recoveryActionWithIdOnly = await prisma.recoveryAction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RecoveryActionUpdateManyAndReturnArgs>(args: SelectSubset<T, RecoveryActionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one RecoveryAction.
     * @param {RecoveryActionUpsertArgs} args - Arguments to update or create a RecoveryAction.
     * @example
     * // Update or create a RecoveryAction
     * const recoveryAction = await prisma.recoveryAction.upsert({
     *   create: {
     *     // ... data to create a RecoveryAction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RecoveryAction we want to update
     *   }
     * })
     */
    upsert<T extends RecoveryActionUpsertArgs>(args: SelectSubset<T, RecoveryActionUpsertArgs<ExtArgs>>): Prisma__RecoveryActionClient<$Result.GetResult<Prisma.$RecoveryActionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of RecoveryActions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryActionCountArgs} args - Arguments to filter RecoveryActions to count.
     * @example
     * // Count the number of RecoveryActions
     * const count = await prisma.recoveryAction.count({
     *   where: {
     *     // ... the filter for the RecoveryActions we want to count
     *   }
     * })
    **/
    count<T extends RecoveryActionCountArgs>(
      args?: Subset<T, RecoveryActionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RecoveryActionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RecoveryAction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryActionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RecoveryActionAggregateArgs>(args: Subset<T, RecoveryActionAggregateArgs>): Prisma.PrismaPromise<GetRecoveryActionAggregateType<T>>

    /**
     * Group by RecoveryAction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryActionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RecoveryActionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RecoveryActionGroupByArgs['orderBy'] }
        : { orderBy?: RecoveryActionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RecoveryActionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRecoveryActionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RecoveryAction model
   */
  readonly fields: RecoveryActionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RecoveryAction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RecoveryActionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    session<T extends MonitorSessionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MonitorSessionDefaultArgs<ExtArgs>>): Prisma__MonitorSessionClient<$Result.GetResult<Prisma.$MonitorSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RecoveryAction model
   */
  interface RecoveryActionFieldRefs {
    readonly id: FieldRef<"RecoveryAction", 'String'>
    readonly sessionId: FieldRef<"RecoveryAction", 'String'>
    readonly state: FieldRef<"RecoveryAction", 'String'>
    readonly actionType: FieldRef<"RecoveryAction", 'String'>
    readonly timestamp: FieldRef<"RecoveryAction", 'DateTime'>
    readonly success: FieldRef<"RecoveryAction", 'Boolean'>
    readonly errorMessage: FieldRef<"RecoveryAction", 'String'>
    readonly throttledUntil: FieldRef<"RecoveryAction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * RecoveryAction findUnique
   */
  export type RecoveryActionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
    /**
     * Filter, which RecoveryAction to fetch.
     */
    where: RecoveryActionWhereUniqueInput
  }

  /**
   * RecoveryAction findUniqueOrThrow
   */
  export type RecoveryActionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
    /**
     * Filter, which RecoveryAction to fetch.
     */
    where: RecoveryActionWhereUniqueInput
  }

  /**
   * RecoveryAction findFirst
   */
  export type RecoveryActionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
    /**
     * Filter, which RecoveryAction to fetch.
     */
    where?: RecoveryActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecoveryActions to fetch.
     */
    orderBy?: RecoveryActionOrderByWithRelationInput | RecoveryActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RecoveryActions.
     */
    cursor?: RecoveryActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecoveryActions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecoveryActions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RecoveryActions.
     */
    distinct?: RecoveryActionScalarFieldEnum | RecoveryActionScalarFieldEnum[]
  }

  /**
   * RecoveryAction findFirstOrThrow
   */
  export type RecoveryActionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
    /**
     * Filter, which RecoveryAction to fetch.
     */
    where?: RecoveryActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecoveryActions to fetch.
     */
    orderBy?: RecoveryActionOrderByWithRelationInput | RecoveryActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RecoveryActions.
     */
    cursor?: RecoveryActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecoveryActions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecoveryActions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RecoveryActions.
     */
    distinct?: RecoveryActionScalarFieldEnum | RecoveryActionScalarFieldEnum[]
  }

  /**
   * RecoveryAction findMany
   */
  export type RecoveryActionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
    /**
     * Filter, which RecoveryActions to fetch.
     */
    where?: RecoveryActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecoveryActions to fetch.
     */
    orderBy?: RecoveryActionOrderByWithRelationInput | RecoveryActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RecoveryActions.
     */
    cursor?: RecoveryActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecoveryActions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecoveryActions.
     */
    skip?: number
    distinct?: RecoveryActionScalarFieldEnum | RecoveryActionScalarFieldEnum[]
  }

  /**
   * RecoveryAction create
   */
  export type RecoveryActionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
    /**
     * The data needed to create a RecoveryAction.
     */
    data: XOR<RecoveryActionCreateInput, RecoveryActionUncheckedCreateInput>
  }

  /**
   * RecoveryAction createMany
   */
  export type RecoveryActionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RecoveryActions.
     */
    data: RecoveryActionCreateManyInput | RecoveryActionCreateManyInput[]
  }

  /**
   * RecoveryAction createManyAndReturn
   */
  export type RecoveryActionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * The data used to create many RecoveryActions.
     */
    data: RecoveryActionCreateManyInput | RecoveryActionCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * RecoveryAction update
   */
  export type RecoveryActionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
    /**
     * The data needed to update a RecoveryAction.
     */
    data: XOR<RecoveryActionUpdateInput, RecoveryActionUncheckedUpdateInput>
    /**
     * Choose, which RecoveryAction to update.
     */
    where: RecoveryActionWhereUniqueInput
  }

  /**
   * RecoveryAction updateMany
   */
  export type RecoveryActionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RecoveryActions.
     */
    data: XOR<RecoveryActionUpdateManyMutationInput, RecoveryActionUncheckedUpdateManyInput>
    /**
     * Filter which RecoveryActions to update
     */
    where?: RecoveryActionWhereInput
    /**
     * Limit how many RecoveryActions to update.
     */
    limit?: number
  }

  /**
   * RecoveryAction updateManyAndReturn
   */
  export type RecoveryActionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * The data used to update RecoveryActions.
     */
    data: XOR<RecoveryActionUpdateManyMutationInput, RecoveryActionUncheckedUpdateManyInput>
    /**
     * Filter which RecoveryActions to update
     */
    where?: RecoveryActionWhereInput
    /**
     * Limit how many RecoveryActions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * RecoveryAction upsert
   */
  export type RecoveryActionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
    /**
     * The filter to search for the RecoveryAction to update in case it exists.
     */
    where: RecoveryActionWhereUniqueInput
    /**
     * In case the RecoveryAction found by the `where` argument doesn't exist, create a new RecoveryAction with this data.
     */
    create: XOR<RecoveryActionCreateInput, RecoveryActionUncheckedCreateInput>
    /**
     * In case the RecoveryAction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RecoveryActionUpdateInput, RecoveryActionUncheckedUpdateInput>
  }

  /**
   * RecoveryAction delete
   */
  export type RecoveryActionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
    /**
     * Filter which RecoveryAction to delete.
     */
    where: RecoveryActionWhereUniqueInput
  }

  /**
   * RecoveryAction deleteMany
   */
  export type RecoveryActionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RecoveryActions to delete
     */
    where?: RecoveryActionWhereInput
    /**
     * Limit how many RecoveryActions to delete.
     */
    limit?: number
  }

  /**
   * RecoveryAction without action
   */
  export type RecoveryActionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryAction
     */
    select?: RecoveryActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecoveryAction
     */
    omit?: RecoveryActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryActionInclude<ExtArgs> | null
  }


  /**
   * Model ConfigurationHistory
   */

  export type AggregateConfigurationHistory = {
    _count: ConfigurationHistoryCountAggregateOutputType | null
    _min: ConfigurationHistoryMinAggregateOutputType | null
    _max: ConfigurationHistoryMaxAggregateOutputType | null
  }

  export type ConfigurationHistoryMinAggregateOutputType = {
    id: string | null
    configPath: string | null
    configHash: string | null
    loadedAt: Date | null
    isActive: boolean | null
    errorMessage: string | null
  }

  export type ConfigurationHistoryMaxAggregateOutputType = {
    id: string | null
    configPath: string | null
    configHash: string | null
    loadedAt: Date | null
    isActive: boolean | null
    errorMessage: string | null
  }

  export type ConfigurationHistoryCountAggregateOutputType = {
    id: number
    configPath: number
    configHash: number
    configData: number
    loadedAt: number
    isActive: number
    errorMessage: number
    _all: number
  }


  export type ConfigurationHistoryMinAggregateInputType = {
    id?: true
    configPath?: true
    configHash?: true
    loadedAt?: true
    isActive?: true
    errorMessage?: true
  }

  export type ConfigurationHistoryMaxAggregateInputType = {
    id?: true
    configPath?: true
    configHash?: true
    loadedAt?: true
    isActive?: true
    errorMessage?: true
  }

  export type ConfigurationHistoryCountAggregateInputType = {
    id?: true
    configPath?: true
    configHash?: true
    configData?: true
    loadedAt?: true
    isActive?: true
    errorMessage?: true
    _all?: true
  }

  export type ConfigurationHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConfigurationHistory to aggregate.
     */
    where?: ConfigurationHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConfigurationHistories to fetch.
     */
    orderBy?: ConfigurationHistoryOrderByWithRelationInput | ConfigurationHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConfigurationHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConfigurationHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConfigurationHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ConfigurationHistories
    **/
    _count?: true | ConfigurationHistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConfigurationHistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConfigurationHistoryMaxAggregateInputType
  }

  export type GetConfigurationHistoryAggregateType<T extends ConfigurationHistoryAggregateArgs> = {
        [P in keyof T & keyof AggregateConfigurationHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConfigurationHistory[P]>
      : GetScalarType<T[P], AggregateConfigurationHistory[P]>
  }




  export type ConfigurationHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConfigurationHistoryWhereInput
    orderBy?: ConfigurationHistoryOrderByWithAggregationInput | ConfigurationHistoryOrderByWithAggregationInput[]
    by: ConfigurationHistoryScalarFieldEnum[] | ConfigurationHistoryScalarFieldEnum
    having?: ConfigurationHistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConfigurationHistoryCountAggregateInputType | true
    _min?: ConfigurationHistoryMinAggregateInputType
    _max?: ConfigurationHistoryMaxAggregateInputType
  }

  export type ConfigurationHistoryGroupByOutputType = {
    id: string
    configPath: string | null
    configHash: string
    configData: JsonValue
    loadedAt: Date
    isActive: boolean
    errorMessage: string | null
    _count: ConfigurationHistoryCountAggregateOutputType | null
    _min: ConfigurationHistoryMinAggregateOutputType | null
    _max: ConfigurationHistoryMaxAggregateOutputType | null
  }

  type GetConfigurationHistoryGroupByPayload<T extends ConfigurationHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConfigurationHistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConfigurationHistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConfigurationHistoryGroupByOutputType[P]>
            : GetScalarType<T[P], ConfigurationHistoryGroupByOutputType[P]>
        }
      >
    >


  export type ConfigurationHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    configPath?: boolean
    configHash?: boolean
    configData?: boolean
    loadedAt?: boolean
    isActive?: boolean
    errorMessage?: boolean
  }, ExtArgs["result"]["configurationHistory"]>

  export type ConfigurationHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    configPath?: boolean
    configHash?: boolean
    configData?: boolean
    loadedAt?: boolean
    isActive?: boolean
    errorMessage?: boolean
  }, ExtArgs["result"]["configurationHistory"]>

  export type ConfigurationHistorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    configPath?: boolean
    configHash?: boolean
    configData?: boolean
    loadedAt?: boolean
    isActive?: boolean
    errorMessage?: boolean
  }, ExtArgs["result"]["configurationHistory"]>

  export type ConfigurationHistorySelectScalar = {
    id?: boolean
    configPath?: boolean
    configHash?: boolean
    configData?: boolean
    loadedAt?: boolean
    isActive?: boolean
    errorMessage?: boolean
  }

  export type ConfigurationHistoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "configPath" | "configHash" | "configData" | "loadedAt" | "isActive" | "errorMessage", ExtArgs["result"]["configurationHistory"]>

  export type $ConfigurationHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ConfigurationHistory"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      configPath: string | null
      configHash: string
      configData: Prisma.JsonValue
      loadedAt: Date
      isActive: boolean
      errorMessage: string | null
    }, ExtArgs["result"]["configurationHistory"]>
    composites: {}
  }

  type ConfigurationHistoryGetPayload<S extends boolean | null | undefined | ConfigurationHistoryDefaultArgs> = $Result.GetResult<Prisma.$ConfigurationHistoryPayload, S>

  type ConfigurationHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConfigurationHistoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConfigurationHistoryCountAggregateInputType | true
    }

  export interface ConfigurationHistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ConfigurationHistory'], meta: { name: 'ConfigurationHistory' } }
    /**
     * Find zero or one ConfigurationHistory that matches the filter.
     * @param {ConfigurationHistoryFindUniqueArgs} args - Arguments to find a ConfigurationHistory
     * @example
     * // Get one ConfigurationHistory
     * const configurationHistory = await prisma.configurationHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConfigurationHistoryFindUniqueArgs>(args: SelectSubset<T, ConfigurationHistoryFindUniqueArgs<ExtArgs>>): Prisma__ConfigurationHistoryClient<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ConfigurationHistory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConfigurationHistoryFindUniqueOrThrowArgs} args - Arguments to find a ConfigurationHistory
     * @example
     * // Get one ConfigurationHistory
     * const configurationHistory = await prisma.configurationHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConfigurationHistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, ConfigurationHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConfigurationHistoryClient<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConfigurationHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationHistoryFindFirstArgs} args - Arguments to find a ConfigurationHistory
     * @example
     * // Get one ConfigurationHistory
     * const configurationHistory = await prisma.configurationHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConfigurationHistoryFindFirstArgs>(args?: SelectSubset<T, ConfigurationHistoryFindFirstArgs<ExtArgs>>): Prisma__ConfigurationHistoryClient<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConfigurationHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationHistoryFindFirstOrThrowArgs} args - Arguments to find a ConfigurationHistory
     * @example
     * // Get one ConfigurationHistory
     * const configurationHistory = await prisma.configurationHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConfigurationHistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, ConfigurationHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConfigurationHistoryClient<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ConfigurationHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ConfigurationHistories
     * const configurationHistories = await prisma.configurationHistory.findMany()
     * 
     * // Get first 10 ConfigurationHistories
     * const configurationHistories = await prisma.configurationHistory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const configurationHistoryWithIdOnly = await prisma.configurationHistory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConfigurationHistoryFindManyArgs>(args?: SelectSubset<T, ConfigurationHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ConfigurationHistory.
     * @param {ConfigurationHistoryCreateArgs} args - Arguments to create a ConfigurationHistory.
     * @example
     * // Create one ConfigurationHistory
     * const ConfigurationHistory = await prisma.configurationHistory.create({
     *   data: {
     *     // ... data to create a ConfigurationHistory
     *   }
     * })
     * 
     */
    create<T extends ConfigurationHistoryCreateArgs>(args: SelectSubset<T, ConfigurationHistoryCreateArgs<ExtArgs>>): Prisma__ConfigurationHistoryClient<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ConfigurationHistories.
     * @param {ConfigurationHistoryCreateManyArgs} args - Arguments to create many ConfigurationHistories.
     * @example
     * // Create many ConfigurationHistories
     * const configurationHistory = await prisma.configurationHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConfigurationHistoryCreateManyArgs>(args?: SelectSubset<T, ConfigurationHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ConfigurationHistories and returns the data saved in the database.
     * @param {ConfigurationHistoryCreateManyAndReturnArgs} args - Arguments to create many ConfigurationHistories.
     * @example
     * // Create many ConfigurationHistories
     * const configurationHistory = await prisma.configurationHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ConfigurationHistories and only return the `id`
     * const configurationHistoryWithIdOnly = await prisma.configurationHistory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConfigurationHistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, ConfigurationHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ConfigurationHistory.
     * @param {ConfigurationHistoryDeleteArgs} args - Arguments to delete one ConfigurationHistory.
     * @example
     * // Delete one ConfigurationHistory
     * const ConfigurationHistory = await prisma.configurationHistory.delete({
     *   where: {
     *     // ... filter to delete one ConfigurationHistory
     *   }
     * })
     * 
     */
    delete<T extends ConfigurationHistoryDeleteArgs>(args: SelectSubset<T, ConfigurationHistoryDeleteArgs<ExtArgs>>): Prisma__ConfigurationHistoryClient<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ConfigurationHistory.
     * @param {ConfigurationHistoryUpdateArgs} args - Arguments to update one ConfigurationHistory.
     * @example
     * // Update one ConfigurationHistory
     * const configurationHistory = await prisma.configurationHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConfigurationHistoryUpdateArgs>(args: SelectSubset<T, ConfigurationHistoryUpdateArgs<ExtArgs>>): Prisma__ConfigurationHistoryClient<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ConfigurationHistories.
     * @param {ConfigurationHistoryDeleteManyArgs} args - Arguments to filter ConfigurationHistories to delete.
     * @example
     * // Delete a few ConfigurationHistories
     * const { count } = await prisma.configurationHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConfigurationHistoryDeleteManyArgs>(args?: SelectSubset<T, ConfigurationHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConfigurationHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ConfigurationHistories
     * const configurationHistory = await prisma.configurationHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConfigurationHistoryUpdateManyArgs>(args: SelectSubset<T, ConfigurationHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConfigurationHistories and returns the data updated in the database.
     * @param {ConfigurationHistoryUpdateManyAndReturnArgs} args - Arguments to update many ConfigurationHistories.
     * @example
     * // Update many ConfigurationHistories
     * const configurationHistory = await prisma.configurationHistory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ConfigurationHistories and only return the `id`
     * const configurationHistoryWithIdOnly = await prisma.configurationHistory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ConfigurationHistoryUpdateManyAndReturnArgs>(args: SelectSubset<T, ConfigurationHistoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ConfigurationHistory.
     * @param {ConfigurationHistoryUpsertArgs} args - Arguments to update or create a ConfigurationHistory.
     * @example
     * // Update or create a ConfigurationHistory
     * const configurationHistory = await prisma.configurationHistory.upsert({
     *   create: {
     *     // ... data to create a ConfigurationHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ConfigurationHistory we want to update
     *   }
     * })
     */
    upsert<T extends ConfigurationHistoryUpsertArgs>(args: SelectSubset<T, ConfigurationHistoryUpsertArgs<ExtArgs>>): Prisma__ConfigurationHistoryClient<$Result.GetResult<Prisma.$ConfigurationHistoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ConfigurationHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationHistoryCountArgs} args - Arguments to filter ConfigurationHistories to count.
     * @example
     * // Count the number of ConfigurationHistories
     * const count = await prisma.configurationHistory.count({
     *   where: {
     *     // ... the filter for the ConfigurationHistories we want to count
     *   }
     * })
    **/
    count<T extends ConfigurationHistoryCountArgs>(
      args?: Subset<T, ConfigurationHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConfigurationHistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ConfigurationHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConfigurationHistoryAggregateArgs>(args: Subset<T, ConfigurationHistoryAggregateArgs>): Prisma.PrismaPromise<GetConfigurationHistoryAggregateType<T>>

    /**
     * Group by ConfigurationHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConfigurationHistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConfigurationHistoryGroupByArgs['orderBy'] }
        : { orderBy?: ConfigurationHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConfigurationHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConfigurationHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ConfigurationHistory model
   */
  readonly fields: ConfigurationHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ConfigurationHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConfigurationHistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ConfigurationHistory model
   */
  interface ConfigurationHistoryFieldRefs {
    readonly id: FieldRef<"ConfigurationHistory", 'String'>
    readonly configPath: FieldRef<"ConfigurationHistory", 'String'>
    readonly configHash: FieldRef<"ConfigurationHistory", 'String'>
    readonly configData: FieldRef<"ConfigurationHistory", 'Json'>
    readonly loadedAt: FieldRef<"ConfigurationHistory", 'DateTime'>
    readonly isActive: FieldRef<"ConfigurationHistory", 'Boolean'>
    readonly errorMessage: FieldRef<"ConfigurationHistory", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ConfigurationHistory findUnique
   */
  export type ConfigurationHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * Filter, which ConfigurationHistory to fetch.
     */
    where: ConfigurationHistoryWhereUniqueInput
  }

  /**
   * ConfigurationHistory findUniqueOrThrow
   */
  export type ConfigurationHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * Filter, which ConfigurationHistory to fetch.
     */
    where: ConfigurationHistoryWhereUniqueInput
  }

  /**
   * ConfigurationHistory findFirst
   */
  export type ConfigurationHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * Filter, which ConfigurationHistory to fetch.
     */
    where?: ConfigurationHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConfigurationHistories to fetch.
     */
    orderBy?: ConfigurationHistoryOrderByWithRelationInput | ConfigurationHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConfigurationHistories.
     */
    cursor?: ConfigurationHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConfigurationHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConfigurationHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConfigurationHistories.
     */
    distinct?: ConfigurationHistoryScalarFieldEnum | ConfigurationHistoryScalarFieldEnum[]
  }

  /**
   * ConfigurationHistory findFirstOrThrow
   */
  export type ConfigurationHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * Filter, which ConfigurationHistory to fetch.
     */
    where?: ConfigurationHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConfigurationHistories to fetch.
     */
    orderBy?: ConfigurationHistoryOrderByWithRelationInput | ConfigurationHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConfigurationHistories.
     */
    cursor?: ConfigurationHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConfigurationHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConfigurationHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConfigurationHistories.
     */
    distinct?: ConfigurationHistoryScalarFieldEnum | ConfigurationHistoryScalarFieldEnum[]
  }

  /**
   * ConfigurationHistory findMany
   */
  export type ConfigurationHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * Filter, which ConfigurationHistories to fetch.
     */
    where?: ConfigurationHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConfigurationHistories to fetch.
     */
    orderBy?: ConfigurationHistoryOrderByWithRelationInput | ConfigurationHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ConfigurationHistories.
     */
    cursor?: ConfigurationHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConfigurationHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConfigurationHistories.
     */
    skip?: number
    distinct?: ConfigurationHistoryScalarFieldEnum | ConfigurationHistoryScalarFieldEnum[]
  }

  /**
   * ConfigurationHistory create
   */
  export type ConfigurationHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * The data needed to create a ConfigurationHistory.
     */
    data: XOR<ConfigurationHistoryCreateInput, ConfigurationHistoryUncheckedCreateInput>
  }

  /**
   * ConfigurationHistory createMany
   */
  export type ConfigurationHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ConfigurationHistories.
     */
    data: ConfigurationHistoryCreateManyInput | ConfigurationHistoryCreateManyInput[]
  }

  /**
   * ConfigurationHistory createManyAndReturn
   */
  export type ConfigurationHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * The data used to create many ConfigurationHistories.
     */
    data: ConfigurationHistoryCreateManyInput | ConfigurationHistoryCreateManyInput[]
  }

  /**
   * ConfigurationHistory update
   */
  export type ConfigurationHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * The data needed to update a ConfigurationHistory.
     */
    data: XOR<ConfigurationHistoryUpdateInput, ConfigurationHistoryUncheckedUpdateInput>
    /**
     * Choose, which ConfigurationHistory to update.
     */
    where: ConfigurationHistoryWhereUniqueInput
  }

  /**
   * ConfigurationHistory updateMany
   */
  export type ConfigurationHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ConfigurationHistories.
     */
    data: XOR<ConfigurationHistoryUpdateManyMutationInput, ConfigurationHistoryUncheckedUpdateManyInput>
    /**
     * Filter which ConfigurationHistories to update
     */
    where?: ConfigurationHistoryWhereInput
    /**
     * Limit how many ConfigurationHistories to update.
     */
    limit?: number
  }

  /**
   * ConfigurationHistory updateManyAndReturn
   */
  export type ConfigurationHistoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * The data used to update ConfigurationHistories.
     */
    data: XOR<ConfigurationHistoryUpdateManyMutationInput, ConfigurationHistoryUncheckedUpdateManyInput>
    /**
     * Filter which ConfigurationHistories to update
     */
    where?: ConfigurationHistoryWhereInput
    /**
     * Limit how many ConfigurationHistories to update.
     */
    limit?: number
  }

  /**
   * ConfigurationHistory upsert
   */
  export type ConfigurationHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * The filter to search for the ConfigurationHistory to update in case it exists.
     */
    where: ConfigurationHistoryWhereUniqueInput
    /**
     * In case the ConfigurationHistory found by the `where` argument doesn't exist, create a new ConfigurationHistory with this data.
     */
    create: XOR<ConfigurationHistoryCreateInput, ConfigurationHistoryUncheckedCreateInput>
    /**
     * In case the ConfigurationHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConfigurationHistoryUpdateInput, ConfigurationHistoryUncheckedUpdateInput>
  }

  /**
   * ConfigurationHistory delete
   */
  export type ConfigurationHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
    /**
     * Filter which ConfigurationHistory to delete.
     */
    where: ConfigurationHistoryWhereUniqueInput
  }

  /**
   * ConfigurationHistory deleteMany
   */
  export type ConfigurationHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConfigurationHistories to delete
     */
    where?: ConfigurationHistoryWhereInput
    /**
     * Limit how many ConfigurationHistories to delete.
     */
    limit?: number
  }

  /**
   * ConfigurationHistory without action
   */
  export type ConfigurationHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfigurationHistory
     */
    select?: ConfigurationHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfigurationHistory
     */
    omit?: ConfigurationHistoryOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const MonitorSessionScalarFieldEnum: {
    id: 'id',
    startTime: 'startTime',
    endTime: 'endTime',
    lastDetectedState: 'lastDetectedState',
    lastIdleClearAt: 'lastIdleClearAt',
    lastIdlePromptAt: 'lastIdlePromptAt',
    pendingBootstrap: 'pendingBootstrap',
    clearCompletedAt: 'clearCompletedAt',
    bootstrapCleared: 'bootstrapCleared',
    lastActiveSeenAt: 'lastActiveSeenAt',
    lastPostrunActionAt: 'lastPostrunActionAt',
    lastDecisionTs: 'lastDecisionTs',
    idlePeriodCleared: 'idlePeriodCleared',
    consecIdleCount: 'consecIdleCount',
    consecActiveCount: 'consecActiveCount',
    configPath: 'configPath',
    debugMode: 'debugMode',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type MonitorSessionScalarFieldEnum = (typeof MonitorSessionScalarFieldEnum)[keyof typeof MonitorSessionScalarFieldEnum]


  export const DaemonStatisticsScalarFieldEnum: {
    id: 'id',
    sessionId: 'sessionId',
    startTime: 'startTime',
    uptimeSeconds: 'uptimeSeconds',
    restarts: 'restarts',
    configReloads: 'configReloads',
    totalDetections: 'totalDetections',
    totalRecoveries: 'totalRecoveries',
    errors: 'errors',
    decisionMinIntervalSec: 'decisionMinIntervalSec',
    clearCompletionFallbackSec: 'clearCompletionFallbackSec',
    consecIdleRequired: 'consecIdleRequired',
    inactivityIdleSec: 'inactivityIdleSec',
    minRecoveryIntervalSec: 'minRecoveryIntervalSec',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type DaemonStatisticsScalarFieldEnum = (typeof DaemonStatisticsScalarFieldEnum)[keyof typeof DaemonStatisticsScalarFieldEnum]


  export const ComponentStatusScalarFieldEnum: {
    id: 'id',
    sessionId: 'sessionId',
    name: 'name',
    status: 'status',
    isRunning: 'isRunning',
    startedAt: 'startedAt',
    stoppedAt: 'stoppedAt',
    lastError: 'lastError',
    statistics: 'statistics',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ComponentStatusScalarFieldEnum = (typeof ComponentStatusScalarFieldEnum)[keyof typeof ComponentStatusScalarFieldEnum]


  export const RecoveryActionScalarFieldEnum: {
    id: 'id',
    sessionId: 'sessionId',
    state: 'state',
    actionType: 'actionType',
    timestamp: 'timestamp',
    success: 'success',
    errorMessage: 'errorMessage',
    throttledUntil: 'throttledUntil'
  };

  export type RecoveryActionScalarFieldEnum = (typeof RecoveryActionScalarFieldEnum)[keyof typeof RecoveryActionScalarFieldEnum]


  export const ConfigurationHistoryScalarFieldEnum: {
    id: 'id',
    configPath: 'configPath',
    configHash: 'configHash',
    configData: 'configData',
    loadedAt: 'loadedAt',
    isActive: 'isActive',
    errorMessage: 'errorMessage'
  };

  export type ConfigurationHistoryScalarFieldEnum = (typeof ConfigurationHistoryScalarFieldEnum)[keyof typeof ConfigurationHistoryScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    
  /**
   * Deep Input Types
   */


  export type MonitorSessionWhereInput = {
    AND?: MonitorSessionWhereInput | MonitorSessionWhereInput[]
    OR?: MonitorSessionWhereInput[]
    NOT?: MonitorSessionWhereInput | MonitorSessionWhereInput[]
    id?: StringFilter<"MonitorSession"> | string
    startTime?: DateTimeFilter<"MonitorSession"> | Date | string
    endTime?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    lastDetectedState?: StringFilter<"MonitorSession"> | string
    lastIdleClearAt?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    lastIdlePromptAt?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    pendingBootstrap?: BoolFilter<"MonitorSession"> | boolean
    clearCompletedAt?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    bootstrapCleared?: BoolFilter<"MonitorSession"> | boolean
    lastActiveSeenAt?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    lastPostrunActionAt?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    lastDecisionTs?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    idlePeriodCleared?: BoolFilter<"MonitorSession"> | boolean
    consecIdleCount?: IntFilter<"MonitorSession"> | number
    consecActiveCount?: IntFilter<"MonitorSession"> | number
    configPath?: StringNullableFilter<"MonitorSession"> | string | null
    debugMode?: BoolFilter<"MonitorSession"> | boolean
    createdAt?: DateTimeFilter<"MonitorSession"> | Date | string
    updatedAt?: DateTimeFilter<"MonitorSession"> | Date | string
    statistics?: XOR<DaemonStatisticsNullableScalarRelationFilter, DaemonStatisticsWhereInput> | null
    components?: ComponentStatusListRelationFilter
    recoveryActions?: RecoveryActionListRelationFilter
  }

  export type MonitorSessionOrderByWithRelationInput = {
    id?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrderInput | SortOrder
    lastDetectedState?: SortOrder
    lastIdleClearAt?: SortOrderInput | SortOrder
    lastIdlePromptAt?: SortOrderInput | SortOrder
    pendingBootstrap?: SortOrder
    clearCompletedAt?: SortOrderInput | SortOrder
    bootstrapCleared?: SortOrder
    lastActiveSeenAt?: SortOrderInput | SortOrder
    lastPostrunActionAt?: SortOrderInput | SortOrder
    lastDecisionTs?: SortOrderInput | SortOrder
    idlePeriodCleared?: SortOrder
    consecIdleCount?: SortOrder
    consecActiveCount?: SortOrder
    configPath?: SortOrderInput | SortOrder
    debugMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    statistics?: DaemonStatisticsOrderByWithRelationInput
    components?: ComponentStatusOrderByRelationAggregateInput
    recoveryActions?: RecoveryActionOrderByRelationAggregateInput
  }

  export type MonitorSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MonitorSessionWhereInput | MonitorSessionWhereInput[]
    OR?: MonitorSessionWhereInput[]
    NOT?: MonitorSessionWhereInput | MonitorSessionWhereInput[]
    startTime?: DateTimeFilter<"MonitorSession"> | Date | string
    endTime?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    lastDetectedState?: StringFilter<"MonitorSession"> | string
    lastIdleClearAt?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    lastIdlePromptAt?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    pendingBootstrap?: BoolFilter<"MonitorSession"> | boolean
    clearCompletedAt?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    bootstrapCleared?: BoolFilter<"MonitorSession"> | boolean
    lastActiveSeenAt?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    lastPostrunActionAt?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    lastDecisionTs?: DateTimeNullableFilter<"MonitorSession"> | Date | string | null
    idlePeriodCleared?: BoolFilter<"MonitorSession"> | boolean
    consecIdleCount?: IntFilter<"MonitorSession"> | number
    consecActiveCount?: IntFilter<"MonitorSession"> | number
    configPath?: StringNullableFilter<"MonitorSession"> | string | null
    debugMode?: BoolFilter<"MonitorSession"> | boolean
    createdAt?: DateTimeFilter<"MonitorSession"> | Date | string
    updatedAt?: DateTimeFilter<"MonitorSession"> | Date | string
    statistics?: XOR<DaemonStatisticsNullableScalarRelationFilter, DaemonStatisticsWhereInput> | null
    components?: ComponentStatusListRelationFilter
    recoveryActions?: RecoveryActionListRelationFilter
  }, "id">

  export type MonitorSessionOrderByWithAggregationInput = {
    id?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrderInput | SortOrder
    lastDetectedState?: SortOrder
    lastIdleClearAt?: SortOrderInput | SortOrder
    lastIdlePromptAt?: SortOrderInput | SortOrder
    pendingBootstrap?: SortOrder
    clearCompletedAt?: SortOrderInput | SortOrder
    bootstrapCleared?: SortOrder
    lastActiveSeenAt?: SortOrderInput | SortOrder
    lastPostrunActionAt?: SortOrderInput | SortOrder
    lastDecisionTs?: SortOrderInput | SortOrder
    idlePeriodCleared?: SortOrder
    consecIdleCount?: SortOrder
    consecActiveCount?: SortOrder
    configPath?: SortOrderInput | SortOrder
    debugMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: MonitorSessionCountOrderByAggregateInput
    _avg?: MonitorSessionAvgOrderByAggregateInput
    _max?: MonitorSessionMaxOrderByAggregateInput
    _min?: MonitorSessionMinOrderByAggregateInput
    _sum?: MonitorSessionSumOrderByAggregateInput
  }

  export type MonitorSessionScalarWhereWithAggregatesInput = {
    AND?: MonitorSessionScalarWhereWithAggregatesInput | MonitorSessionScalarWhereWithAggregatesInput[]
    OR?: MonitorSessionScalarWhereWithAggregatesInput[]
    NOT?: MonitorSessionScalarWhereWithAggregatesInput | MonitorSessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MonitorSession"> | string
    startTime?: DateTimeWithAggregatesFilter<"MonitorSession"> | Date | string
    endTime?: DateTimeNullableWithAggregatesFilter<"MonitorSession"> | Date | string | null
    lastDetectedState?: StringWithAggregatesFilter<"MonitorSession"> | string
    lastIdleClearAt?: DateTimeNullableWithAggregatesFilter<"MonitorSession"> | Date | string | null
    lastIdlePromptAt?: DateTimeNullableWithAggregatesFilter<"MonitorSession"> | Date | string | null
    pendingBootstrap?: BoolWithAggregatesFilter<"MonitorSession"> | boolean
    clearCompletedAt?: DateTimeNullableWithAggregatesFilter<"MonitorSession"> | Date | string | null
    bootstrapCleared?: BoolWithAggregatesFilter<"MonitorSession"> | boolean
    lastActiveSeenAt?: DateTimeNullableWithAggregatesFilter<"MonitorSession"> | Date | string | null
    lastPostrunActionAt?: DateTimeNullableWithAggregatesFilter<"MonitorSession"> | Date | string | null
    lastDecisionTs?: DateTimeNullableWithAggregatesFilter<"MonitorSession"> | Date | string | null
    idlePeriodCleared?: BoolWithAggregatesFilter<"MonitorSession"> | boolean
    consecIdleCount?: IntWithAggregatesFilter<"MonitorSession"> | number
    consecActiveCount?: IntWithAggregatesFilter<"MonitorSession"> | number
    configPath?: StringNullableWithAggregatesFilter<"MonitorSession"> | string | null
    debugMode?: BoolWithAggregatesFilter<"MonitorSession"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"MonitorSession"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"MonitorSession"> | Date | string
  }

  export type DaemonStatisticsWhereInput = {
    AND?: DaemonStatisticsWhereInput | DaemonStatisticsWhereInput[]
    OR?: DaemonStatisticsWhereInput[]
    NOT?: DaemonStatisticsWhereInput | DaemonStatisticsWhereInput[]
    id?: StringFilter<"DaemonStatistics"> | string
    sessionId?: StringFilter<"DaemonStatistics"> | string
    startTime?: DateTimeFilter<"DaemonStatistics"> | Date | string
    uptimeSeconds?: FloatFilter<"DaemonStatistics"> | number
    restarts?: IntFilter<"DaemonStatistics"> | number
    configReloads?: IntFilter<"DaemonStatistics"> | number
    totalDetections?: IntFilter<"DaemonStatistics"> | number
    totalRecoveries?: IntFilter<"DaemonStatistics"> | number
    errors?: IntFilter<"DaemonStatistics"> | number
    decisionMinIntervalSec?: FloatFilter<"DaemonStatistics"> | number
    clearCompletionFallbackSec?: FloatFilter<"DaemonStatistics"> | number
    consecIdleRequired?: IntFilter<"DaemonStatistics"> | number
    inactivityIdleSec?: FloatFilter<"DaemonStatistics"> | number
    minRecoveryIntervalSec?: FloatFilter<"DaemonStatistics"> | number
    createdAt?: DateTimeFilter<"DaemonStatistics"> | Date | string
    updatedAt?: DateTimeFilter<"DaemonStatistics"> | Date | string
    session?: XOR<MonitorSessionScalarRelationFilter, MonitorSessionWhereInput>
  }

  export type DaemonStatisticsOrderByWithRelationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    startTime?: SortOrder
    uptimeSeconds?: SortOrder
    restarts?: SortOrder
    configReloads?: SortOrder
    totalDetections?: SortOrder
    totalRecoveries?: SortOrder
    errors?: SortOrder
    decisionMinIntervalSec?: SortOrder
    clearCompletionFallbackSec?: SortOrder
    consecIdleRequired?: SortOrder
    inactivityIdleSec?: SortOrder
    minRecoveryIntervalSec?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    session?: MonitorSessionOrderByWithRelationInput
  }

  export type DaemonStatisticsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sessionId?: string
    AND?: DaemonStatisticsWhereInput | DaemonStatisticsWhereInput[]
    OR?: DaemonStatisticsWhereInput[]
    NOT?: DaemonStatisticsWhereInput | DaemonStatisticsWhereInput[]
    startTime?: DateTimeFilter<"DaemonStatistics"> | Date | string
    uptimeSeconds?: FloatFilter<"DaemonStatistics"> | number
    restarts?: IntFilter<"DaemonStatistics"> | number
    configReloads?: IntFilter<"DaemonStatistics"> | number
    totalDetections?: IntFilter<"DaemonStatistics"> | number
    totalRecoveries?: IntFilter<"DaemonStatistics"> | number
    errors?: IntFilter<"DaemonStatistics"> | number
    decisionMinIntervalSec?: FloatFilter<"DaemonStatistics"> | number
    clearCompletionFallbackSec?: FloatFilter<"DaemonStatistics"> | number
    consecIdleRequired?: IntFilter<"DaemonStatistics"> | number
    inactivityIdleSec?: FloatFilter<"DaemonStatistics"> | number
    minRecoveryIntervalSec?: FloatFilter<"DaemonStatistics"> | number
    createdAt?: DateTimeFilter<"DaemonStatistics"> | Date | string
    updatedAt?: DateTimeFilter<"DaemonStatistics"> | Date | string
    session?: XOR<MonitorSessionScalarRelationFilter, MonitorSessionWhereInput>
  }, "id" | "sessionId">

  export type DaemonStatisticsOrderByWithAggregationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    startTime?: SortOrder
    uptimeSeconds?: SortOrder
    restarts?: SortOrder
    configReloads?: SortOrder
    totalDetections?: SortOrder
    totalRecoveries?: SortOrder
    errors?: SortOrder
    decisionMinIntervalSec?: SortOrder
    clearCompletionFallbackSec?: SortOrder
    consecIdleRequired?: SortOrder
    inactivityIdleSec?: SortOrder
    minRecoveryIntervalSec?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DaemonStatisticsCountOrderByAggregateInput
    _avg?: DaemonStatisticsAvgOrderByAggregateInput
    _max?: DaemonStatisticsMaxOrderByAggregateInput
    _min?: DaemonStatisticsMinOrderByAggregateInput
    _sum?: DaemonStatisticsSumOrderByAggregateInput
  }

  export type DaemonStatisticsScalarWhereWithAggregatesInput = {
    AND?: DaemonStatisticsScalarWhereWithAggregatesInput | DaemonStatisticsScalarWhereWithAggregatesInput[]
    OR?: DaemonStatisticsScalarWhereWithAggregatesInput[]
    NOT?: DaemonStatisticsScalarWhereWithAggregatesInput | DaemonStatisticsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"DaemonStatistics"> | string
    sessionId?: StringWithAggregatesFilter<"DaemonStatistics"> | string
    startTime?: DateTimeWithAggregatesFilter<"DaemonStatistics"> | Date | string
    uptimeSeconds?: FloatWithAggregatesFilter<"DaemonStatistics"> | number
    restarts?: IntWithAggregatesFilter<"DaemonStatistics"> | number
    configReloads?: IntWithAggregatesFilter<"DaemonStatistics"> | number
    totalDetections?: IntWithAggregatesFilter<"DaemonStatistics"> | number
    totalRecoveries?: IntWithAggregatesFilter<"DaemonStatistics"> | number
    errors?: IntWithAggregatesFilter<"DaemonStatistics"> | number
    decisionMinIntervalSec?: FloatWithAggregatesFilter<"DaemonStatistics"> | number
    clearCompletionFallbackSec?: FloatWithAggregatesFilter<"DaemonStatistics"> | number
    consecIdleRequired?: IntWithAggregatesFilter<"DaemonStatistics"> | number
    inactivityIdleSec?: FloatWithAggregatesFilter<"DaemonStatistics"> | number
    minRecoveryIntervalSec?: FloatWithAggregatesFilter<"DaemonStatistics"> | number
    createdAt?: DateTimeWithAggregatesFilter<"DaemonStatistics"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"DaemonStatistics"> | Date | string
  }

  export type ComponentStatusWhereInput = {
    AND?: ComponentStatusWhereInput | ComponentStatusWhereInput[]
    OR?: ComponentStatusWhereInput[]
    NOT?: ComponentStatusWhereInput | ComponentStatusWhereInput[]
    id?: StringFilter<"ComponentStatus"> | string
    sessionId?: StringFilter<"ComponentStatus"> | string
    name?: StringFilter<"ComponentStatus"> | string
    status?: StringFilter<"ComponentStatus"> | string
    isRunning?: BoolFilter<"ComponentStatus"> | boolean
    startedAt?: DateTimeNullableFilter<"ComponentStatus"> | Date | string | null
    stoppedAt?: DateTimeNullableFilter<"ComponentStatus"> | Date | string | null
    lastError?: StringNullableFilter<"ComponentStatus"> | string | null
    statistics?: JsonNullableFilter<"ComponentStatus">
    createdAt?: DateTimeFilter<"ComponentStatus"> | Date | string
    updatedAt?: DateTimeFilter<"ComponentStatus"> | Date | string
    session?: XOR<MonitorSessionScalarRelationFilter, MonitorSessionWhereInput>
  }

  export type ComponentStatusOrderByWithRelationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    name?: SortOrder
    status?: SortOrder
    isRunning?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    stoppedAt?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    statistics?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    session?: MonitorSessionOrderByWithRelationInput
  }

  export type ComponentStatusWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sessionId_name?: ComponentStatusSessionIdNameCompoundUniqueInput
    AND?: ComponentStatusWhereInput | ComponentStatusWhereInput[]
    OR?: ComponentStatusWhereInput[]
    NOT?: ComponentStatusWhereInput | ComponentStatusWhereInput[]
    sessionId?: StringFilter<"ComponentStatus"> | string
    name?: StringFilter<"ComponentStatus"> | string
    status?: StringFilter<"ComponentStatus"> | string
    isRunning?: BoolFilter<"ComponentStatus"> | boolean
    startedAt?: DateTimeNullableFilter<"ComponentStatus"> | Date | string | null
    stoppedAt?: DateTimeNullableFilter<"ComponentStatus"> | Date | string | null
    lastError?: StringNullableFilter<"ComponentStatus"> | string | null
    statistics?: JsonNullableFilter<"ComponentStatus">
    createdAt?: DateTimeFilter<"ComponentStatus"> | Date | string
    updatedAt?: DateTimeFilter<"ComponentStatus"> | Date | string
    session?: XOR<MonitorSessionScalarRelationFilter, MonitorSessionWhereInput>
  }, "id" | "sessionId_name">

  export type ComponentStatusOrderByWithAggregationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    name?: SortOrder
    status?: SortOrder
    isRunning?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    stoppedAt?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    statistics?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ComponentStatusCountOrderByAggregateInput
    _max?: ComponentStatusMaxOrderByAggregateInput
    _min?: ComponentStatusMinOrderByAggregateInput
  }

  export type ComponentStatusScalarWhereWithAggregatesInput = {
    AND?: ComponentStatusScalarWhereWithAggregatesInput | ComponentStatusScalarWhereWithAggregatesInput[]
    OR?: ComponentStatusScalarWhereWithAggregatesInput[]
    NOT?: ComponentStatusScalarWhereWithAggregatesInput | ComponentStatusScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ComponentStatus"> | string
    sessionId?: StringWithAggregatesFilter<"ComponentStatus"> | string
    name?: StringWithAggregatesFilter<"ComponentStatus"> | string
    status?: StringWithAggregatesFilter<"ComponentStatus"> | string
    isRunning?: BoolWithAggregatesFilter<"ComponentStatus"> | boolean
    startedAt?: DateTimeNullableWithAggregatesFilter<"ComponentStatus"> | Date | string | null
    stoppedAt?: DateTimeNullableWithAggregatesFilter<"ComponentStatus"> | Date | string | null
    lastError?: StringNullableWithAggregatesFilter<"ComponentStatus"> | string | null
    statistics?: JsonNullableWithAggregatesFilter<"ComponentStatus">
    createdAt?: DateTimeWithAggregatesFilter<"ComponentStatus"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ComponentStatus"> | Date | string
  }

  export type RecoveryActionWhereInput = {
    AND?: RecoveryActionWhereInput | RecoveryActionWhereInput[]
    OR?: RecoveryActionWhereInput[]
    NOT?: RecoveryActionWhereInput | RecoveryActionWhereInput[]
    id?: StringFilter<"RecoveryAction"> | string
    sessionId?: StringFilter<"RecoveryAction"> | string
    state?: StringFilter<"RecoveryAction"> | string
    actionType?: StringFilter<"RecoveryAction"> | string
    timestamp?: DateTimeFilter<"RecoveryAction"> | Date | string
    success?: BoolFilter<"RecoveryAction"> | boolean
    errorMessage?: StringNullableFilter<"RecoveryAction"> | string | null
    throttledUntil?: DateTimeNullableFilter<"RecoveryAction"> | Date | string | null
    session?: XOR<MonitorSessionScalarRelationFilter, MonitorSessionWhereInput>
  }

  export type RecoveryActionOrderByWithRelationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    state?: SortOrder
    actionType?: SortOrder
    timestamp?: SortOrder
    success?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    throttledUntil?: SortOrderInput | SortOrder
    session?: MonitorSessionOrderByWithRelationInput
  }

  export type RecoveryActionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RecoveryActionWhereInput | RecoveryActionWhereInput[]
    OR?: RecoveryActionWhereInput[]
    NOT?: RecoveryActionWhereInput | RecoveryActionWhereInput[]
    sessionId?: StringFilter<"RecoveryAction"> | string
    state?: StringFilter<"RecoveryAction"> | string
    actionType?: StringFilter<"RecoveryAction"> | string
    timestamp?: DateTimeFilter<"RecoveryAction"> | Date | string
    success?: BoolFilter<"RecoveryAction"> | boolean
    errorMessage?: StringNullableFilter<"RecoveryAction"> | string | null
    throttledUntil?: DateTimeNullableFilter<"RecoveryAction"> | Date | string | null
    session?: XOR<MonitorSessionScalarRelationFilter, MonitorSessionWhereInput>
  }, "id">

  export type RecoveryActionOrderByWithAggregationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    state?: SortOrder
    actionType?: SortOrder
    timestamp?: SortOrder
    success?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    throttledUntil?: SortOrderInput | SortOrder
    _count?: RecoveryActionCountOrderByAggregateInput
    _max?: RecoveryActionMaxOrderByAggregateInput
    _min?: RecoveryActionMinOrderByAggregateInput
  }

  export type RecoveryActionScalarWhereWithAggregatesInput = {
    AND?: RecoveryActionScalarWhereWithAggregatesInput | RecoveryActionScalarWhereWithAggregatesInput[]
    OR?: RecoveryActionScalarWhereWithAggregatesInput[]
    NOT?: RecoveryActionScalarWhereWithAggregatesInput | RecoveryActionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"RecoveryAction"> | string
    sessionId?: StringWithAggregatesFilter<"RecoveryAction"> | string
    state?: StringWithAggregatesFilter<"RecoveryAction"> | string
    actionType?: StringWithAggregatesFilter<"RecoveryAction"> | string
    timestamp?: DateTimeWithAggregatesFilter<"RecoveryAction"> | Date | string
    success?: BoolWithAggregatesFilter<"RecoveryAction"> | boolean
    errorMessage?: StringNullableWithAggregatesFilter<"RecoveryAction"> | string | null
    throttledUntil?: DateTimeNullableWithAggregatesFilter<"RecoveryAction"> | Date | string | null
  }

  export type ConfigurationHistoryWhereInput = {
    AND?: ConfigurationHistoryWhereInput | ConfigurationHistoryWhereInput[]
    OR?: ConfigurationHistoryWhereInput[]
    NOT?: ConfigurationHistoryWhereInput | ConfigurationHistoryWhereInput[]
    id?: StringFilter<"ConfigurationHistory"> | string
    configPath?: StringNullableFilter<"ConfigurationHistory"> | string | null
    configHash?: StringFilter<"ConfigurationHistory"> | string
    configData?: JsonFilter<"ConfigurationHistory">
    loadedAt?: DateTimeFilter<"ConfigurationHistory"> | Date | string
    isActive?: BoolFilter<"ConfigurationHistory"> | boolean
    errorMessage?: StringNullableFilter<"ConfigurationHistory"> | string | null
  }

  export type ConfigurationHistoryOrderByWithRelationInput = {
    id?: SortOrder
    configPath?: SortOrderInput | SortOrder
    configHash?: SortOrder
    configData?: SortOrder
    loadedAt?: SortOrder
    isActive?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
  }

  export type ConfigurationHistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ConfigurationHistoryWhereInput | ConfigurationHistoryWhereInput[]
    OR?: ConfigurationHistoryWhereInput[]
    NOT?: ConfigurationHistoryWhereInput | ConfigurationHistoryWhereInput[]
    configPath?: StringNullableFilter<"ConfigurationHistory"> | string | null
    configHash?: StringFilter<"ConfigurationHistory"> | string
    configData?: JsonFilter<"ConfigurationHistory">
    loadedAt?: DateTimeFilter<"ConfigurationHistory"> | Date | string
    isActive?: BoolFilter<"ConfigurationHistory"> | boolean
    errorMessage?: StringNullableFilter<"ConfigurationHistory"> | string | null
  }, "id">

  export type ConfigurationHistoryOrderByWithAggregationInput = {
    id?: SortOrder
    configPath?: SortOrderInput | SortOrder
    configHash?: SortOrder
    configData?: SortOrder
    loadedAt?: SortOrder
    isActive?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    _count?: ConfigurationHistoryCountOrderByAggregateInput
    _max?: ConfigurationHistoryMaxOrderByAggregateInput
    _min?: ConfigurationHistoryMinOrderByAggregateInput
  }

  export type ConfigurationHistoryScalarWhereWithAggregatesInput = {
    AND?: ConfigurationHistoryScalarWhereWithAggregatesInput | ConfigurationHistoryScalarWhereWithAggregatesInput[]
    OR?: ConfigurationHistoryScalarWhereWithAggregatesInput[]
    NOT?: ConfigurationHistoryScalarWhereWithAggregatesInput | ConfigurationHistoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ConfigurationHistory"> | string
    configPath?: StringNullableWithAggregatesFilter<"ConfigurationHistory"> | string | null
    configHash?: StringWithAggregatesFilter<"ConfigurationHistory"> | string
    configData?: JsonWithAggregatesFilter<"ConfigurationHistory">
    loadedAt?: DateTimeWithAggregatesFilter<"ConfigurationHistory"> | Date | string
    isActive?: BoolWithAggregatesFilter<"ConfigurationHistory"> | boolean
    errorMessage?: StringNullableWithAggregatesFilter<"ConfigurationHistory"> | string | null
  }

  export type MonitorSessionCreateInput = {
    id?: string
    startTime?: Date | string
    endTime?: Date | string | null
    lastDetectedState?: string
    lastIdleClearAt?: Date | string | null
    lastIdlePromptAt?: Date | string | null
    pendingBootstrap?: boolean
    clearCompletedAt?: Date | string | null
    bootstrapCleared?: boolean
    lastActiveSeenAt?: Date | string | null
    lastPostrunActionAt?: Date | string | null
    lastDecisionTs?: Date | string | null
    idlePeriodCleared?: boolean
    consecIdleCount?: number
    consecActiveCount?: number
    configPath?: string | null
    debugMode?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: DaemonStatisticsCreateNestedOneWithoutSessionInput
    components?: ComponentStatusCreateNestedManyWithoutSessionInput
    recoveryActions?: RecoveryActionCreateNestedManyWithoutSessionInput
  }

  export type MonitorSessionUncheckedCreateInput = {
    id?: string
    startTime?: Date | string
    endTime?: Date | string | null
    lastDetectedState?: string
    lastIdleClearAt?: Date | string | null
    lastIdlePromptAt?: Date | string | null
    pendingBootstrap?: boolean
    clearCompletedAt?: Date | string | null
    bootstrapCleared?: boolean
    lastActiveSeenAt?: Date | string | null
    lastPostrunActionAt?: Date | string | null
    lastDecisionTs?: Date | string | null
    idlePeriodCleared?: boolean
    consecIdleCount?: number
    consecActiveCount?: number
    configPath?: string | null
    debugMode?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: DaemonStatisticsUncheckedCreateNestedOneWithoutSessionInput
    components?: ComponentStatusUncheckedCreateNestedManyWithoutSessionInput
    recoveryActions?: RecoveryActionUncheckedCreateNestedManyWithoutSessionInput
  }

  export type MonitorSessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDetectedState?: StringFieldUpdateOperationsInput | string
    lastIdleClearAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastIdlePromptAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pendingBootstrap?: BoolFieldUpdateOperationsInput | boolean
    clearCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bootstrapCleared?: BoolFieldUpdateOperationsInput | boolean
    lastActiveSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastPostrunActionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDecisionTs?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    idlePeriodCleared?: BoolFieldUpdateOperationsInput | boolean
    consecIdleCount?: IntFieldUpdateOperationsInput | number
    consecActiveCount?: IntFieldUpdateOperationsInput | number
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    debugMode?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: DaemonStatisticsUpdateOneWithoutSessionNestedInput
    components?: ComponentStatusUpdateManyWithoutSessionNestedInput
    recoveryActions?: RecoveryActionUpdateManyWithoutSessionNestedInput
  }

  export type MonitorSessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDetectedState?: StringFieldUpdateOperationsInput | string
    lastIdleClearAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastIdlePromptAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pendingBootstrap?: BoolFieldUpdateOperationsInput | boolean
    clearCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bootstrapCleared?: BoolFieldUpdateOperationsInput | boolean
    lastActiveSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastPostrunActionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDecisionTs?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    idlePeriodCleared?: BoolFieldUpdateOperationsInput | boolean
    consecIdleCount?: IntFieldUpdateOperationsInput | number
    consecActiveCount?: IntFieldUpdateOperationsInput | number
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    debugMode?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: DaemonStatisticsUncheckedUpdateOneWithoutSessionNestedInput
    components?: ComponentStatusUncheckedUpdateManyWithoutSessionNestedInput
    recoveryActions?: RecoveryActionUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type MonitorSessionCreateManyInput = {
    id?: string
    startTime?: Date | string
    endTime?: Date | string | null
    lastDetectedState?: string
    lastIdleClearAt?: Date | string | null
    lastIdlePromptAt?: Date | string | null
    pendingBootstrap?: boolean
    clearCompletedAt?: Date | string | null
    bootstrapCleared?: boolean
    lastActiveSeenAt?: Date | string | null
    lastPostrunActionAt?: Date | string | null
    lastDecisionTs?: Date | string | null
    idlePeriodCleared?: boolean
    consecIdleCount?: number
    consecActiveCount?: number
    configPath?: string | null
    debugMode?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MonitorSessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDetectedState?: StringFieldUpdateOperationsInput | string
    lastIdleClearAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastIdlePromptAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pendingBootstrap?: BoolFieldUpdateOperationsInput | boolean
    clearCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bootstrapCleared?: BoolFieldUpdateOperationsInput | boolean
    lastActiveSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastPostrunActionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDecisionTs?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    idlePeriodCleared?: BoolFieldUpdateOperationsInput | boolean
    consecIdleCount?: IntFieldUpdateOperationsInput | number
    consecActiveCount?: IntFieldUpdateOperationsInput | number
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    debugMode?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorSessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDetectedState?: StringFieldUpdateOperationsInput | string
    lastIdleClearAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastIdlePromptAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pendingBootstrap?: BoolFieldUpdateOperationsInput | boolean
    clearCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bootstrapCleared?: BoolFieldUpdateOperationsInput | boolean
    lastActiveSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastPostrunActionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDecisionTs?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    idlePeriodCleared?: BoolFieldUpdateOperationsInput | boolean
    consecIdleCount?: IntFieldUpdateOperationsInput | number
    consecActiveCount?: IntFieldUpdateOperationsInput | number
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    debugMode?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DaemonStatisticsCreateInput = {
    id?: string
    startTime: Date | string
    uptimeSeconds?: number
    restarts?: number
    configReloads?: number
    totalDetections?: number
    totalRecoveries?: number
    errors?: number
    decisionMinIntervalSec?: number
    clearCompletionFallbackSec?: number
    consecIdleRequired?: number
    inactivityIdleSec?: number
    minRecoveryIntervalSec?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    session: MonitorSessionCreateNestedOneWithoutStatisticsInput
  }

  export type DaemonStatisticsUncheckedCreateInput = {
    id?: string
    sessionId: string
    startTime: Date | string
    uptimeSeconds?: number
    restarts?: number
    configReloads?: number
    totalDetections?: number
    totalRecoveries?: number
    errors?: number
    decisionMinIntervalSec?: number
    clearCompletionFallbackSec?: number
    consecIdleRequired?: number
    inactivityIdleSec?: number
    minRecoveryIntervalSec?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DaemonStatisticsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    uptimeSeconds?: FloatFieldUpdateOperationsInput | number
    restarts?: IntFieldUpdateOperationsInput | number
    configReloads?: IntFieldUpdateOperationsInput | number
    totalDetections?: IntFieldUpdateOperationsInput | number
    totalRecoveries?: IntFieldUpdateOperationsInput | number
    errors?: IntFieldUpdateOperationsInput | number
    decisionMinIntervalSec?: FloatFieldUpdateOperationsInput | number
    clearCompletionFallbackSec?: FloatFieldUpdateOperationsInput | number
    consecIdleRequired?: IntFieldUpdateOperationsInput | number
    inactivityIdleSec?: FloatFieldUpdateOperationsInput | number
    minRecoveryIntervalSec?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    session?: MonitorSessionUpdateOneRequiredWithoutStatisticsNestedInput
  }

  export type DaemonStatisticsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    uptimeSeconds?: FloatFieldUpdateOperationsInput | number
    restarts?: IntFieldUpdateOperationsInput | number
    configReloads?: IntFieldUpdateOperationsInput | number
    totalDetections?: IntFieldUpdateOperationsInput | number
    totalRecoveries?: IntFieldUpdateOperationsInput | number
    errors?: IntFieldUpdateOperationsInput | number
    decisionMinIntervalSec?: FloatFieldUpdateOperationsInput | number
    clearCompletionFallbackSec?: FloatFieldUpdateOperationsInput | number
    consecIdleRequired?: IntFieldUpdateOperationsInput | number
    inactivityIdleSec?: FloatFieldUpdateOperationsInput | number
    minRecoveryIntervalSec?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DaemonStatisticsCreateManyInput = {
    id?: string
    sessionId: string
    startTime: Date | string
    uptimeSeconds?: number
    restarts?: number
    configReloads?: number
    totalDetections?: number
    totalRecoveries?: number
    errors?: number
    decisionMinIntervalSec?: number
    clearCompletionFallbackSec?: number
    consecIdleRequired?: number
    inactivityIdleSec?: number
    minRecoveryIntervalSec?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DaemonStatisticsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    uptimeSeconds?: FloatFieldUpdateOperationsInput | number
    restarts?: IntFieldUpdateOperationsInput | number
    configReloads?: IntFieldUpdateOperationsInput | number
    totalDetections?: IntFieldUpdateOperationsInput | number
    totalRecoveries?: IntFieldUpdateOperationsInput | number
    errors?: IntFieldUpdateOperationsInput | number
    decisionMinIntervalSec?: FloatFieldUpdateOperationsInput | number
    clearCompletionFallbackSec?: FloatFieldUpdateOperationsInput | number
    consecIdleRequired?: IntFieldUpdateOperationsInput | number
    inactivityIdleSec?: FloatFieldUpdateOperationsInput | number
    minRecoveryIntervalSec?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DaemonStatisticsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    uptimeSeconds?: FloatFieldUpdateOperationsInput | number
    restarts?: IntFieldUpdateOperationsInput | number
    configReloads?: IntFieldUpdateOperationsInput | number
    totalDetections?: IntFieldUpdateOperationsInput | number
    totalRecoveries?: IntFieldUpdateOperationsInput | number
    errors?: IntFieldUpdateOperationsInput | number
    decisionMinIntervalSec?: FloatFieldUpdateOperationsInput | number
    clearCompletionFallbackSec?: FloatFieldUpdateOperationsInput | number
    consecIdleRequired?: IntFieldUpdateOperationsInput | number
    inactivityIdleSec?: FloatFieldUpdateOperationsInput | number
    minRecoveryIntervalSec?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ComponentStatusCreateInput = {
    id?: string
    name: string
    status: string
    isRunning?: boolean
    startedAt?: Date | string | null
    stoppedAt?: Date | string | null
    lastError?: string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    session: MonitorSessionCreateNestedOneWithoutComponentsInput
  }

  export type ComponentStatusUncheckedCreateInput = {
    id?: string
    sessionId: string
    name: string
    status: string
    isRunning?: boolean
    startedAt?: Date | string | null
    stoppedAt?: Date | string | null
    lastError?: string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ComponentStatusUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isRunning?: BoolFieldUpdateOperationsInput | boolean
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stoppedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    session?: MonitorSessionUpdateOneRequiredWithoutComponentsNestedInput
  }

  export type ComponentStatusUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isRunning?: BoolFieldUpdateOperationsInput | boolean
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stoppedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ComponentStatusCreateManyInput = {
    id?: string
    sessionId: string
    name: string
    status: string
    isRunning?: boolean
    startedAt?: Date | string | null
    stoppedAt?: Date | string | null
    lastError?: string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ComponentStatusUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isRunning?: BoolFieldUpdateOperationsInput | boolean
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stoppedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ComponentStatusUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isRunning?: BoolFieldUpdateOperationsInput | boolean
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stoppedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecoveryActionCreateInput = {
    id?: string
    state: string
    actionType: string
    timestamp?: Date | string
    success?: boolean
    errorMessage?: string | null
    throttledUntil?: Date | string | null
    session: MonitorSessionCreateNestedOneWithoutRecoveryActionsInput
  }

  export type RecoveryActionUncheckedCreateInput = {
    id?: string
    sessionId: string
    state: string
    actionType: string
    timestamp?: Date | string
    success?: boolean
    errorMessage?: string | null
    throttledUntil?: Date | string | null
  }

  export type RecoveryActionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    success?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    throttledUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    session?: MonitorSessionUpdateOneRequiredWithoutRecoveryActionsNestedInput
  }

  export type RecoveryActionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    success?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    throttledUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type RecoveryActionCreateManyInput = {
    id?: string
    sessionId: string
    state: string
    actionType: string
    timestamp?: Date | string
    success?: boolean
    errorMessage?: string | null
    throttledUntil?: Date | string | null
  }

  export type RecoveryActionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    success?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    throttledUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type RecoveryActionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    success?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    throttledUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ConfigurationHistoryCreateInput = {
    id?: string
    configPath?: string | null
    configHash: string
    configData: JsonNullValueInput | InputJsonValue
    loadedAt?: Date | string
    isActive?: boolean
    errorMessage?: string | null
  }

  export type ConfigurationHistoryUncheckedCreateInput = {
    id?: string
    configPath?: string | null
    configHash: string
    configData: JsonNullValueInput | InputJsonValue
    loadedAt?: Date | string
    isActive?: boolean
    errorMessage?: string | null
  }

  export type ConfigurationHistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    configHash?: StringFieldUpdateOperationsInput | string
    configData?: JsonNullValueInput | InputJsonValue
    loadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ConfigurationHistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    configHash?: StringFieldUpdateOperationsInput | string
    configData?: JsonNullValueInput | InputJsonValue
    loadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ConfigurationHistoryCreateManyInput = {
    id?: string
    configPath?: string | null
    configHash: string
    configData: JsonNullValueInput | InputJsonValue
    loadedAt?: Date | string
    isActive?: boolean
    errorMessage?: string | null
  }

  export type ConfigurationHistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    configHash?: StringFieldUpdateOperationsInput | string
    configData?: JsonNullValueInput | InputJsonValue
    loadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ConfigurationHistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    configHash?: StringFieldUpdateOperationsInput | string
    configData?: JsonNullValueInput | InputJsonValue
    loadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DaemonStatisticsNullableScalarRelationFilter = {
    is?: DaemonStatisticsWhereInput | null
    isNot?: DaemonStatisticsWhereInput | null
  }

  export type ComponentStatusListRelationFilter = {
    every?: ComponentStatusWhereInput
    some?: ComponentStatusWhereInput
    none?: ComponentStatusWhereInput
  }

  export type RecoveryActionListRelationFilter = {
    every?: RecoveryActionWhereInput
    some?: RecoveryActionWhereInput
    none?: RecoveryActionWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ComponentStatusOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RecoveryActionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MonitorSessionCountOrderByAggregateInput = {
    id?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    lastDetectedState?: SortOrder
    lastIdleClearAt?: SortOrder
    lastIdlePromptAt?: SortOrder
    pendingBootstrap?: SortOrder
    clearCompletedAt?: SortOrder
    bootstrapCleared?: SortOrder
    lastActiveSeenAt?: SortOrder
    lastPostrunActionAt?: SortOrder
    lastDecisionTs?: SortOrder
    idlePeriodCleared?: SortOrder
    consecIdleCount?: SortOrder
    consecActiveCount?: SortOrder
    configPath?: SortOrder
    debugMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorSessionAvgOrderByAggregateInput = {
    consecIdleCount?: SortOrder
    consecActiveCount?: SortOrder
  }

  export type MonitorSessionMaxOrderByAggregateInput = {
    id?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    lastDetectedState?: SortOrder
    lastIdleClearAt?: SortOrder
    lastIdlePromptAt?: SortOrder
    pendingBootstrap?: SortOrder
    clearCompletedAt?: SortOrder
    bootstrapCleared?: SortOrder
    lastActiveSeenAt?: SortOrder
    lastPostrunActionAt?: SortOrder
    lastDecisionTs?: SortOrder
    idlePeriodCleared?: SortOrder
    consecIdleCount?: SortOrder
    consecActiveCount?: SortOrder
    configPath?: SortOrder
    debugMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorSessionMinOrderByAggregateInput = {
    id?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    lastDetectedState?: SortOrder
    lastIdleClearAt?: SortOrder
    lastIdlePromptAt?: SortOrder
    pendingBootstrap?: SortOrder
    clearCompletedAt?: SortOrder
    bootstrapCleared?: SortOrder
    lastActiveSeenAt?: SortOrder
    lastPostrunActionAt?: SortOrder
    lastDecisionTs?: SortOrder
    idlePeriodCleared?: SortOrder
    consecIdleCount?: SortOrder
    consecActiveCount?: SortOrder
    configPath?: SortOrder
    debugMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorSessionSumOrderByAggregateInput = {
    consecIdleCount?: SortOrder
    consecActiveCount?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type MonitorSessionScalarRelationFilter = {
    is?: MonitorSessionWhereInput
    isNot?: MonitorSessionWhereInput
  }

  export type DaemonStatisticsCountOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    startTime?: SortOrder
    uptimeSeconds?: SortOrder
    restarts?: SortOrder
    configReloads?: SortOrder
    totalDetections?: SortOrder
    totalRecoveries?: SortOrder
    errors?: SortOrder
    decisionMinIntervalSec?: SortOrder
    clearCompletionFallbackSec?: SortOrder
    consecIdleRequired?: SortOrder
    inactivityIdleSec?: SortOrder
    minRecoveryIntervalSec?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DaemonStatisticsAvgOrderByAggregateInput = {
    uptimeSeconds?: SortOrder
    restarts?: SortOrder
    configReloads?: SortOrder
    totalDetections?: SortOrder
    totalRecoveries?: SortOrder
    errors?: SortOrder
    decisionMinIntervalSec?: SortOrder
    clearCompletionFallbackSec?: SortOrder
    consecIdleRequired?: SortOrder
    inactivityIdleSec?: SortOrder
    minRecoveryIntervalSec?: SortOrder
  }

  export type DaemonStatisticsMaxOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    startTime?: SortOrder
    uptimeSeconds?: SortOrder
    restarts?: SortOrder
    configReloads?: SortOrder
    totalDetections?: SortOrder
    totalRecoveries?: SortOrder
    errors?: SortOrder
    decisionMinIntervalSec?: SortOrder
    clearCompletionFallbackSec?: SortOrder
    consecIdleRequired?: SortOrder
    inactivityIdleSec?: SortOrder
    minRecoveryIntervalSec?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DaemonStatisticsMinOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    startTime?: SortOrder
    uptimeSeconds?: SortOrder
    restarts?: SortOrder
    configReloads?: SortOrder
    totalDetections?: SortOrder
    totalRecoveries?: SortOrder
    errors?: SortOrder
    decisionMinIntervalSec?: SortOrder
    clearCompletionFallbackSec?: SortOrder
    consecIdleRequired?: SortOrder
    inactivityIdleSec?: SortOrder
    minRecoveryIntervalSec?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DaemonStatisticsSumOrderByAggregateInput = {
    uptimeSeconds?: SortOrder
    restarts?: SortOrder
    configReloads?: SortOrder
    totalDetections?: SortOrder
    totalRecoveries?: SortOrder
    errors?: SortOrder
    decisionMinIntervalSec?: SortOrder
    clearCompletionFallbackSec?: SortOrder
    consecIdleRequired?: SortOrder
    inactivityIdleSec?: SortOrder
    minRecoveryIntervalSec?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ComponentStatusSessionIdNameCompoundUniqueInput = {
    sessionId: string
    name: string
  }

  export type ComponentStatusCountOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    name?: SortOrder
    status?: SortOrder
    isRunning?: SortOrder
    startedAt?: SortOrder
    stoppedAt?: SortOrder
    lastError?: SortOrder
    statistics?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ComponentStatusMaxOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    name?: SortOrder
    status?: SortOrder
    isRunning?: SortOrder
    startedAt?: SortOrder
    stoppedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ComponentStatusMinOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    name?: SortOrder
    status?: SortOrder
    isRunning?: SortOrder
    startedAt?: SortOrder
    stoppedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type RecoveryActionCountOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    state?: SortOrder
    actionType?: SortOrder
    timestamp?: SortOrder
    success?: SortOrder
    errorMessage?: SortOrder
    throttledUntil?: SortOrder
  }

  export type RecoveryActionMaxOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    state?: SortOrder
    actionType?: SortOrder
    timestamp?: SortOrder
    success?: SortOrder
    errorMessage?: SortOrder
    throttledUntil?: SortOrder
  }

  export type RecoveryActionMinOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    state?: SortOrder
    actionType?: SortOrder
    timestamp?: SortOrder
    success?: SortOrder
    errorMessage?: SortOrder
    throttledUntil?: SortOrder
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ConfigurationHistoryCountOrderByAggregateInput = {
    id?: SortOrder
    configPath?: SortOrder
    configHash?: SortOrder
    configData?: SortOrder
    loadedAt?: SortOrder
    isActive?: SortOrder
    errorMessage?: SortOrder
  }

  export type ConfigurationHistoryMaxOrderByAggregateInput = {
    id?: SortOrder
    configPath?: SortOrder
    configHash?: SortOrder
    loadedAt?: SortOrder
    isActive?: SortOrder
    errorMessage?: SortOrder
  }

  export type ConfigurationHistoryMinOrderByAggregateInput = {
    id?: SortOrder
    configPath?: SortOrder
    configHash?: SortOrder
    loadedAt?: SortOrder
    isActive?: SortOrder
    errorMessage?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type DaemonStatisticsCreateNestedOneWithoutSessionInput = {
    create?: XOR<DaemonStatisticsCreateWithoutSessionInput, DaemonStatisticsUncheckedCreateWithoutSessionInput>
    connectOrCreate?: DaemonStatisticsCreateOrConnectWithoutSessionInput
    connect?: DaemonStatisticsWhereUniqueInput
  }

  export type ComponentStatusCreateNestedManyWithoutSessionInput = {
    create?: XOR<ComponentStatusCreateWithoutSessionInput, ComponentStatusUncheckedCreateWithoutSessionInput> | ComponentStatusCreateWithoutSessionInput[] | ComponentStatusUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: ComponentStatusCreateOrConnectWithoutSessionInput | ComponentStatusCreateOrConnectWithoutSessionInput[]
    createMany?: ComponentStatusCreateManySessionInputEnvelope
    connect?: ComponentStatusWhereUniqueInput | ComponentStatusWhereUniqueInput[]
  }

  export type RecoveryActionCreateNestedManyWithoutSessionInput = {
    create?: XOR<RecoveryActionCreateWithoutSessionInput, RecoveryActionUncheckedCreateWithoutSessionInput> | RecoveryActionCreateWithoutSessionInput[] | RecoveryActionUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: RecoveryActionCreateOrConnectWithoutSessionInput | RecoveryActionCreateOrConnectWithoutSessionInput[]
    createMany?: RecoveryActionCreateManySessionInputEnvelope
    connect?: RecoveryActionWhereUniqueInput | RecoveryActionWhereUniqueInput[]
  }

  export type DaemonStatisticsUncheckedCreateNestedOneWithoutSessionInput = {
    create?: XOR<DaemonStatisticsCreateWithoutSessionInput, DaemonStatisticsUncheckedCreateWithoutSessionInput>
    connectOrCreate?: DaemonStatisticsCreateOrConnectWithoutSessionInput
    connect?: DaemonStatisticsWhereUniqueInput
  }

  export type ComponentStatusUncheckedCreateNestedManyWithoutSessionInput = {
    create?: XOR<ComponentStatusCreateWithoutSessionInput, ComponentStatusUncheckedCreateWithoutSessionInput> | ComponentStatusCreateWithoutSessionInput[] | ComponentStatusUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: ComponentStatusCreateOrConnectWithoutSessionInput | ComponentStatusCreateOrConnectWithoutSessionInput[]
    createMany?: ComponentStatusCreateManySessionInputEnvelope
    connect?: ComponentStatusWhereUniqueInput | ComponentStatusWhereUniqueInput[]
  }

  export type RecoveryActionUncheckedCreateNestedManyWithoutSessionInput = {
    create?: XOR<RecoveryActionCreateWithoutSessionInput, RecoveryActionUncheckedCreateWithoutSessionInput> | RecoveryActionCreateWithoutSessionInput[] | RecoveryActionUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: RecoveryActionCreateOrConnectWithoutSessionInput | RecoveryActionCreateOrConnectWithoutSessionInput[]
    createMany?: RecoveryActionCreateManySessionInputEnvelope
    connect?: RecoveryActionWhereUniqueInput | RecoveryActionWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DaemonStatisticsUpdateOneWithoutSessionNestedInput = {
    create?: XOR<DaemonStatisticsCreateWithoutSessionInput, DaemonStatisticsUncheckedCreateWithoutSessionInput>
    connectOrCreate?: DaemonStatisticsCreateOrConnectWithoutSessionInput
    upsert?: DaemonStatisticsUpsertWithoutSessionInput
    disconnect?: DaemonStatisticsWhereInput | boolean
    delete?: DaemonStatisticsWhereInput | boolean
    connect?: DaemonStatisticsWhereUniqueInput
    update?: XOR<XOR<DaemonStatisticsUpdateToOneWithWhereWithoutSessionInput, DaemonStatisticsUpdateWithoutSessionInput>, DaemonStatisticsUncheckedUpdateWithoutSessionInput>
  }

  export type ComponentStatusUpdateManyWithoutSessionNestedInput = {
    create?: XOR<ComponentStatusCreateWithoutSessionInput, ComponentStatusUncheckedCreateWithoutSessionInput> | ComponentStatusCreateWithoutSessionInput[] | ComponentStatusUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: ComponentStatusCreateOrConnectWithoutSessionInput | ComponentStatusCreateOrConnectWithoutSessionInput[]
    upsert?: ComponentStatusUpsertWithWhereUniqueWithoutSessionInput | ComponentStatusUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: ComponentStatusCreateManySessionInputEnvelope
    set?: ComponentStatusWhereUniqueInput | ComponentStatusWhereUniqueInput[]
    disconnect?: ComponentStatusWhereUniqueInput | ComponentStatusWhereUniqueInput[]
    delete?: ComponentStatusWhereUniqueInput | ComponentStatusWhereUniqueInput[]
    connect?: ComponentStatusWhereUniqueInput | ComponentStatusWhereUniqueInput[]
    update?: ComponentStatusUpdateWithWhereUniqueWithoutSessionInput | ComponentStatusUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: ComponentStatusUpdateManyWithWhereWithoutSessionInput | ComponentStatusUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: ComponentStatusScalarWhereInput | ComponentStatusScalarWhereInput[]
  }

  export type RecoveryActionUpdateManyWithoutSessionNestedInput = {
    create?: XOR<RecoveryActionCreateWithoutSessionInput, RecoveryActionUncheckedCreateWithoutSessionInput> | RecoveryActionCreateWithoutSessionInput[] | RecoveryActionUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: RecoveryActionCreateOrConnectWithoutSessionInput | RecoveryActionCreateOrConnectWithoutSessionInput[]
    upsert?: RecoveryActionUpsertWithWhereUniqueWithoutSessionInput | RecoveryActionUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: RecoveryActionCreateManySessionInputEnvelope
    set?: RecoveryActionWhereUniqueInput | RecoveryActionWhereUniqueInput[]
    disconnect?: RecoveryActionWhereUniqueInput | RecoveryActionWhereUniqueInput[]
    delete?: RecoveryActionWhereUniqueInput | RecoveryActionWhereUniqueInput[]
    connect?: RecoveryActionWhereUniqueInput | RecoveryActionWhereUniqueInput[]
    update?: RecoveryActionUpdateWithWhereUniqueWithoutSessionInput | RecoveryActionUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: RecoveryActionUpdateManyWithWhereWithoutSessionInput | RecoveryActionUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: RecoveryActionScalarWhereInput | RecoveryActionScalarWhereInput[]
  }

  export type DaemonStatisticsUncheckedUpdateOneWithoutSessionNestedInput = {
    create?: XOR<DaemonStatisticsCreateWithoutSessionInput, DaemonStatisticsUncheckedCreateWithoutSessionInput>
    connectOrCreate?: DaemonStatisticsCreateOrConnectWithoutSessionInput
    upsert?: DaemonStatisticsUpsertWithoutSessionInput
    disconnect?: DaemonStatisticsWhereInput | boolean
    delete?: DaemonStatisticsWhereInput | boolean
    connect?: DaemonStatisticsWhereUniqueInput
    update?: XOR<XOR<DaemonStatisticsUpdateToOneWithWhereWithoutSessionInput, DaemonStatisticsUpdateWithoutSessionInput>, DaemonStatisticsUncheckedUpdateWithoutSessionInput>
  }

  export type ComponentStatusUncheckedUpdateManyWithoutSessionNestedInput = {
    create?: XOR<ComponentStatusCreateWithoutSessionInput, ComponentStatusUncheckedCreateWithoutSessionInput> | ComponentStatusCreateWithoutSessionInput[] | ComponentStatusUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: ComponentStatusCreateOrConnectWithoutSessionInput | ComponentStatusCreateOrConnectWithoutSessionInput[]
    upsert?: ComponentStatusUpsertWithWhereUniqueWithoutSessionInput | ComponentStatusUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: ComponentStatusCreateManySessionInputEnvelope
    set?: ComponentStatusWhereUniqueInput | ComponentStatusWhereUniqueInput[]
    disconnect?: ComponentStatusWhereUniqueInput | ComponentStatusWhereUniqueInput[]
    delete?: ComponentStatusWhereUniqueInput | ComponentStatusWhereUniqueInput[]
    connect?: ComponentStatusWhereUniqueInput | ComponentStatusWhereUniqueInput[]
    update?: ComponentStatusUpdateWithWhereUniqueWithoutSessionInput | ComponentStatusUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: ComponentStatusUpdateManyWithWhereWithoutSessionInput | ComponentStatusUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: ComponentStatusScalarWhereInput | ComponentStatusScalarWhereInput[]
  }

  export type RecoveryActionUncheckedUpdateManyWithoutSessionNestedInput = {
    create?: XOR<RecoveryActionCreateWithoutSessionInput, RecoveryActionUncheckedCreateWithoutSessionInput> | RecoveryActionCreateWithoutSessionInput[] | RecoveryActionUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: RecoveryActionCreateOrConnectWithoutSessionInput | RecoveryActionCreateOrConnectWithoutSessionInput[]
    upsert?: RecoveryActionUpsertWithWhereUniqueWithoutSessionInput | RecoveryActionUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: RecoveryActionCreateManySessionInputEnvelope
    set?: RecoveryActionWhereUniqueInput | RecoveryActionWhereUniqueInput[]
    disconnect?: RecoveryActionWhereUniqueInput | RecoveryActionWhereUniqueInput[]
    delete?: RecoveryActionWhereUniqueInput | RecoveryActionWhereUniqueInput[]
    connect?: RecoveryActionWhereUniqueInput | RecoveryActionWhereUniqueInput[]
    update?: RecoveryActionUpdateWithWhereUniqueWithoutSessionInput | RecoveryActionUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: RecoveryActionUpdateManyWithWhereWithoutSessionInput | RecoveryActionUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: RecoveryActionScalarWhereInput | RecoveryActionScalarWhereInput[]
  }

  export type MonitorSessionCreateNestedOneWithoutStatisticsInput = {
    create?: XOR<MonitorSessionCreateWithoutStatisticsInput, MonitorSessionUncheckedCreateWithoutStatisticsInput>
    connectOrCreate?: MonitorSessionCreateOrConnectWithoutStatisticsInput
    connect?: MonitorSessionWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type MonitorSessionUpdateOneRequiredWithoutStatisticsNestedInput = {
    create?: XOR<MonitorSessionCreateWithoutStatisticsInput, MonitorSessionUncheckedCreateWithoutStatisticsInput>
    connectOrCreate?: MonitorSessionCreateOrConnectWithoutStatisticsInput
    upsert?: MonitorSessionUpsertWithoutStatisticsInput
    connect?: MonitorSessionWhereUniqueInput
    update?: XOR<XOR<MonitorSessionUpdateToOneWithWhereWithoutStatisticsInput, MonitorSessionUpdateWithoutStatisticsInput>, MonitorSessionUncheckedUpdateWithoutStatisticsInput>
  }

  export type MonitorSessionCreateNestedOneWithoutComponentsInput = {
    create?: XOR<MonitorSessionCreateWithoutComponentsInput, MonitorSessionUncheckedCreateWithoutComponentsInput>
    connectOrCreate?: MonitorSessionCreateOrConnectWithoutComponentsInput
    connect?: MonitorSessionWhereUniqueInput
  }

  export type MonitorSessionUpdateOneRequiredWithoutComponentsNestedInput = {
    create?: XOR<MonitorSessionCreateWithoutComponentsInput, MonitorSessionUncheckedCreateWithoutComponentsInput>
    connectOrCreate?: MonitorSessionCreateOrConnectWithoutComponentsInput
    upsert?: MonitorSessionUpsertWithoutComponentsInput
    connect?: MonitorSessionWhereUniqueInput
    update?: XOR<XOR<MonitorSessionUpdateToOneWithWhereWithoutComponentsInput, MonitorSessionUpdateWithoutComponentsInput>, MonitorSessionUncheckedUpdateWithoutComponentsInput>
  }

  export type MonitorSessionCreateNestedOneWithoutRecoveryActionsInput = {
    create?: XOR<MonitorSessionCreateWithoutRecoveryActionsInput, MonitorSessionUncheckedCreateWithoutRecoveryActionsInput>
    connectOrCreate?: MonitorSessionCreateOrConnectWithoutRecoveryActionsInput
    connect?: MonitorSessionWhereUniqueInput
  }

  export type MonitorSessionUpdateOneRequiredWithoutRecoveryActionsNestedInput = {
    create?: XOR<MonitorSessionCreateWithoutRecoveryActionsInput, MonitorSessionUncheckedCreateWithoutRecoveryActionsInput>
    connectOrCreate?: MonitorSessionCreateOrConnectWithoutRecoveryActionsInput
    upsert?: MonitorSessionUpsertWithoutRecoveryActionsInput
    connect?: MonitorSessionWhereUniqueInput
    update?: XOR<XOR<MonitorSessionUpdateToOneWithWhereWithoutRecoveryActionsInput, MonitorSessionUpdateWithoutRecoveryActionsInput>, MonitorSessionUncheckedUpdateWithoutRecoveryActionsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DaemonStatisticsCreateWithoutSessionInput = {
    id?: string
    startTime: Date | string
    uptimeSeconds?: number
    restarts?: number
    configReloads?: number
    totalDetections?: number
    totalRecoveries?: number
    errors?: number
    decisionMinIntervalSec?: number
    clearCompletionFallbackSec?: number
    consecIdleRequired?: number
    inactivityIdleSec?: number
    minRecoveryIntervalSec?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DaemonStatisticsUncheckedCreateWithoutSessionInput = {
    id?: string
    startTime: Date | string
    uptimeSeconds?: number
    restarts?: number
    configReloads?: number
    totalDetections?: number
    totalRecoveries?: number
    errors?: number
    decisionMinIntervalSec?: number
    clearCompletionFallbackSec?: number
    consecIdleRequired?: number
    inactivityIdleSec?: number
    minRecoveryIntervalSec?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DaemonStatisticsCreateOrConnectWithoutSessionInput = {
    where: DaemonStatisticsWhereUniqueInput
    create: XOR<DaemonStatisticsCreateWithoutSessionInput, DaemonStatisticsUncheckedCreateWithoutSessionInput>
  }

  export type ComponentStatusCreateWithoutSessionInput = {
    id?: string
    name: string
    status: string
    isRunning?: boolean
    startedAt?: Date | string | null
    stoppedAt?: Date | string | null
    lastError?: string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ComponentStatusUncheckedCreateWithoutSessionInput = {
    id?: string
    name: string
    status: string
    isRunning?: boolean
    startedAt?: Date | string | null
    stoppedAt?: Date | string | null
    lastError?: string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ComponentStatusCreateOrConnectWithoutSessionInput = {
    where: ComponentStatusWhereUniqueInput
    create: XOR<ComponentStatusCreateWithoutSessionInput, ComponentStatusUncheckedCreateWithoutSessionInput>
  }

  export type ComponentStatusCreateManySessionInputEnvelope = {
    data: ComponentStatusCreateManySessionInput | ComponentStatusCreateManySessionInput[]
  }

  export type RecoveryActionCreateWithoutSessionInput = {
    id?: string
    state: string
    actionType: string
    timestamp?: Date | string
    success?: boolean
    errorMessage?: string | null
    throttledUntil?: Date | string | null
  }

  export type RecoveryActionUncheckedCreateWithoutSessionInput = {
    id?: string
    state: string
    actionType: string
    timestamp?: Date | string
    success?: boolean
    errorMessage?: string | null
    throttledUntil?: Date | string | null
  }

  export type RecoveryActionCreateOrConnectWithoutSessionInput = {
    where: RecoveryActionWhereUniqueInput
    create: XOR<RecoveryActionCreateWithoutSessionInput, RecoveryActionUncheckedCreateWithoutSessionInput>
  }

  export type RecoveryActionCreateManySessionInputEnvelope = {
    data: RecoveryActionCreateManySessionInput | RecoveryActionCreateManySessionInput[]
  }

  export type DaemonStatisticsUpsertWithoutSessionInput = {
    update: XOR<DaemonStatisticsUpdateWithoutSessionInput, DaemonStatisticsUncheckedUpdateWithoutSessionInput>
    create: XOR<DaemonStatisticsCreateWithoutSessionInput, DaemonStatisticsUncheckedCreateWithoutSessionInput>
    where?: DaemonStatisticsWhereInput
  }

  export type DaemonStatisticsUpdateToOneWithWhereWithoutSessionInput = {
    where?: DaemonStatisticsWhereInput
    data: XOR<DaemonStatisticsUpdateWithoutSessionInput, DaemonStatisticsUncheckedUpdateWithoutSessionInput>
  }

  export type DaemonStatisticsUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    uptimeSeconds?: FloatFieldUpdateOperationsInput | number
    restarts?: IntFieldUpdateOperationsInput | number
    configReloads?: IntFieldUpdateOperationsInput | number
    totalDetections?: IntFieldUpdateOperationsInput | number
    totalRecoveries?: IntFieldUpdateOperationsInput | number
    errors?: IntFieldUpdateOperationsInput | number
    decisionMinIntervalSec?: FloatFieldUpdateOperationsInput | number
    clearCompletionFallbackSec?: FloatFieldUpdateOperationsInput | number
    consecIdleRequired?: IntFieldUpdateOperationsInput | number
    inactivityIdleSec?: FloatFieldUpdateOperationsInput | number
    minRecoveryIntervalSec?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DaemonStatisticsUncheckedUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    uptimeSeconds?: FloatFieldUpdateOperationsInput | number
    restarts?: IntFieldUpdateOperationsInput | number
    configReloads?: IntFieldUpdateOperationsInput | number
    totalDetections?: IntFieldUpdateOperationsInput | number
    totalRecoveries?: IntFieldUpdateOperationsInput | number
    errors?: IntFieldUpdateOperationsInput | number
    decisionMinIntervalSec?: FloatFieldUpdateOperationsInput | number
    clearCompletionFallbackSec?: FloatFieldUpdateOperationsInput | number
    consecIdleRequired?: IntFieldUpdateOperationsInput | number
    inactivityIdleSec?: FloatFieldUpdateOperationsInput | number
    minRecoveryIntervalSec?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ComponentStatusUpsertWithWhereUniqueWithoutSessionInput = {
    where: ComponentStatusWhereUniqueInput
    update: XOR<ComponentStatusUpdateWithoutSessionInput, ComponentStatusUncheckedUpdateWithoutSessionInput>
    create: XOR<ComponentStatusCreateWithoutSessionInput, ComponentStatusUncheckedCreateWithoutSessionInput>
  }

  export type ComponentStatusUpdateWithWhereUniqueWithoutSessionInput = {
    where: ComponentStatusWhereUniqueInput
    data: XOR<ComponentStatusUpdateWithoutSessionInput, ComponentStatusUncheckedUpdateWithoutSessionInput>
  }

  export type ComponentStatusUpdateManyWithWhereWithoutSessionInput = {
    where: ComponentStatusScalarWhereInput
    data: XOR<ComponentStatusUpdateManyMutationInput, ComponentStatusUncheckedUpdateManyWithoutSessionInput>
  }

  export type ComponentStatusScalarWhereInput = {
    AND?: ComponentStatusScalarWhereInput | ComponentStatusScalarWhereInput[]
    OR?: ComponentStatusScalarWhereInput[]
    NOT?: ComponentStatusScalarWhereInput | ComponentStatusScalarWhereInput[]
    id?: StringFilter<"ComponentStatus"> | string
    sessionId?: StringFilter<"ComponentStatus"> | string
    name?: StringFilter<"ComponentStatus"> | string
    status?: StringFilter<"ComponentStatus"> | string
    isRunning?: BoolFilter<"ComponentStatus"> | boolean
    startedAt?: DateTimeNullableFilter<"ComponentStatus"> | Date | string | null
    stoppedAt?: DateTimeNullableFilter<"ComponentStatus"> | Date | string | null
    lastError?: StringNullableFilter<"ComponentStatus"> | string | null
    statistics?: JsonNullableFilter<"ComponentStatus">
    createdAt?: DateTimeFilter<"ComponentStatus"> | Date | string
    updatedAt?: DateTimeFilter<"ComponentStatus"> | Date | string
  }

  export type RecoveryActionUpsertWithWhereUniqueWithoutSessionInput = {
    where: RecoveryActionWhereUniqueInput
    update: XOR<RecoveryActionUpdateWithoutSessionInput, RecoveryActionUncheckedUpdateWithoutSessionInput>
    create: XOR<RecoveryActionCreateWithoutSessionInput, RecoveryActionUncheckedCreateWithoutSessionInput>
  }

  export type RecoveryActionUpdateWithWhereUniqueWithoutSessionInput = {
    where: RecoveryActionWhereUniqueInput
    data: XOR<RecoveryActionUpdateWithoutSessionInput, RecoveryActionUncheckedUpdateWithoutSessionInput>
  }

  export type RecoveryActionUpdateManyWithWhereWithoutSessionInput = {
    where: RecoveryActionScalarWhereInput
    data: XOR<RecoveryActionUpdateManyMutationInput, RecoveryActionUncheckedUpdateManyWithoutSessionInput>
  }

  export type RecoveryActionScalarWhereInput = {
    AND?: RecoveryActionScalarWhereInput | RecoveryActionScalarWhereInput[]
    OR?: RecoveryActionScalarWhereInput[]
    NOT?: RecoveryActionScalarWhereInput | RecoveryActionScalarWhereInput[]
    id?: StringFilter<"RecoveryAction"> | string
    sessionId?: StringFilter<"RecoveryAction"> | string
    state?: StringFilter<"RecoveryAction"> | string
    actionType?: StringFilter<"RecoveryAction"> | string
    timestamp?: DateTimeFilter<"RecoveryAction"> | Date | string
    success?: BoolFilter<"RecoveryAction"> | boolean
    errorMessage?: StringNullableFilter<"RecoveryAction"> | string | null
    throttledUntil?: DateTimeNullableFilter<"RecoveryAction"> | Date | string | null
  }

  export type MonitorSessionCreateWithoutStatisticsInput = {
    id?: string
    startTime?: Date | string
    endTime?: Date | string | null
    lastDetectedState?: string
    lastIdleClearAt?: Date | string | null
    lastIdlePromptAt?: Date | string | null
    pendingBootstrap?: boolean
    clearCompletedAt?: Date | string | null
    bootstrapCleared?: boolean
    lastActiveSeenAt?: Date | string | null
    lastPostrunActionAt?: Date | string | null
    lastDecisionTs?: Date | string | null
    idlePeriodCleared?: boolean
    consecIdleCount?: number
    consecActiveCount?: number
    configPath?: string | null
    debugMode?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    components?: ComponentStatusCreateNestedManyWithoutSessionInput
    recoveryActions?: RecoveryActionCreateNestedManyWithoutSessionInput
  }

  export type MonitorSessionUncheckedCreateWithoutStatisticsInput = {
    id?: string
    startTime?: Date | string
    endTime?: Date | string | null
    lastDetectedState?: string
    lastIdleClearAt?: Date | string | null
    lastIdlePromptAt?: Date | string | null
    pendingBootstrap?: boolean
    clearCompletedAt?: Date | string | null
    bootstrapCleared?: boolean
    lastActiveSeenAt?: Date | string | null
    lastPostrunActionAt?: Date | string | null
    lastDecisionTs?: Date | string | null
    idlePeriodCleared?: boolean
    consecIdleCount?: number
    consecActiveCount?: number
    configPath?: string | null
    debugMode?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    components?: ComponentStatusUncheckedCreateNestedManyWithoutSessionInput
    recoveryActions?: RecoveryActionUncheckedCreateNestedManyWithoutSessionInput
  }

  export type MonitorSessionCreateOrConnectWithoutStatisticsInput = {
    where: MonitorSessionWhereUniqueInput
    create: XOR<MonitorSessionCreateWithoutStatisticsInput, MonitorSessionUncheckedCreateWithoutStatisticsInput>
  }

  export type MonitorSessionUpsertWithoutStatisticsInput = {
    update: XOR<MonitorSessionUpdateWithoutStatisticsInput, MonitorSessionUncheckedUpdateWithoutStatisticsInput>
    create: XOR<MonitorSessionCreateWithoutStatisticsInput, MonitorSessionUncheckedCreateWithoutStatisticsInput>
    where?: MonitorSessionWhereInput
  }

  export type MonitorSessionUpdateToOneWithWhereWithoutStatisticsInput = {
    where?: MonitorSessionWhereInput
    data: XOR<MonitorSessionUpdateWithoutStatisticsInput, MonitorSessionUncheckedUpdateWithoutStatisticsInput>
  }

  export type MonitorSessionUpdateWithoutStatisticsInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDetectedState?: StringFieldUpdateOperationsInput | string
    lastIdleClearAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastIdlePromptAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pendingBootstrap?: BoolFieldUpdateOperationsInput | boolean
    clearCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bootstrapCleared?: BoolFieldUpdateOperationsInput | boolean
    lastActiveSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastPostrunActionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDecisionTs?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    idlePeriodCleared?: BoolFieldUpdateOperationsInput | boolean
    consecIdleCount?: IntFieldUpdateOperationsInput | number
    consecActiveCount?: IntFieldUpdateOperationsInput | number
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    debugMode?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    components?: ComponentStatusUpdateManyWithoutSessionNestedInput
    recoveryActions?: RecoveryActionUpdateManyWithoutSessionNestedInput
  }

  export type MonitorSessionUncheckedUpdateWithoutStatisticsInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDetectedState?: StringFieldUpdateOperationsInput | string
    lastIdleClearAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastIdlePromptAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pendingBootstrap?: BoolFieldUpdateOperationsInput | boolean
    clearCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bootstrapCleared?: BoolFieldUpdateOperationsInput | boolean
    lastActiveSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastPostrunActionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDecisionTs?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    idlePeriodCleared?: BoolFieldUpdateOperationsInput | boolean
    consecIdleCount?: IntFieldUpdateOperationsInput | number
    consecActiveCount?: IntFieldUpdateOperationsInput | number
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    debugMode?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    components?: ComponentStatusUncheckedUpdateManyWithoutSessionNestedInput
    recoveryActions?: RecoveryActionUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type MonitorSessionCreateWithoutComponentsInput = {
    id?: string
    startTime?: Date | string
    endTime?: Date | string | null
    lastDetectedState?: string
    lastIdleClearAt?: Date | string | null
    lastIdlePromptAt?: Date | string | null
    pendingBootstrap?: boolean
    clearCompletedAt?: Date | string | null
    bootstrapCleared?: boolean
    lastActiveSeenAt?: Date | string | null
    lastPostrunActionAt?: Date | string | null
    lastDecisionTs?: Date | string | null
    idlePeriodCleared?: boolean
    consecIdleCount?: number
    consecActiveCount?: number
    configPath?: string | null
    debugMode?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: DaemonStatisticsCreateNestedOneWithoutSessionInput
    recoveryActions?: RecoveryActionCreateNestedManyWithoutSessionInput
  }

  export type MonitorSessionUncheckedCreateWithoutComponentsInput = {
    id?: string
    startTime?: Date | string
    endTime?: Date | string | null
    lastDetectedState?: string
    lastIdleClearAt?: Date | string | null
    lastIdlePromptAt?: Date | string | null
    pendingBootstrap?: boolean
    clearCompletedAt?: Date | string | null
    bootstrapCleared?: boolean
    lastActiveSeenAt?: Date | string | null
    lastPostrunActionAt?: Date | string | null
    lastDecisionTs?: Date | string | null
    idlePeriodCleared?: boolean
    consecIdleCount?: number
    consecActiveCount?: number
    configPath?: string | null
    debugMode?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: DaemonStatisticsUncheckedCreateNestedOneWithoutSessionInput
    recoveryActions?: RecoveryActionUncheckedCreateNestedManyWithoutSessionInput
  }

  export type MonitorSessionCreateOrConnectWithoutComponentsInput = {
    where: MonitorSessionWhereUniqueInput
    create: XOR<MonitorSessionCreateWithoutComponentsInput, MonitorSessionUncheckedCreateWithoutComponentsInput>
  }

  export type MonitorSessionUpsertWithoutComponentsInput = {
    update: XOR<MonitorSessionUpdateWithoutComponentsInput, MonitorSessionUncheckedUpdateWithoutComponentsInput>
    create: XOR<MonitorSessionCreateWithoutComponentsInput, MonitorSessionUncheckedCreateWithoutComponentsInput>
    where?: MonitorSessionWhereInput
  }

  export type MonitorSessionUpdateToOneWithWhereWithoutComponentsInput = {
    where?: MonitorSessionWhereInput
    data: XOR<MonitorSessionUpdateWithoutComponentsInput, MonitorSessionUncheckedUpdateWithoutComponentsInput>
  }

  export type MonitorSessionUpdateWithoutComponentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDetectedState?: StringFieldUpdateOperationsInput | string
    lastIdleClearAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastIdlePromptAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pendingBootstrap?: BoolFieldUpdateOperationsInput | boolean
    clearCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bootstrapCleared?: BoolFieldUpdateOperationsInput | boolean
    lastActiveSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastPostrunActionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDecisionTs?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    idlePeriodCleared?: BoolFieldUpdateOperationsInput | boolean
    consecIdleCount?: IntFieldUpdateOperationsInput | number
    consecActiveCount?: IntFieldUpdateOperationsInput | number
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    debugMode?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: DaemonStatisticsUpdateOneWithoutSessionNestedInput
    recoveryActions?: RecoveryActionUpdateManyWithoutSessionNestedInput
  }

  export type MonitorSessionUncheckedUpdateWithoutComponentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDetectedState?: StringFieldUpdateOperationsInput | string
    lastIdleClearAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastIdlePromptAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pendingBootstrap?: BoolFieldUpdateOperationsInput | boolean
    clearCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bootstrapCleared?: BoolFieldUpdateOperationsInput | boolean
    lastActiveSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastPostrunActionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDecisionTs?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    idlePeriodCleared?: BoolFieldUpdateOperationsInput | boolean
    consecIdleCount?: IntFieldUpdateOperationsInput | number
    consecActiveCount?: IntFieldUpdateOperationsInput | number
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    debugMode?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: DaemonStatisticsUncheckedUpdateOneWithoutSessionNestedInput
    recoveryActions?: RecoveryActionUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type MonitorSessionCreateWithoutRecoveryActionsInput = {
    id?: string
    startTime?: Date | string
    endTime?: Date | string | null
    lastDetectedState?: string
    lastIdleClearAt?: Date | string | null
    lastIdlePromptAt?: Date | string | null
    pendingBootstrap?: boolean
    clearCompletedAt?: Date | string | null
    bootstrapCleared?: boolean
    lastActiveSeenAt?: Date | string | null
    lastPostrunActionAt?: Date | string | null
    lastDecisionTs?: Date | string | null
    idlePeriodCleared?: boolean
    consecIdleCount?: number
    consecActiveCount?: number
    configPath?: string | null
    debugMode?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: DaemonStatisticsCreateNestedOneWithoutSessionInput
    components?: ComponentStatusCreateNestedManyWithoutSessionInput
  }

  export type MonitorSessionUncheckedCreateWithoutRecoveryActionsInput = {
    id?: string
    startTime?: Date | string
    endTime?: Date | string | null
    lastDetectedState?: string
    lastIdleClearAt?: Date | string | null
    lastIdlePromptAt?: Date | string | null
    pendingBootstrap?: boolean
    clearCompletedAt?: Date | string | null
    bootstrapCleared?: boolean
    lastActiveSeenAt?: Date | string | null
    lastPostrunActionAt?: Date | string | null
    lastDecisionTs?: Date | string | null
    idlePeriodCleared?: boolean
    consecIdleCount?: number
    consecActiveCount?: number
    configPath?: string | null
    debugMode?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: DaemonStatisticsUncheckedCreateNestedOneWithoutSessionInput
    components?: ComponentStatusUncheckedCreateNestedManyWithoutSessionInput
  }

  export type MonitorSessionCreateOrConnectWithoutRecoveryActionsInput = {
    where: MonitorSessionWhereUniqueInput
    create: XOR<MonitorSessionCreateWithoutRecoveryActionsInput, MonitorSessionUncheckedCreateWithoutRecoveryActionsInput>
  }

  export type MonitorSessionUpsertWithoutRecoveryActionsInput = {
    update: XOR<MonitorSessionUpdateWithoutRecoveryActionsInput, MonitorSessionUncheckedUpdateWithoutRecoveryActionsInput>
    create: XOR<MonitorSessionCreateWithoutRecoveryActionsInput, MonitorSessionUncheckedCreateWithoutRecoveryActionsInput>
    where?: MonitorSessionWhereInput
  }

  export type MonitorSessionUpdateToOneWithWhereWithoutRecoveryActionsInput = {
    where?: MonitorSessionWhereInput
    data: XOR<MonitorSessionUpdateWithoutRecoveryActionsInput, MonitorSessionUncheckedUpdateWithoutRecoveryActionsInput>
  }

  export type MonitorSessionUpdateWithoutRecoveryActionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDetectedState?: StringFieldUpdateOperationsInput | string
    lastIdleClearAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastIdlePromptAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pendingBootstrap?: BoolFieldUpdateOperationsInput | boolean
    clearCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bootstrapCleared?: BoolFieldUpdateOperationsInput | boolean
    lastActiveSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastPostrunActionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDecisionTs?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    idlePeriodCleared?: BoolFieldUpdateOperationsInput | boolean
    consecIdleCount?: IntFieldUpdateOperationsInput | number
    consecActiveCount?: IntFieldUpdateOperationsInput | number
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    debugMode?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: DaemonStatisticsUpdateOneWithoutSessionNestedInput
    components?: ComponentStatusUpdateManyWithoutSessionNestedInput
  }

  export type MonitorSessionUncheckedUpdateWithoutRecoveryActionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDetectedState?: StringFieldUpdateOperationsInput | string
    lastIdleClearAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastIdlePromptAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pendingBootstrap?: BoolFieldUpdateOperationsInput | boolean
    clearCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bootstrapCleared?: BoolFieldUpdateOperationsInput | boolean
    lastActiveSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastPostrunActionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastDecisionTs?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    idlePeriodCleared?: BoolFieldUpdateOperationsInput | boolean
    consecIdleCount?: IntFieldUpdateOperationsInput | number
    consecActiveCount?: IntFieldUpdateOperationsInput | number
    configPath?: NullableStringFieldUpdateOperationsInput | string | null
    debugMode?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: DaemonStatisticsUncheckedUpdateOneWithoutSessionNestedInput
    components?: ComponentStatusUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type ComponentStatusCreateManySessionInput = {
    id?: string
    name: string
    status: string
    isRunning?: boolean
    startedAt?: Date | string | null
    stoppedAt?: Date | string | null
    lastError?: string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecoveryActionCreateManySessionInput = {
    id?: string
    state: string
    actionType: string
    timestamp?: Date | string
    success?: boolean
    errorMessage?: string | null
    throttledUntil?: Date | string | null
  }

  export type ComponentStatusUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isRunning?: BoolFieldUpdateOperationsInput | boolean
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stoppedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ComponentStatusUncheckedUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isRunning?: BoolFieldUpdateOperationsInput | boolean
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stoppedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ComponentStatusUncheckedUpdateManyWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    isRunning?: BoolFieldUpdateOperationsInput | boolean
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stoppedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    statistics?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecoveryActionUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    success?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    throttledUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type RecoveryActionUncheckedUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    success?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    throttledUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type RecoveryActionUncheckedUpdateManyWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    success?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    throttledUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}