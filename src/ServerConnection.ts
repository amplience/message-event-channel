import { Connection, MESSAGE_TYPE, EmitMessage } from './Connection';
export class ServerConnection extends Connection {
  private channel!: MessageChannel;
  constructor(protected frame: HTMLIFrameElement, options: any = {}) {
    super(options);
    this.setupChannel();
    if (this.options.onload) {
      frame.addEventListener('load', () => this.init());
    }
  }

  public setupChannel() {
    this.channel = new MessageChannel();
    this.port = this.channel.port1;
  }

  private connectionReset() {
    const resetMessage: EmitMessage = {
      type: MESSAGE_TYPE.EMIT,
      event: 'mio-connection-reset'
    };
    this.handleMessage(resetMessage);
    this.setupChannel();
  }

  public init() {
    if (this.frame.contentWindow && this.frame.src) {
      this.frame.contentWindow.addEventListener('beforeunload', () => {
        this.connectionReset();
      });
      this.frame.contentWindow.postMessage(null, this.options.targetOrigin, [this.channel.port2]);
      this.initConnection();
    }
    return this;
  }
}
