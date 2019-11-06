import { ClientConnection } from '../src/ClientConnection';
import { ServerConnection } from '../src/ServerConnection';
import { MC_EVENTS } from '../src/Connection';
import { createIframe, appendIframe, removeIframe } from './TestHelpers';

declare global {
  interface Window {
    connection: ClientConnection;
  }
}

describe('ClientConnection', () => {
  describe('constructor()', () => {
    it('should add a window message listener', () => {
      const windowEvent = spyOn(window, 'addEventListener');
      new ClientConnection();
      expect(windowEvent).toHaveBeenCalled();
      expect(windowEvent).toHaveBeenCalledTimes(1);
      expect(windowEvent).toHaveBeenCalledWith('message', jasmine.any(Function));
    });

    it('should receive a message event with a port', done => {
      const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
      new ServerConnection(frame);
      frame.onload = () => {
        if (!frame.contentWindow) {
          return;
        }
        frame.contentWindow.addEventListener('message', event => {
          expect(event.constructor.name).toEqual('MessageEvent');
          expect(event.ports[0].constructor.name).toEqual('MessagePort');
          removeIframe(frame);
          done();
        });
      };
      appendIframe(frame);
    });

    it('should fire a connection timeout event', done => {
      const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
      frame.onload = () => {
        if (!frame.contentWindow) {
          return;
        }
        const window: Window = frame.contentWindow;
        window.connection.on(MC_EVENTS.CONNECTION_TIMEOUT, () => {
          done();
        });
      };
      appendIframe(frame);
    });

    it('should initiate when it has received a message event and remove listener', done => {
      const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
      const connection = new ServerConnection(frame);
      let clientRemove: Function;
      frame.onload = () => {
        if (!frame.contentWindow) {
          return;
        }
        const window: Window = frame.contentWindow;
        clientRemove = spyOn(window, 'removeEventListener');
      };
      connection.on(MC_EVENTS.CONNECTED, () => {
        expect(clientRemove).toHaveBeenCalled();
        expect(clientRemove).toHaveBeenCalledTimes(1);
        expect(clientRemove).toHaveBeenCalledWith('message', jasmine.any(Function));
        removeIframe(frame);
        done();
      });
      appendIframe(frame);
    });

    it('should receive a message from the parent', done => {
      const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
      const connection = new ServerConnection(frame);
      frame.addEventListener('load', () => {
        if (!frame.contentWindow || !frame.src) {
          return;
        }
        const window: Window = frame.contentWindow;
        window.connection.on('event', (arg: any) => {
          expect(arg).toBeUndefined();
          removeIframe(frame);
          done();
        });
      });
      connection.emit('event');
      appendIframe(frame);
    });

    it('should receive a message from the parent with data', done => {
      const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
      const connection = new ServerConnection(frame);
      const payload = { hello: 'there' };
      frame.addEventListener('load', () => {
        if (!frame.contentWindow || !frame.src) {
          return;
        }
        const window: Window = frame.contentWindow;
        window.connection.on('event', (rcv: any) => {
          expect(rcv).toEqual(payload);
          removeIframe(frame);
          done();
        });
      });
      connection.emit('event', payload);
      appendIframe(frame);
    });
  });

  describe('init()', () => {
    it('should log the ID if debug is active', () => {
      const client = new ClientConnection({ debug: true });
      spyOn(console, 'log');
      client.init();
      expect(console.log).toHaveBeenCalled();
    });
    it('should call postMessage', () => {
      const client = new ClientConnection();
      //@ts-ignore
      spyOn(client.options.window.parent, 'postMessage');
      client.init();
      //@ts-ignore
      expect(client.options.window.parent.postMessage).toHaveBeenCalled();
    });
  });

  describe('messageHandler()', () => {
    it('should setup message handler', () => {
      const client = new ClientConnection();
      //@ts-ignore
      spyOn(client, 'initPortEvents');
      //@ts-ignore
      spyOn(client, 'listenForHandshake');
      //@ts-ignore
      spyOn(client.options.window, 'removeEventListener');
      //@ts-ignore
      client.messageListener({ ports: [{ port: true }] });
      //@ts-ignore
      expect(client.port).toEqual({ port: true });
      //@ts-ignore
      expect(client.initPortEvents).toHaveBeenCalled();
      //@ts-ignore
      expect(client.listenForHandshake).toHaveBeenCalled();
      //@ts-ignore
      expect(client.options.window.removeEventListener).toHaveBeenCalled();
    });
    it('should not do anything if there are not any ports', () => {
      const client = new ClientConnection();
      //@ts-ignore
      spyOn(client, 'initPortEvents');
      //@ts-ignore
      client.messageListener({ ports: [] });
      //@ts-ignore
      expect(client.initPortEvents).not.toHaveBeenCalled();
    });
  });

  describe('listenForHandshake()', () => {
    it('should call setConnectionTimeout if connection has timed out', () => {
      const client = new ClientConnection();
      //@ts-ignore
      client.options.connectionTimeout = true;
      //@ts-ignore
      spyOn(client, 'setConnectionTimeout');
      //@ts-ignore
      client.listenForHandshake();
      //@ts-ignore
      expect(client.connectionStep).toEqual('waiting for handshake.');
      //@ts-ignore
      expect(client.setConnectionTimeout).toHaveBeenCalled();
    });
    it('should initialise after handshake', async () => {
      const client = new ClientConnection();
      spyOn(client, 'request').and.returnValue(Promise.resolve());
      //@ts-ignore
      spyOn(client, 'addBeforeUnloadEvent');
      //@ts-ignore
      spyOn(client, 'finishInit');
      //@ts-ignore
      await client.listenForHandshake();
      //@ts-ignore
      expect(client.addBeforeUnloadEvent).toHaveBeenCalled();
      //@ts-ignore
      expect(client.finishInit).toHaveBeenCalled();
    });
    it('should handle error if handshake fails', async done => {
      const client = new ClientConnection();
      spyOn(client, 'request').and.returnValue(Promise.reject());
      //@ts-ignore
      spyOn(client, 'handleError');
      //@ts-ignore
      await client.listenForHandshake();

      setTimeout(() => {
        //@ts-ignore
        expect(client.handleError).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('addBeforeUnloadEvent()', () => {
    it('should add unload event', () => {
      const client = new ClientConnection();
      //@ts-ignore
      spyOn(client.options.window, 'addEventListener').and.callFake((e, cb) => cb());
      spyOn(client, 'emit');
      //@ts-ignore
      client.addBeforeUnloadEvent();
      //@ts-ignore
      expect(client.options.window.addEventListener).toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalled();
    });
  });

  describe('isClient()', () => {
    it('should return true', () => {
      const client = new ClientConnection();
      //@ts-ignore
      const isTrue = client.isClient();
      expect(isTrue).toEqual(true);
    });
  });
});
