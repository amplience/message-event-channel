export interface Promises {
  [key: string]: MPromise;
}

export interface MPromise {
  resolve: Function;
  reject: Function;
}

export interface Emits {
  [key: string]: Function[];
}

export interface EmitMessage {
  type: MESSAGE_TYPE.EMIT;
  event: string;
  payload?: any;
}

export interface RequestMessage {
  type: MESSAGE_TYPE.REQUEST;
  id: string;
  event: string;
  payload?: any;
}

export interface ResolveMessage {
  type: MESSAGE_TYPE.RESOLVE;
  id: string;
  event: string;
  payload: any;
}

export interface RejectMessage {
  type: MESSAGE_TYPE.REJECT;
  id: string;
  event: string;
  payload: any;
}
/**
 * Options for the connection.
 */
export interface ConnectionOptions {
  window?: Window;
  timeout?: number;
  connectionTimeout?: number;
  debug?: boolean;
  onload?: boolean;
  clientInitiates?: boolean;
  targetOrigin?: string;
}

export interface RequestOptions {
  timeout?: number | boolean;
}

export interface ConnectionSettings {
  window: Window;
  timeout: number | boolean;
  connectionTimeout: number | boolean;
  debug: boolean;
  onload: boolean;
  clientInitiates: boolean;
  targetOrigin: string;
}

type Message = ResolveMessage | RejectMessage | EmitMessage | RequestMessage;

declare global {
  interface Window {
    msCrypto: Crypto;
  }
}

/**
 * The set of possible message types.
 */
export enum MESSAGE_TYPE {
  SUBSCRIBE = 'subscribe',
  EMIT = 'emit',
  REQUEST = 'request',
  RESOLVE = 'resolve',
  REJECT = 'reject'
}

/**
 * The set of internally used event triggers that can be bound to.
 */
export enum MC_EVENTS {
  HANDSHAKE = 'mc-handshake',
  CONNECTED = 'mc-connected',
  DISCONNECTED = 'mc-disconnected',
  CONNECTION_TIMEOUT = 'mc-connection-timeout'
}
/**
 * Connection Base Class.
 *
 * It is used to provide the shared functionality of [[ServerConnection]] and [[ClientConnection]]
 *
 */
export class Connection {
  /**
   * Indicates if a connection has been established
   */
  public connected: boolean = false;
  protected port!: MessagePort;
  private backlog: Array<Message> = [];
  protected promises: Promises = {};
  private emitters: Emits = {};
  protected options: ConnectionSettings;
  protected connectionTimeout!: number;
  protected connectionStep: string = '';
  protected messageListener!: any;
  protected readonly defaultOptions: ConnectionSettings = {
    window: window,
    connectionTimeout: 2000,
    timeout: 200,
    debug: false,
    onload: true,
    clientInitiates: false,
    targetOrigin: '*'
  };

  /**
   * Creates a Connection instance.
   * @param options Connection configuration options
   * @param options.timeout Default request timeout (ms). This will trigger a reject on a any request that takes longer than this value. 200ms by default.
   * @param options.connectionTimeout Connection timeout (ms). This will trigger the CONNECTION_TIMEOUT if a connection hasn't been established by this time.
   * @param options.debug Enabling uses console.log to output what MC is doing behind the scenes. Used for debugging. Disabled by default.
   * @param options.onload Uses the onload event of an iframe to trigger the process for creating a connection. If set to false the connection process needs to be triggered manually. Note a connection will only work if the child frame has loaded. Enabled by default.
   * @param options.targetOrigin Limits the iframe to send messages to only the specified origins. '*' by Default.
   * @param options.clientInitiates Awaits an postMessage (init) trigger from the child before it sets up and sends the MessageChannel port to the child. false by Default.
   */
  constructor(options: ConnectionOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * This method will emit an event to its counterpart.
   * @param event The name of the event to emit.
   * @param payload Payload to be sent with the event.
   * @return Returns Connection instance.
   */
  public emit(event: string, payload?: any) {
    this.message({
      type: MESSAGE_TYPE.EMIT,
      event,
      payload
    });
    return this;
  }

  /**
   * Bind a callback to an event.
   * @param event The name of the event to listen for.
   * @param callback The function to call when the event is fired.
   * @return Returns Connection instance.
   */
  public on(event: string, callback: Function) {
    if (this.emitters[event] && Array.isArray(this.emitters[event])) {
      this.emitters[event].push(callback);
    } else {
      this.emitters[event] = [callback];
    }
    return this;
  }

  /**
   * Make a request of the counterpart. It will automatically reject the promise if the timeout time is exceeded.
   * @param event The name of the event to emit
   * @param payload Payload to be sent with the request
   * @param options
   * @param options.timeout Override for the default promise timeout, can be an interger or false
   * @returns A promise that can resolve with any payload
   */
  public request<T = any>(event: string, payload?: any, options: RequestOptions = {}): Promise<T> {
    return new Promise<any>((resolve, reject) => {
      const uuid: string = this.uuidv4();
      const timeout = this.getRequestTimeout(options.timeout);
      let ct: number;
      if (timeout !== false && typeof timeout === 'number') {
        ct = window.setTimeout(() => reject('timeout'), timeout);
      }
      this.promises[uuid] = {
        resolve: (resolvedData: T) => {
          resolve(resolvedData);
          if (ct) {
            clearTimeout(ct);
          }
        },
        reject: (error: any) => {
          reject(error);
          if (ct) {
            clearTimeout(ct);
          }
        }
      };
      this.message({
        type: MESSAGE_TYPE.REQUEST,
        event: event,
        id: uuid,
        payload
      });
    });
  }

  /**
   * Close the port being used to communicate. It will prevent any further messages being sent or received.
   */
  public close() {
    if (this.connected) {
      this.port.close();
      this.connected = false;
    }
    if (this.messageListener) {
      this.options.window.removeEventListener('message', this.messageListener, false);
    }
  }

  protected setConnectionTimeout() {
    clearTimeout(this.connectionTimeout);
    if (this.options.connectionTimeout !== false) {
      this.connectionTimeout = window.setTimeout(() => {
        if (this.messageListener) {
          this.options.window.removeEventListener('message', this.messageListener, false);
        }
        this.handleMessage({
          type: MESSAGE_TYPE.EMIT,
          event: MC_EVENTS.CONNECTION_TIMEOUT,
          payload: { message: 'Connection timed out while ' + this.connectionStep }
        });
      }, Number(this.options.connectionTimeout));
    }
  }

  protected uuidv4(): string {
    const crypt = window.crypto || window.msCrypto;
    return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (c ^ (crypt.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  protected clearConnectionTimeout() {
    clearTimeout(this.connectionTimeout);
  }

  protected initPortEvents() {
    this.port.onmessage = message => {
      this.handleMessage(message.data);
    };
    this.port.onmessageerror = error => {
      this.handleError(error);
    };
  }

  protected finishInit() {
    this.connected = true;
    this.clearConnectionTimeout();
    this.emit(MC_EVENTS.CONNECTED);
    this.completeBacklog();
  }

  protected completeBacklog() {
    this.backlog.forEach((message: Message) => {
      this.portMessage(message);
    });
    this.backlog = [];
  }

  protected handleError(error: any) {
    if (this.options.debug) {
      console.error(error);
    }
  }

  protected handleMessage(message: Message) {
    if (this.options.debug) {
      console.log(
        `handle by ${this.isClient() ? 'client' : 'server'} - [${message.type}] "${
          message.event
        }", payload: `,
        message.payload
      );
    }
    switch (message.type) {
      case MESSAGE_TYPE.EMIT:
        if (!this.emitters[message.event] || !Array.isArray(this.emitters[message.event])) {
          return;
        }
        this.emitters[message.event].forEach((cb: Function) => cb(message.payload));
        break;
      case MESSAGE_TYPE.REQUEST:
        if (!this.emitters[message.event] || !Array.isArray(this.emitters[message.event])) {
          return;
        }
        this.emitters[message.event].forEach((cb: Function) =>
          cb(
            message.payload,
            (payload: any) => {
              this.message({
                id: message.id,
                type: MESSAGE_TYPE.RESOLVE,
                event: message.event,
                payload
              });
            },
            (payload: any) => {
              this.message({
                id: message.id,
                type: MESSAGE_TYPE.REJECT,
                event: message.event,
                payload
              });
            }
          )
        );
        break;
      case MESSAGE_TYPE.RESOLVE:
        if (!this.promises[message.id]) {
          return;
        }
        this.promises[message.id].resolve(message.payload);
        delete this.promises[message.id];
        break;
      case MESSAGE_TYPE.REJECT:
        if (!this.promises[message.id]) {
          return;
        }
        this.promises[message.id].reject(message.payload);
        delete this.promises[message.id];
        break;
    }
  }

  protected getRequestTimeout(timeout: number | boolean | undefined): number | boolean {
    if (typeof timeout === 'number' && timeout >= 0) {
      return timeout;
    } else if (typeof timeout === 'number') {
      return 0;
    } else if (timeout === true) {
      return this.options.timeout;
    } else if (timeout === false) {
      return false;
    } else {
      return this.options.timeout;
    }
  }

  protected isClient(): Boolean {
    return false;
  }

  protected message(message: Message) {
    let force = false;
    if (
      message.event === MC_EVENTS.HANDSHAKE ||
      message.event === MC_EVENTS.CONNECTED ||
      message.event === MC_EVENTS.DISCONNECTED
    ) {
      force = true;
    }
    if (!this.connected && !force) {
      this.backlog.push(message);
    } else if (this.port) {
      this.portMessage(message);
    }
  }

  private portMessage(message: Message) {
    if (this.options.debug) {
      console.log(
        `send from ${this.isClient() ? 'client' : 'server'} - [${message.type}] "${
          message.event
        }", payload: `,
        message.payload
      );
    }
    this.port.postMessage(message);
  }
}
