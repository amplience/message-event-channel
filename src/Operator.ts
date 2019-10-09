import { ServerConnection } from './ServerConnection';
import { ClientConnection } from './ClientConnection';
import { ConnectionOptions, Connection, RequestOptions } from './Connection';

export class Operator {
  private connections: Array<Connection> = [];

  /**
   * Connect method will create and return a [[Connection]] instance.
   * The connection will be placed under the management of the Operator until [[close]] is called.
   * @param frame  Used for specifying an iframe for a [[ServerConnection]], if not provided it will create a [[ClientConnection]]
   * @param options  Optional param for overriding the default options of type [[Options]]
   * @returns Either a [[ServerConnection]] or [[ClientConnection]]
   */
  public connect(frame?: HTMLIFrameElement, options: ConnectionOptions = {}): Connection {
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
   * @param payload Payload to be sent with the event.
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
   * @param payload Payload to be sent with the event.
   * @param timeout Value to override connection option, promise will reject after this time elapses
   * @return A promise which can contain any payload
   */
  public requestRace<T = any>(event: string, payload?: any, options?: RequestOptions): Promise<T> {
    return Promise.race(this.request(event, payload, options));
  }

  /**
   * This method will make a request on all the managed connections.
   * It returns a promise and will resolve or reject after all the connections's promises have successfully fulfilled or after a single error is thrown.
   * @param event The name of the event to emit.
   * @param payload Payload to be sent with the event.
   * @param timeout Value to override connection option, promise will reject after this time elapses
   * @return A promise which can contain any payload
   */
  public requestAll<T = any>(
    event: string,
    payload?: any,
    options?: RequestOptions
  ): Promise<Array<T>> {
    return Promise.all(this.request(event, payload, options));
  }

  /**
   * This method will make a request on all the managed connections.
   * It returns an array containing all the promises it is then up to you manage their completion.
   * @param event The name of the event to emit.
   * @param payload Payload to be sent with the event.
   * @param timeout Value to override connection option, promise will reject after this time elapses
   * @return An array of promises which can contain any payload
   */
  public request<T = any>(
    event: string,
    payload?: any,
    options?: RequestOptions
  ): Array<Promise<T>> {
    const promiseArray: Array<Promise<T>> = [];
    this.connections.forEach((connection: Connection) => {
      promiseArray.push(connection.request(event, payload, options));
    });
    return promiseArray;
  }
}
