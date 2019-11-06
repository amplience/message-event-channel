import { ServerConnection } from '../src/ServerConnection';
import { ClientConnection } from '../src/ClientConnection';
import { MC_EVENTS } from '../src/Connection';
import { createIframe, appendIframe, removeIframe } from './TestHelpers';

declare global {
  interface Window {
    connection: ClientConnection;
  }
}

describe('Server', () => {
  it('attaches an event listener to the frame', () => {
    const frame: HTMLIFrameElement = createIframe();
    const frameEvent = spyOn(frame, 'addEventListener');
    new ServerConnection(frame);
    expect(frameEvent).toHaveBeenCalled();
    expect(frameEvent).toHaveBeenCalledTimes(1);
  });

  it("doesn't attach an event listener to the frame if option:onload is false", () => {
    const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
    const frameEvent = spyOn(frame, 'addEventListener');
    new ServerConnection(frame, { onload: false });
    expect(frameEvent).not.toHaveBeenCalled();
  });

  it('calls init when the frame is loaded and initiation is completed', done => {
    const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
    const server = new ServerConnection(frame);
    const serverInit = spyOn(server, 'init');
    frame.onload = () => {
      expect(serverInit).toHaveBeenCalled();
      expect(serverInit).toHaveBeenCalledTimes(1);
      removeIframe(frame);
      done();
    };
    appendIframe(frame);
  });

  it('only initiates when a postmessage message is received, and clientInitiates = true', done => {
    const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
    const server = new ServerConnection(frame, {
      onload: false,
      clientInitiates: true
    });
    const serverInit = spyOn(server, 'init');
    frame.onload = () => {
      if (frame.contentWindow) {
        expect(serverInit).not.toHaveBeenCalled();
        frame.contentWindow.connection.init();
      }
    };
    const handler = (e: MessageEvent) => {
      expect(serverInit).toHaveBeenCalled();
      window.removeEventListener('message', handler);
      removeIframe(frame);
      done();
    };
    window.addEventListener('message', handler);
    appendIframe(frame);
  });

  it('Client initiation triggers debug message', done => {
    const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
    const server = new ServerConnection(frame, {
      onload: false,
      clientInitiates: true,
      debug: true
    });
    const log = spyOn(console, 'log');
    frame.onload = () => {
      if (frame.contentWindow) {
        frame.contentWindow.connection.init();
      }
    };
    const handler = (e: MessageEvent) => {
      expect(log).toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith('Server: Client triggered initiation');
      window.removeEventListener('message', handler);
      removeIframe(frame);
      done();
    };
    window.addEventListener('message', handler);
    appendIframe(frame);
  });

  it('just any postmessage from child should not trigger an client initiation', done => {
    const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
    const server = new ServerConnection(frame, {
      onload: false,
      clientInitiates: true,
      debug: true
    });
    const init = spyOn(server, 'init');
    frame.onload = () => {
      if (frame.contentWindow) {
        frame.contentWindow.parent.postMessage('blah', '*');
      }
    };
    const handler = (e: MessageEvent) => {
      expect(server.init).not.toHaveBeenCalled();
      window.removeEventListener('message', handler);
      removeIframe(frame);
      done();
    };
    window.addEventListener('message', handler);
    appendIframe(frame);
  });

  it('is set to connected if connection event is sent', done => {
    const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
    const server = new ServerConnection(frame);
    server.on(MC_EVENTS.CONNECTED, () => {
      expect(server.connected).toBeTruthy();
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  it('should not complete init if an empty frame is loaded', done => {
    const frame: HTMLIFrameElement = createIframe();
    const server = new ServerConnection(frame);
    frame.onload = () => {
      setTimeout(() => {
        expect(server.connected).toBeFalsy();
        removeIframe(frame);
        done();
      }, 1);
    };
    appendIframe(frame);
  });

  it('init should return false if already connected', () => {
    const frame: HTMLIFrameElement = createIframe();
    const server = new ServerConnection(frame, { onload: false });
    server.connected = true;
    const init = server.init();
    expect(init).toEqual(false);
  });

  it('init should return false if already connected', () => {
    const frame: HTMLIFrameElement = createIframe('https://github.com/');
    const server = new ServerConnection(frame, { onload: false });
    server.connected = true;
    const init = server.init();
    expect(init).toEqual(false);
  });

  it('init should return false if frame has no url', () => {
    const frame: HTMLIFrameElement = createIframe();
    const server = new ServerConnection(frame, { onload: false });
    const init = server.init();
    expect(init).toEqual(false);
  });

  it('should fire a connection timed out event if no client connects', done => {
    const frame: HTMLIFrameElement = createIframe();
    const server = new ServerConnection(frame, { onload: false });
    server.on(MC_EVENTS.CONNECTION_TIMEOUT, (evt: any) => {
      expect(evt.message).toEqual('Connection timed out while waiting for connection.');
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  xit('should fire a connection timed out event if client doesnt initiate', done => {
    const frame: HTMLIFrameElement = createIframe();
    const server = new ServerConnection(frame, { clientInitiates: true, connectionTimeout: 100 });
    server.on(MC_EVENTS.CONNECTION_TIMEOUT, (evt: any) => {
      expect(evt.message).toEqual('Connection timed out while waiting for initiation from client.');
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  it("should fire a connection timed out event if page doesn't load", done => {
    // if the connectionTimout is less than the time it takes to load the url it should pass
    const frame: HTMLIFrameElement = createIframe('https://github.com/');
    const server = new ServerConnection(frame, { connectionTimeout: 100 });
    server.on(MC_EVENTS.CONNECTION_TIMEOUT, (evt: any) => {
      expect(evt.message).toEqual('Connection timed out while waiting for iframe to load.');
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  it('should only be initialised once the handshake is received from the child', done => {
    const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
    const server = new ServerConnection(frame);
    server.on(MC_EVENTS.CONNECTED, () => {
      expect(server.connected).toBeTruthy();
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  it('should receive a MC_EVENTS.DISCONNECTED event when the iframe reloads', done => {
    const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
    const server = new ServerConnection(frame);
    let setOnce = false;
    server.on(MC_EVENTS.CONNECTED, () => {
      if (!setOnce) {
        frame.src = '/404.html';
        setOnce = true;
      }
    });
    server.on(MC_EVENTS.DISCONNECTED, (arg: any) => {
      expect(arg).toBeUndefined();
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  it('a MC_EVENTS.DISCONNECTED event should set connected=false', done => {
    const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
    const server = new ServerConnection(frame, { debug: true });
    let setOnce = false;
    server.on(MC_EVENTS.CONNECTED, () => {
      if (!setOnce) {
        frame.src = '/404.html';
        setOnce = true;
      }
    });
    server.on(MC_EVENTS.DISCONNECTED, () => {
      setTimeout(() => {
        expect(server.connected).toEqual(false);
        removeIframe(frame);
        done();
      });
    });
    appendIframe(frame);
  });

  it('should receive all the messages asked for even if the iframe reloads', done => {
    const frame: HTMLIFrameElement = createIframe('./base/test/frame.html');
    const server = new ServerConnection(frame);
    let count = 0;
    for (let i = 0; i < 10; i++) {
      if (i === 1) {
        frame.src = '/404.html';
      }
      if (i === 8) {
        frame.src = './base/test/frame.html';
      }
      server
        .request('passthrough')
        .then(() => {
          if (i === 9) {
            expect(count).toEqual(9);
            removeIframe(frame);
            done();
          }
          count++;
        })
        .catch(done.fail);
    }
    appendIframe(frame);
  });
});
