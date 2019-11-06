import { Connection, MIO_EVENTS } from './Connection';

enum CONNECTION_STEPS {
  CONNECTION = 'waiting for connection.',
  HANDSHAKE = 'waiting for handshake.'
}
/**
 * The child side of a connection.
 */
export class ClientConnection extends Connection {
  private messageListener: any;
  constructor(options: any = {}) {
    super(options);
    this.messageListener = (e: MessageEvent) => this.messageHandler(e);
    this.options.window.addEventListener('message', this.messageListener);
    if (this.options.connectionTimeout !== false) {
      this.connectionStep = CONNECTION_STEPS.CONNECTION;
      this.setConnectionTimeout();
    }
  }

  public init() {
    const url = new URL(this.options.window.location.toString());
    const id = url.searchParams.get('mio-name');
    if (this.options.debug) {
      console.log('Client: sent postMessage value:', id);
    }
    this.options.window.parent.postMessage(id, this.options.targetOrigin);
  }

  private messageHandler(e: MessageEvent) {
    if (e.ports[0]) {
      this.port = e.ports[0];
      this.initPortEvents();
      this.listenForHandshake();
      this.options.window.removeEventListener('message', this.messageListener);
    }
  }

  protected listenForHandshake() {
    if (this.options.connectionTimeout !== false) {
      this.connectionStep = CONNECTION_STEPS.HANDSHAKE;
      this.setConnectionTimeout();
    }
    this.request(MIO_EVENTS.HANDSHAKE)
      .then(() => {
        this.addBeforeUnloadEvent();
        this.finishInit();
      })
      .catch((e: any) => {
        this.handleError(e);
      });
  }

  protected addBeforeUnloadEvent() {
    this.options.window.addEventListener('beforeunload', (event: BeforeUnloadEvent) => {
      this.emit(MIO_EVENTS.DISCONNECTED);
    });
  }

  protected isClient() {
    return true;
  }
}
