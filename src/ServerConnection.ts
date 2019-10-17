import { Connection, MIO_EVENTS, MESSAGE_TYPE } from './Connection';

enum CONNECTION_STEPS {
  CONNECTION = 'waiting for connection.',
  IFRAME_LOADING = 'waiting for iframe to load.',
  INITIATION_FROM_CLIENT = 'waiting for initiation from client.'
}

/**
 * The parent side of the connection.
 */
export class ServerConnection extends Connection {
  private channel!: MessageChannel;
  private id!: string;
  protected connectionStep: CONNECTION_STEPS = CONNECTION_STEPS.CONNECTION;

  /**
   *
   * @param frame The iframe target to setup the connection on.
   * @param options Connection configuration options.
   * @param options.timeout Default request timeout (ms). This will trigger a reject on a any request that takes longer than this value. 200ms by default.
   * @param options.connectionTimeout Connection timeout (ms). This will trigger the CONNECTION_TIMEOUT if a connection hasn't been established by this time.
   * @param options.debug Enabling uses console.log to output what MIO is doing behind the scenes. Used for debugging. Disabled by default.
   * @param options.onload Uses the onload event of an iframe to trigger the process for creating a connection. If set to false the connection process needs to be triggered manually. Note a connection will only work if the child frame has loaded. Enabled by default.
   * @param options.targetOrigin Limits the iframe to send messages to only the specified origins. '*' by Default.
   * @param options.clientInitiates Awaits an postMessage (init) trigger from the child before it sets up and sends the MessageChannel port to the child. false by Default.
   */
  constructor(protected frame: HTMLIFrameElement, options: any = {}) {
    super(options);
    this.frame.classList.add('mio-iframe');
    if (this.options.onload) {
      this.setupLoadInit();
    }
    if (this.options.clientInitiates) {
      this.setupClientInit();
    }
    this.setConnectionTimeout();
    this.on(MIO_EVENTS.DISCONNECTED, () => (this.connected = false));
  }

  private clientInitiation(e: MessageEvent) {
    if (e.data === this.id) {
      this.connectionStep = CONNECTION_STEPS.CONNECTION;
      this.setConnectionTimeout();
      this.options.window.removeEventListener('message', this.clientInitListener, false);
      if (this.options.debug) {
        console.log('Server: Client triggered initiation');
      }
      this.init();
    }
  }

  private setupLoadInit() {
    this.connectionStep = CONNECTION_STEPS.IFRAME_LOADING;
    this.frame.addEventListener('load', () => {
      this.connectionStep = this.options.clientInitiates
        ? CONNECTION_STEPS.INITIATION_FROM_CLIENT
        : CONNECTION_STEPS.CONNECTION;
      this.setConnectionTimeout();
      this.init();
    });
  }

  private setupClientInit() {
    this.connectionStep = CONNECTION_STEPS.INITIATION_FROM_CLIENT;
    this.id = this.uuidv4();
    const url = new URL(this.frame.src);
    url.searchParams.append('mio-id', this.id);
    this.frame.src = url.toString();
    this.clientInitListener = (e: MessageEvent) => this.clientInitiation(e);
    this.options.window.addEventListener('message', this.clientInitListener);
  }

  /**
   * Used to trigger the initiation of a connection manually. To be used if the onload, and clientInitiates options are disabled.
   */
  public init() {
    if (!this.frame.contentWindow || !this.frame.src || this.connected) {
      return false;
    }
    this.setupChannel();
    this.initPortEvents();
    this.listenForHandshake();
    this.sendPortToClient();
  }

  private sendPortToClient() {
    if (!this.frame.contentWindow || !this.frame.src) {
      return false;
    }
    this.frame.contentWindow.postMessage(
      null,
      this.options.targetOrigin ? this.options.targetOrigin : '*',
      [this.channel.port2]
    );
  }

  private listenForHandshake() {
    this.on(MIO_EVENTS.HANDSHAKE, (payload: any, resolve: Function) => {
      this.finishInit();
      resolve(payload);
    });
  }

  private setupChannel() {
    this.channel = new MessageChannel();
    this.port = this.channel.port1;
  }
}
