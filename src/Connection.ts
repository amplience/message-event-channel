export interface Promises {
  [key: string]: MPromise;
}

export interface MPromise {
  resolve: Function;
  reject: Function;
}

export interface Emits {
  [key: string]: Function;
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

export interface Options {
  timeout: number;
  debug: boolean;
  onload: boolean;
  targetOrigin: string;
}

type Message = ResolveMessage | RejectMessage | EmitMessage | RequestMessage;

export enum MESSAGE_TYPE {
  CONNECTION = 'connection',
  SUBSCRIBE = 'subscribe',
  EMIT = 'emit',
  REQUEST = 'request',
  RESOLVE = 'resolve',
  REJECT = 'reject'
}

export enum MIO_EVENTS {
  HANDSHAKE = 'mio-handshake',
  CONNECTED = 'mio-connected',
  DISCONNECTED = 'mio-disconnected'
}

export class Connection {
  public initiated: boolean = false;
  protected port!: MessagePort;
  private backlog: Array<Message> = [];
  protected promises: Promises = {};
  private emitters: Emits = {};
  private readonly timeout: number = 100;
  protected readonly defaultOptions: Options = {
    timeout: 2000,
    debug: false,
    onload: true,
    targetOrigin: '*'
  };

  constructor(protected options: any = {}) {
    this.options = { ...this.defaultOptions, ...options };
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
    this.initiated = true;
    this.emit(MIO_EVENTS.CONNECTED);
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
        if (!this.emitters[message.event]) {
          return;
        }
        this.emitters[message.event](message.payload);
        break;
      case MESSAGE_TYPE.REQUEST:
        if (!this.emitters[message.event]) {
          return;
        }
        this.emitters[message.event](
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

  public emit(event: string, payload?: any) {
    this.message({
      type: MESSAGE_TYPE.EMIT,
      event,
      payload
    });
    return this;
  }

  public on(event: string, callback: Function) {
    this.emitters[event] = callback;
    return this;
  }

  private isPositiveNumber(num: any): boolean {
    return typeof num === 'number' && num >= 0;
  }

  protected getTimeout(num: any): number {
    if (this.isPositiveNumber(num)) {
      return num;
    }
    if (this.options.timeout && this.isPositiveNumber(this.options.timeout)) {
      return this.options.timeout;
    }
    return this.timeout;
  }

  public request(event: string, payload?: any, timeout?: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const uuid: string = event + '_' + Object.keys(this.promises).length;
      const ct = setTimeout(() => reject('timeout'), this.getTimeout(timeout));
      this.promises[uuid] = {
        resolve: (resolvedData: any) => {
          resolve(resolvedData);
          clearTimeout(ct);
        },
        reject: (error: any) => {
          reject(error);
          clearTimeout(ct);
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

  protected isClient(): Boolean {
    return false;
  }

  public close() {
    if (this.initiated) {
      this.port.close();
    }
  }

  protected message(message: Message) {
    let force = false;
    if (
      message.event === MIO_EVENTS.HANDSHAKE ||
      message.event === MIO_EVENTS.CONNECTED ||
      message.event === MIO_EVENTS.DISCONNECTED
    ) {
      force = true;
    }
    if (!this.initiated && !force) {
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
