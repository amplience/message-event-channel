import mio from './mio';
import { Operator } from './Operator';
import { Connection, MIO_EVENTS } from './Connection';
describe('mio', () => {
  it('should be an instance of Operator', () => {
    expect(mio instanceof Operator).toBeTruthy();
  });

  it('a connection should be an instance of Connection', () => {
    const connection = mio.connect();
    expect(connection instanceof Connection).toBeTruthy();
  });

  it('it should emit an connection event', done => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const connection = mio.connect(frame);
    frame.src = './base/src/frame.html';
    connection.on(MIO_EVENTS.CONNECTED, (data: any) => {
      expect(data).toBeUndefined();
      document.body.removeChild(frame);
      done();
    });
  });

  it('it should return the data that was sent to it', done => {
    const frame = document.createElement('iframe');
    const requestJSON = {
      hello: 'there',
      test: true
    };
    document.body.appendChild(frame);
    const connection = mio.connect(frame);
    frame.src = './base/src/frame.html';
    connection.request('passthrough', requestJSON).then(dataReturned => {
      expect(dataReturned).toEqual(requestJSON);
      document.body.removeChild(frame);
      done();
    });
  });

  it('it should catch when response rejects', done => {
    const frame = document.createElement('iframe');
    const requestJSON = {
      hello: 'there',
      test: true
    };
    document.body.appendChild(frame);
    const connection = mio.connect(frame);
    frame.src = './base/src/frame.html';
    connection.request('passthrough-fail', requestJSON).catch(error => {
      expect(error).toEqual(requestJSON);
      document.body.removeChild(frame);
      done();
    });
  });
});
