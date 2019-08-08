import { Connection, MIO_EVENTS, MESSAGE_TYPE } from './Connection';
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
    this.request(MIO_EVENTS.HANDSHAKE).then(() => this.finishInit());
  }

  protected isClient() {
    return true;
  }
}
