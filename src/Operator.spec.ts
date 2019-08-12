import { Operator } from '../src/Operator';
import { ClientConnection } from '../src/ClientConnection';
import { ServerConnection } from '../src/ServerConnection';

describe('Operator', () => {
  it('creates a client connection without an iframe', () => {
    const op = new Operator();
    const connection = op.connect();
    expect(connection instanceof ClientConnection).toBeTruthy();
  });
  it('creates a server connection with an iframe', () => {
    const frame = document.createElement('iframe');
    const op = new Operator();
    const connection = op.connect(frame);
    expect(connection instanceof ServerConnection).toBeTruthy();
  });
  it('closes a connection', () => {
    const frame = document.createElement('iframe');
    const op = new Operator();
    const connection = op.connect(frame);
    const spyClose = spyOn(connection, 'close');
    op.close(connection);
    expect(spyClose).toHaveBeenCalled();
  });

  it('emits to all connections', () => {
    const frame = document.createElement('iframe');
    const op = new Operator();
    const connection1 = op.connect(frame);
    const connection2 = op.connect(frame);
    const spyEmit1 = spyOn(connection1, 'emit');
    const spyEmit2 = spyOn(connection2, 'emit');
    op.emit('event');
    expect(spyEmit1).toHaveBeenCalled();
    expect(spyEmit2).toHaveBeenCalled();
  });

  it("doesn't emit to closed connections", () => {
    const frame = document.createElement('iframe');
    const op = new Operator();
    const connection1 = op.connect(frame);
    const connection2 = op.connect(frame);
    const spyEmit1 = spyOn(connection1, 'emit');
    const spyEmit2 = spyOn(connection2, 'emit');
    op.close(connection1);
    op.emit('event');
    expect(spyEmit1).not.toHaveBeenCalled();
    expect(spyEmit2).toHaveBeenCalled();
  });

  it('calls request on all connections when using request', () => {
    const frame = document.createElement('iframe');
    const op = new Operator();
    const connection1 = op.connect(frame);
    const connection2 = op.connect(frame);
    const spyRequest1 = spyOn(connection1, 'request');
    const spyRequest2 = spyOn(connection2, 'request');
    const promiseArray = op.request('resolve-after', 0);
    expect(spyRequest1).toHaveBeenCalled();
    expect(spyRequest2).toHaveBeenCalled();
    expect(promiseArray.length).toEqual(2);
  });

  it('calls request on all connections when using requestAll', () => {
    const frame = document.createElement('iframe');
    const op = new Operator();
    const connection1 = op.connect(frame);
    const connection2 = op.connect(frame);
    const spyRequest1 = spyOn(connection1, 'request');
    const spyRequest2 = spyOn(connection2, 'request');
    const promise = op.requestAll('resolve-after', 0);
    expect(spyRequest1).toHaveBeenCalled();
    expect(spyRequest2).toHaveBeenCalled();
    expect(promise instanceof Promise).toBeTruthy();
  });

  it('calls request on all connections when using requestRace', () => {
    const frame = document.createElement('iframe');
    const op = new Operator();
    const connection1 = op.connect(frame);
    const connection2 = op.connect(frame);
    const spyRequest1 = spyOn(connection1, 'request');
    const spyRequest2 = spyOn(connection2, 'request');
    const promise = op.requestRace('resolve-after', 0);
    expect(spyRequest1).toHaveBeenCalled();
    expect(spyRequest2).toHaveBeenCalled();
    expect(promise instanceof Promise).toBeTruthy();
  });

  it('resolves with all data when using requestAll', done => {
    const frame = document.createElement('iframe');
    const frame2 = document.createElement('iframe');
    frame.src = './base/src/frame.html';
    frame2.src = './base/src/frame.html';
    const timeoutPayload = 100;
    const op = new Operator();
    op.connect(frame);
    op.connect(frame2);
    const promise = op.requestAll('resolve-after', timeoutPayload);
    promise
      .then(data => {
        expect(data instanceof Array).toBeTruthy();
        expect(data.length).toEqual(2);
        expect(data[0]).toEqual(timeoutPayload);
        expect(data[1]).toEqual(timeoutPayload);
        document.body.removeChild(frame);
        document.body.removeChild(frame2);
        done();
      })
      .catch(error => {});
    document.body.appendChild(frame);
    document.body.appendChild(frame2);
  });

  it('rejects on the first promise rejection when using requestAll', done => {
    const frame = document.createElement('iframe');
    const frame2 = document.createElement('iframe');
    frame.src = './base/src/frame.html';
    frame2.src = './base/src/frame.html';
    const timeoutPayload = 100;
    const op = new Operator();
    op.connect(frame);
    op.connect(frame2);
    const promise = op.requestAll('reject-after', timeoutPayload);
    promise
      .then(() => {})
      .catch(data => {
        expect(data instanceof Array).toBeFalsy();
        expect(data).toEqual(timeoutPayload);
        document.body.removeChild(frame);
        document.body.removeChild(frame2);
        done();
      });
    document.body.appendChild(frame);
    document.body.appendChild(frame2);
  });

  it('resolves on the first promise when using requestRace', done => {
    const frame = document.createElement('iframe');
    const frame2 = document.createElement('iframe');
    frame.src = './base/src/frame.html';
    frame2.src = './base/src/frame.html';
    const timeoutPayload = 100;
    const op = new Operator();
    op.connect(frame);
    op.connect(frame2);
    const promise = op.requestRace('resolve-after', timeoutPayload);
    promise.then(data => {
      expect(data instanceof Array).toBeFalsy();
      expect(data).toEqual(timeoutPayload);
      document.body.removeChild(frame);
      document.body.removeChild(frame2);
      done();
    });
    document.body.appendChild(frame);
    document.body.appendChild(frame2);
  });

  it('rejects on the first promise rejection when using requestRace', done => {
    const frame = document.createElement('iframe');
    const frame2 = document.createElement('iframe');
    frame.src = './base/src/frame.html';
    frame2.src = './base/src/frame.html';
    const timeoutPayload = 100;
    const op = new Operator();
    op.connect(frame);
    op.connect(frame2);
    const promise = op.requestRace('reject-after', timeoutPayload);
    promise
      .then(() => {})
      .catch(data => {
        expect(data instanceof Array).toBeFalsy();
        expect(data).toEqual(timeoutPayload);
        document.body.removeChild(frame);
        document.body.removeChild(frame2);
        done();
      });
    document.body.appendChild(frame);
    document.body.appendChild(frame2);
  });

  it('returns a promise array when using resolve', done => {
    const frame = document.createElement('iframe');
    const frame2 = document.createElement('iframe');
    frame.src = './base/src/frame.html';
    frame2.src = './base/src/frame.html';
    const timeoutPayload = 100;
    const op = new Operator();
    op.connect(frame);
    op.connect(frame2);
    const promises = op.request('resolve-after', timeoutPayload);
    expect(promises instanceof Array).toBeTruthy();
    expect(promises.length).toEqual(2);
    expect(promises[0] instanceof Promise).toBeTruthy();
    Promise.all(promises).then(data => {
      expect(data instanceof Array).toBeTruthy();
      expect(data.length).toEqual(2);
      expect(data[0]).toEqual(timeoutPayload);
      expect(data[1]).toEqual(timeoutPayload);
      document.body.removeChild(frame);
      document.body.removeChild(frame2);
      done();
    });
    document.body.appendChild(frame);
    document.body.appendChild(frame2);
  });
});
