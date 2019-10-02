import { Connection, MIO_EVENTS, MESSAGE_TYPE } from './Connection';
/**
 * The parent side of the connection.
 */
export class ServerConnection extends Connection {
  private channel!: MessageChannel;
  private name!: string;
  /**
   *
   * @param frame The iframe target to setup the connection on.
   * @param options Connection configuration options.
   * @param options.timeout Default connection timeout (ms). This will trigger a reject on a any request that takes longer than this value. 200ms by default.
   * @param options.debug Enabling uses console.log to output what MIO is doing behind the scenes. Used for debugging. Disabled by default.
   * @param options.onload Uses the onload event of an iframe to trigger the process for creating a connection. If set to false the connection process needs to be triggered manually. Note a connection will only work if the child frame has loaded. Enabled by default.
   * @param options.targetOrigin Limits the iframe to send messages to only the specified origins. '*' by Default.
   */
  constructor(protected frame: HTMLIFrameElement, options: any = {}) {
    super(options);
    this.frame.classList.add('mio-iframe');
    if (this.options.onload) {
      this.frame.addEventListener('load', () => {
        if (this.options.clientInitiates) {
          this.setupClientInit();
        }
        if (this.options.url && this.frame.contentWindow) {
          this.frame.contentWindow.location.replace(this.options.url);
        }
        this.init();
      });
    }

    if (this.options.clientInitiates) {
      this.setupClientInit();
    }
    if (!this.options.onload && this.options.url) {
      this.setSrc(this.options.url);
    }
    this.on(MIO_EVENTS.DISCONNECTED, () => (this.connected = false));
  }

  private setSrc(url: string) {
    const iFrameParent = this.frame.parentElement;
    const iframe = this.frame;
    this.frame.remove();
    iframe.setAttribute('src', url);
    iFrameParent && iFrameParent.appendChild(iframe);
    this.frame = iframe;
  }

  private clientInitiation(e: MessageEvent) {
    if (e.data === this.name) {
      if (this.options.debug) {
        console.log('Server: Client triggered initiation');
      }
      this.init();
    }
  }

  private setupClientInit() {
    const numFrames = this.options.window.document.querySelectorAll('iframe.mio-iframe').length;
    this.name = 'mio-' + numFrames;
    const url = new URL(this.options.url ? this.options.url : this.frame.src);
    url.searchParams.append('mio-name', this.name);
    this.options.url = url.toString();
    this.options.window.addEventListener('message', (e: MessageEvent) => this.clientInitiation(e));
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
    this.connectionTimeout = window.setTimeout(() => {
      this.handleMessage({ type: MESSAGE_TYPE.EMIT, event: MIO_EVENTS.CONNECTION_TIMEOUT });
    }, this.options.connectionTimeout);
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
