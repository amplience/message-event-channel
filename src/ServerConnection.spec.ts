import { ServerConnection } from '../src/ServerConnection';

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

  it('calls init when the frame is loaded and initiation is completed', done => {
    const frame = document.createElement('iframe');
    frame.src = './base/src/frame.html';
    const server = new ServerConnection(frame);
    const serverInit = spyOn(server, 'init');
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
    server.on('mio-connected', () => {
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

  it('should complete init if a non-empty frame is loaded', done => {
    const frame = document.createElement('iframe');
    frame.src = './base/src/frame.html';
    const server = new ServerConnection(frame);
    frame.onload = () => {
      setTimeout(() => {
        expect(server.initiated).toBeTruthy();
        document.body.removeChild(frame);
        done();
      }, 1);
    };
    document.body.appendChild(frame);
  });

  it('should receive a "mio-connection-reset" event when the iframe reloads', done => {
    const frame: HTMLIFrameElement = document.createElement('iframe');
    const server = new ServerConnection(frame);
    document.body.appendChild(frame);
    let setOnce = false;
    frame.onload = () => {
      if (!setOnce) {
        frame.src = '';
        setOnce = true;
      }
    };
    server.on('mio-connection-reset', (arg: any) => {
      expect(arg).toBeUndefined();
      document.body.removeChild(frame);
      done();
    });
    frame.src = './base/src/frame.html';
  });
});
