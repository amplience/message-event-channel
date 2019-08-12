import { Connection, MESSAGE_TYPE, MIO_EVENTS, EmitMessage } from './Connection';
export class ServerConnection extends Connection {
  private channel!: MessageChannel;
  constructor(protected frame: HTMLIFrameElement, options: any = {}) {
    super(options);
    if (this.options.onload) {
      frame.addEventListener('load', () => this.startInit());
    }
    this.on(MIO_EVENTS.DISCONNECTED, () => (this.initiated = false));
  }

  public startInit() {
    if (!this.frame.contentWindow || !this.frame.src) {
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

  public setupChannel() {
    this.channel = new MessageChannel();
    this.port = this.channel.port1;
  }
}
