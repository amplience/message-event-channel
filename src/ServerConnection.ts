import {Connection} from './Connection';
export class ServerConnection extends Connection {
  channel: MessageChannel;
  constructor(protected frame: HTMLIFrameElement, options: any = {}) {
    super(options);
    this.channel = new MessageChannel();
    this.port = this.channel.port1;
    if(this.options.onload) {
      frame.addEventListener('load', () => {
        this.init();
      });
    }
  }

  public init() {
    if(this.frame.contentWindow) {
      this.frame.contentWindow.postMessage(null, '*', [this.channel.port2]);
    }
    this.initConnection();
  }
}
