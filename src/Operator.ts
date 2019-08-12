import { ServerConnection } from './ServerConnection';
import { ClientConnection } from './ClientConnection';
import { Options, Connection } from './Connection';

export class Operator {
  private connections: Array<Connection> = [];

  constructor() {}

  /**
   * Connect method will create and return a [[Connection]] instance.
   * The connection will be placed under the management of the Operator until [[close]] is called.
   * @param frame  Optional param for specifying an iframe for a [[ServerConnection]], if not provided it will create a [[ClientConnection]]
   * @param options  Optional param for overriding the default options of type [[Options]]
   * @returns Either a [[ServerConnection]] or [[ClientConnection]]
   */
  public connect(frame?: HTMLIFrameElement, options: Options = {}): Connection {
    let connection: Connection;
    if (frame) {
      connection = new ServerConnection(frame, options);
      this.connections.push(connection);
    } else {
      connection = new ClientConnection(options);
    }
    return connection;
  }

  /**
   * This method will close the port used by the connection and remove it from the list of managed connections.
   * This will prevent group emit or group requests from being triggered on the connection.
   * @param connection
   * @return Returns Operator instance
   */
  public close(connection: Connection): Operator {
    this.connections = this.connections.filter((c: Connection) => c !== connection);
    connection.close();
    return this;
  }

  /**
   * This method will emit an event on all the managed connections.
   * @param event The name of the event to emit.
   * @param payload Optional payload to be sent with the event.
   * @return Returns Operator instance.
   */
  public emit(event: string, payload?: any): Operator {
    this.connections.forEach((connection: Connection) => {
      connection.emit(event, payload);
    });
    return this;
  }

  /**
   * This method will make a request on all the managed connections.
   * It returns a promise and will resolve or reject on the first connection to make a response.
   * @param event The name of the event to emit.
   * @param payload Optional payload to be sent with the event.
   * @param timeout Optional timeout value to override connection option, promise will reject after this time elapses
   * @return Returns a promise which can contain any payload
   */
  public requestRace(event: string, payload?: any, timeout?: number): Promise<any> {
    return Promise.race(this.request(event, payload, timeout));
  }

  /**
   * This method will make a request on all the managed connections.
   * It returns a promise and will resolve or reject after all the connections's promises have completed.
   * @param event The name of the event to emit.
   * @param payload Optional payload to be sent with the event.
   * @param timeout Optional timeout value to override connection option, promise will reject after this time elapses
   * @return Returns a promise which can contain any payload
   */
  public requestAll(event: string, payload?: any, timeout?: number): Promise<any> {
    return Promise.all(this.request(event, payload, timeout));
  }

  /**
   * This method will make a request on all the managed connections.
   * It returns an array containing all the promises it is then up to you manage their completion.
   * @param event The name of the event to emit.
   * @param payload Optional payload to be sent with the event.
   * @param timeout Optional timeout value to override connection option, promise will reject after this time elapses
   * @return Returns an array of promises which can contain any payload
   */
  public request(event: string, payload?: any, timeout?: number): Array<Promise<any>> {
    const promiseArray: Array<Promise<any>> = [];
    this.connections.forEach((connection: Connection) => {
      promiseArray.push(connection.request(event, payload, timeout));
    });
    return promiseArray;
  }
}
