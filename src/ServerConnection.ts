import {
  Connection,
  MESSAGE_TYPE,
  MIO_EVENTS,
  EmitMessage
} from './Connection';
export class ServerConnection extends Connection {
  private channel!: MessageChannel;
  constructor(protected frame: HTMLIFrameElement, options: any = {}) {
    super(options);
    if (this.options.onload) {
      frame.addEventListener('load', () => this.startInit());
    }
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
    this.frame.contentWindow.postMessage(null, this.options.targetOrigin, [
      this.channel.port2
    ]);
  }

  private listenForHandshake() {
    this.on(MIO_EVENTS.HANDSHAKE, (payload: any, resolve: Function) => {
      this.addBeforeUnloadEvent();
      this.finishInit();
      resolve(payload);
    });
  }

  public setupChannel() {
    this.channel = new MessageChannel();
    this.port = this.channel.port1;
  }

  private connectionLost() {
    this.initiated = false;
    const resetMessage: EmitMessage = {
      type: MESSAGE_TYPE.EMIT,
      event: MIO_EVENTS.DISCONNECTED
    };
    this.handleMessage(resetMessage);
  }

  protected addBeforeUnloadEvent() {
    if (!this.frame.contentWindow) {
      return false;
    }
    this.frame.contentWindow.addEventListener(
      'beforeunload',
      (event: BeforeUnloadEvent) => {
        this.connectionLost();
      }
    );
  }
}
