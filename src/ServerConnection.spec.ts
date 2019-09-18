import { ServerConnection } from './ServerConnection';
import { MIO_EVENTS } from './Connection';
import { createIframe, appendIframe, removeIframe } from './TestHelpers';

describe('Server', () => {
  it('attaches an event listener to the frame', () => {
    const frame: HTMLIFrameElement = createIframe();
    const frameEvent = spyOn(frame, 'addEventListener');
    new ServerConnection(frame);
    expect(frameEvent).toHaveBeenCalled();
    expect(frameEvent).toHaveBeenCalledTimes(1);
  });

  it("doesn't attach an event listener to the frame if option:onload is false", () => {
    const frame: HTMLIFrameElement = createIframe('./base/src/frame.html');
    const frameEvent = spyOn(frame, 'addEventListener');
    new ServerConnection(frame, { onload: false });
    expect(frameEvent).not.toHaveBeenCalled();
  });

  it('calls onload when the frame is loaded and initiation is completed', done => {
    const frame: HTMLIFrameElement = createIframe('./base/src/frame.html');
    const server = new ServerConnection(frame);
    const serverInit = spyOn(server, 'startInit');
    frame.onload = () => {
      expect(serverInit).toHaveBeenCalled();
      expect(serverInit).toHaveBeenCalledTimes(1);
      removeIframe(frame);
      done();
    };
    appendIframe(frame);
  });

  it('only initiates when a postmessage message is received, and clientInitiates = true', done => {
    const frame: HTMLIFrameElement = createIframe('./base/src/frame.html');
    const server = new ServerConnection(frame, {
      onload: false,
      clientInitiates: true
    });
    const serverInit = spyOn(server, 'startInit');
    frame.onload = () => {
      if (frame.contentWindow) {
        expect(serverInit).not.toHaveBeenCalled();
        frame.contentWindow.connection.startInit();
      }
    };
    window.addEventListener('message', (e: MessageEvent) => {
      expect(serverInit).toHaveBeenCalled();
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  it('is set to connected if connection event is sent', done => {
    const frame: HTMLIFrameElement = createIframe('./base/src/frame.html');
    const server = new ServerConnection(frame);
    server.on(MIO_EVENTS.CONNECTED, () => {
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

  it('should fire a connection timed out event if no client connects', done => {
    const frame: HTMLIFrameElement = createIframe();
    const server = new ServerConnection(frame);
    server.on(MIO_EVENTS.CONNECTION_TIMEOUT, () => {
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  it('should only be initialised once the handshake is received from the child', done => {
    const frame: HTMLIFrameElement = createIframe('./base/src/frame.html');
    const server = new ServerConnection(frame);
    server.on(MIO_EVENTS.CONNECTED, () => {
      expect(server.connected).toBeTruthy();
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  it('should receive a MIO_EVENTS.DISCONNECTED event when the iframe reloads', done => {
    const frame: HTMLIFrameElement = createIframe('./base/src/frame.html');
    const server = new ServerConnection(frame);
    let setOnce = false;
    server.on(MIO_EVENTS.CONNECTED, () => {
      if (!setOnce) {
        frame.src = '/404.html';
        setOnce = true;
      }
    });
    server.on(MIO_EVENTS.DISCONNECTED, (arg: any) => {
      expect(arg).toBeUndefined();
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  it('should receive all the messages asked for even if the iframe reloads', done => {
    const frame: HTMLIFrameElement = createIframe('./base/src/frame.html');
    const server = new ServerConnection(frame);
    let count = 0;
    for (let i = 0; i < 10; i++) {
      if (i === 1) {
        frame.src = '/404.html';
      }
      if (i === 8) {
        frame.src = './base/src/frame.html';
      }
      server
        .request('passthrough', null, 10000)
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
