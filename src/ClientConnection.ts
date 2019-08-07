import { Connection } from './Connection';
export class ClientConnection extends Connection {
  private messageListener: any;
  constructor(options: any = {}) {
    super(options);
    this.messageListener = (e: MessageEvent) => this.init(e);
    window.addEventListener('message', this.messageListener);
  }

  private init(e: MessageEvent) {
    if (e.ports[0]) {
      this.port = e.ports[0];
      this.initConnection();
      window.removeEventListener('message', this.messageListener);
    }
  }

  protected isClient() {
    return true;
  }
}
