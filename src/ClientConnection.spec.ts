import { ClientConnection } from '../src/ClientConnection';
import { ServerConnection } from '../src/ServerConnection';
import { MIO_EVENTS } from '../src/Connection';
beforeAll(() => {});

declare global {
  interface Window {
    connection: ClientConnection;
  }
}

describe('Client', () => {
  it('adds a window message listener', () => {
    const windowEvent = spyOn(window, 'addEventListener');
    new ClientConnection();
    expect(windowEvent).toHaveBeenCalled();
    expect(windowEvent).toHaveBeenCalledTimes(1);
    expect(windowEvent).toHaveBeenCalledWith('message', jasmine.any(Function));
  });

  it('client should receive a message event with a port', done => {
    const frame: HTMLIFrameElement = document.createElement('iframe');
    new ServerConnection(frame);
    document.body.appendChild(frame);
    frame.onload = () => {
      if (!frame.contentWindow) {
        return;
      }
      frame.contentWindow.addEventListener('message', event => {
        expect(event.constructor.name).toEqual('MessageEvent');
        expect(event.ports[0].constructor.name).toEqual('MessagePort');
        document.body.removeChild(frame);
        done();
      });
    };
    frame.src = './base/src/frame.html';
  });

  it('should initiate when it has received a message event and remove listener', done => {
    const frame: HTMLIFrameElement = document.createElement('iframe');
    const connection = new ServerConnection(frame);
    document.body.appendChild(frame);
    let clientRemove: Function;
    frame.onload = () => {
      if (!frame.contentWindow) {
        return;
      }
      const window: Window = frame.contentWindow;
      clientRemove = spyOn(window, 'removeEventListener');
    };
    connection.on(MIO_EVENTS.CONNECTED, () => {
      expect(clientRemove).toHaveBeenCalled();
      expect(clientRemove).toHaveBeenCalledTimes(1);
      expect(clientRemove).toHaveBeenCalledWith('message', jasmine.any(Function));
      document.body.removeChild(frame);
      done();
    });
    frame.src = './base/src/frame.html';
  });

  it('should receive a message from the parent', done => {
    const frame: HTMLIFrameElement = document.createElement('iframe');
    const connection = new ServerConnection(frame);
    document.body.appendChild(frame);
    frame.addEventListener('load', () => {
      if (!frame.contentWindow || !frame.src) {
        return;
      }
      const window: Window = frame.contentWindow;
      window.connection.on('event', (arg: any) => {
        expect(arg).toBeUndefined();
        document.body.removeChild(frame);
        done();
      });
    });
    connection.emit('event');
    frame.src = './base/src/frame.html';
  });

  it('should receive a message from the parent with data', done => {
    const frame: HTMLIFrameElement = document.createElement('iframe');
    const connection = new ServerConnection(frame);
    const payload = { hello: 'there' };
    document.body.appendChild(frame);
    frame.addEventListener('load', () => {
      if (!frame.contentWindow || !frame.src) {
        return;
      }
      const window: Window = frame.contentWindow;
      window.connection.on('event', (rcv: any) => {
        expect(rcv).toEqual(payload);
        document.body.removeChild(frame);
        done();
      });
    });
    connection.emit('event', payload);
    frame.src = './base/src/frame.html';
  });
});
