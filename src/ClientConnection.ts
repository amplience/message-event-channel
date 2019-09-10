import { Connection, MIO_EVENTS, MESSAGE_TYPE } from './Connection';
/**
 * The child side of a connection.
 */
export class ClientConnection extends Connection {
  private messageListener: any;
  constructor(options: any = {}) {
    super(options);
    this.messageListener = (e: MessageEvent) => this.startInit(e);
    this.options.window.addEventListener('message', this.messageListener);
    this.connectionTimeout = setTimeout(() => {
      this.handleMessage({ type: MESSAGE_TYPE.EMIT, event: MIO_EVENTS.CONNECTION_TIMEOUT });
    }, this.options.connectionTimeout);
  }

  private startInit(e: MessageEvent) {
    if (e.ports[0]) {
      this.port = e.ports[0];
      this.initPortEvents();
      this.listenForHandshake();
      this.options.window.removeEventListener('message', this.messageListener);
    }
  }

  protected listenForHandshake() {
    this.request(MIO_EVENTS.HANDSHAKE).then(() => {
      this.addBeforeUnloadEvent();
      this.finishInit();
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
