import { Connection, MIO_EVENTS } from './Connection';
/**
 * The child side of a connection.
 */
export class ClientConnection extends Connection {
  private messageListener: any;
  constructor(options: any = {}) {
    super(options);
    this.messageListener = (e: MessageEvent) => this.startInit(e);
    window.addEventListener('message', this.messageListener);
  }

  private startInit(e: MessageEvent) {
    if (e.ports[0]) {
      this.port = e.ports[0];
      this.initPortEvents();
      this.listenForHandshake();
      window.removeEventListener('message', this.messageListener);
    }
  }

  protected listenForHandshake() {
    this.request(MIO_EVENTS.HANDSHAKE).then(() => {
      this.addBeforeUnloadEvent();
      this.finishInit();
    });
  }

  protected addBeforeUnloadEvent() {
    window.addEventListener('beforeunload', (event: BeforeUnloadEvent) => {
      this.emit(MIO_EVENTS.DISCONNECTED);
    });
  }

  protected isClient() {
    return true;
  }
}
