import { ServerConnection } from './ServerConnection';
import { ClientConnection } from './ClientConnection';

type Connection = ServerConnection | ClientConnection;

export class Operator {
  private connections: Array<ServerConnection> = [];

  constructor() {}

  public connect(frame?: HTMLIFrameElement, options: any = {}): Connection {
    let connection: Connection;
    if (frame) {
      connection = new ServerConnection(frame, options);
      this.connections.push(connection);
    } else {
      connection = new ClientConnection(options);
    }
    return connection;
  }

  public close(connection: Connection) {
    this.connections = this.connections.filter((c: Connection) => c !== connection);
    connection.close();
  }

  public emit(event: string, payload?: any) {
    this.connections.forEach((connection: ServerConnection) => {
      connection.emit(event, payload);
    });
  }
}
