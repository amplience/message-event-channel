import { Operator } from '../src/Operator';
import { Connection, MIO_EVENTS } from '../src/Connection';
import { createIframe, appendIframe, removeIframe } from './TestHelpers';

const mio = new Operator();

describe('mio', () => {
  it('should be an instance of Operator', () => {
    expect(mio instanceof Operator).toBeTruthy();
  });

  it('a connection should be an instance of Connection', () => {
    const connection = mio.connect();
    expect(connection instanceof Connection).toBeTruthy();
  });

  it('it should emit an connection event', done => {
    const frame = createIframe('./base/src/frame.html');
    const connection = mio.connect(frame);
    connection.on(MIO_EVENTS.CONNECTED, (data: any) => {
      expect(data).toBeUndefined();
      removeIframe(frame);
      done();
    });
    appendIframe(frame);
  });

  it('it should return the data that was sent to it', done => {
    const frame = createIframe('./base/src/frame.html');
    const requestJSON = {
      hello: 'there',
      test: true
    };
    const connection = mio.connect(frame);
    connection
      .request('passthrough', requestJSON)
      .then(dataReturned => {
        expect(dataReturned).toEqual(requestJSON);
        removeIframe(frame);
        done();
      })
      .catch(done.fail);
    appendIframe(frame);
  });

  it('it should catch when response rejects', done => {
    const frame = createIframe('./base/src/frame.html');
    const requestJSON = {
      hello: 'there',
      test: true
    };
    const connection = mio.connect(frame);
    connection
      .request('passthrough-fail', requestJSON)
      .then(done.fail)
      .catch(error => {
        expect(error).toEqual(requestJSON);
        removeIframe(frame);
        done();
      });
    appendIframe(frame);
  });
});
