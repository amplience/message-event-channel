import { Connection, MESSAGE_TYPE, EmitMessage } from './Connection'
export class ServerConnection extends Connection {
  private channel!: MessageChannel
  constructor(protected frame: HTMLIFrameElement, options: any = {}) {
    super(options)
    this.setupChannel()
    if (this.options.onload) {
      frame.addEventListener('load', () => this.init())
    }
  }

  public setupChannel() {
    console.log('creating new port for ' + this.frame.src)
    this.channel = new MessageChannel()
    this.port = this.channel.port1
  }

  private connectionReset() {
    const resetMessage: EmitMessage = {
      type: MESSAGE_TYPE.EMIT,
      event: 'mio-connection-reset'
    }
    this.handleMessage(resetMessage)
    this.setupChannel()
  }

  public init() {
    if (this.frame.contentWindow) {
      this.frame.contentWindow.addEventListener('beforeunload', () => {
        this.connectionReset()
      })
      console.log('sending port to ' + this.frame.src)
      this.frame.contentWindow.postMessage(null, '*', [this.channel.port2])
    }
    this.initConnection()
    return this
  }
}
