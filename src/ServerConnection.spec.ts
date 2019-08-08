import { ServerConnection } from './ServerConnection';
import { MIO_EVENTS } from './Connection';
describe('Server', () => {
  it('attaches an event listener to the frame', () => {
    const frame = document.createElement('iframe');
    const frameEvent = spyOn(frame, 'addEventListener');
    new ServerConnection(frame);
    expect(frameEvent).toHaveBeenCalled();
    expect(frameEvent).toHaveBeenCalledTimes(1);
  });

  it("doesn't attach an event listener to the frame if option:onload is false", () => {
    const frame = document.createElement('iframe');
    const frameEvent = spyOn(frame, 'addEventListener');
    new ServerConnection(frame, { onload: false });
    expect(frameEvent).not.toHaveBeenCalled();
  });

  it('calls onload when the frame is loaded and initiation is completed', done => {
    const frame = document.createElement('iframe');
    frame.src = './base/src/frame.html';
    const server = new ServerConnection(frame);
    const serverInit = spyOn(server, 'startInit');
    frame.onload = () => {
      expect(serverInit).toHaveBeenCalled();
      expect(serverInit).toHaveBeenCalledTimes(1);
      document.body.removeChild(frame);
      done();
    };
    document.body.appendChild(frame);
  });

  it('is set to initiated if connection event is sent', done => {
    const frame = document.createElement('iframe');
    frame.src = './base/src/frame.html';
    const server = new ServerConnection(frame);
    server.on(MIO_EVENTS.CONNECTED, () => {
      expect(server.initiated).toBeTruthy();
      document.body.removeChild(frame);
      done();
    });
    document.body.appendChild(frame);
  });

  it('should not complete init if an empty frame is loaded', done => {
    const frame = document.createElement('iframe');
    const server = new ServerConnection(frame);
    frame.onload = () => {
      setTimeout(() => {
        expect(server.initiated).toBeFalsy();
        document.body.removeChild(frame);
        done();
      }, 1);
    };
    document.body.appendChild(frame);
  });

  it('should only be initialised once the handshake is received from the child', done => {
    const frame = document.createElement('iframe');
    frame.src = './base/src/frame.html';
    const server = new ServerConnection(frame);
    server.on(MIO_EVENTS.CONNECTED, () => {
      expect(server.initiated).toBeTruthy();
      document.body.removeChild(frame);
      done();
    });
    document.body.appendChild(frame);
  });

  it('should receive a MIO_EVENTS.DISCONNECTED event when the iframe reloads', done => {
    const frame: HTMLIFrameElement = document.createElement('iframe');
    const server = new ServerConnection(frame);
    document.body.appendChild(frame);
    let setOnce = false;
    server.on(MIO_EVENTS.CONNECTED, () => {
      if (!setOnce) {
        frame.src = '/404.html';
        setOnce = true;
      }
    });
    server.on(MIO_EVENTS.DISCONNECTED, (arg: any) => {
      expect(arg).toBeUndefined();
      document.body.removeChild(frame);
      done();
    });
    frame.src = './base/src/frame.html';
  });

  it('should receive all the messages asked for even if the iframe reloads', done => {
    const frame: HTMLIFrameElement = document.createElement('iframe');
    const server = new ServerConnection(frame);
    let count = 0;
    frame.src = './base/src/frame.html';
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        if (i === 1) {
          frame.src = '/404.html';
        }
        if (i === 8) {
          frame.src = './base/src/frame.html';
        }
        server.request('passthrough', null, 10000).then(() => {
          if (i === 9) {
            expect(count).toEqual(9);
            document.body.removeChild(frame);
            done();
          }
          count++;
        });
      }, i * 10);
    }
    document.body.appendChild(frame);
  });
});
