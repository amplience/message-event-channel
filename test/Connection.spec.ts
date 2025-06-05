import { Connection, MESSAGE_TYPE } from '../src/Connection';
describe('Connection', () => {
  describe('emit()', () => {
    it('should return itself', () => {
      const connection = new Connection();
      expect(connection.emit('blah')).toBe(connection);
    });
  });

  describe('on()', () => {
    it('should register callback', () => {
      const connection = new Connection();
      const cb = jasmine.createSpy('cb');

      connection.on('callme', cb);

      (connection as any).handleMessage({
        type: MESSAGE_TYPE.EMIT,
        event: 'callme',
        payload: {}
      });

      expect(cb).toHaveBeenCalled();
    });
    it('should return itself', () => {
      const connection = new Connection();
      expect(connection.on('blah', () => {})).toBe(connection);
    });
  });

  describe('off()', () => {
    it('should remove callback', () => {
      const connection = new Connection();
      const cb = jasmine.createSpy('cb');

      connection.on('remove', cb);
      connection.off('remove', cb);

      (connection as any).handleMessage({
        type: MESSAGE_TYPE.EMIT,
        event: 'remove',
        payload: {}
      });

      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('request()', () => {
    it('should return a promise', () => {
      const connection = new Connection();
      expect(connection.request('blah') instanceof Promise).toBeTruthy();
    });
    it('should set timeout if timeout option is passed', async () => {
      const connection = new Connection();
      try {
        await connection.request('test', { timeout: 1 });
      } catch (e) {
        expect(e).toEqual('timeout');
      }
    });
    it('should set timeout if timeout option is passed', async () => {
      const connection = new Connection();
      try {
        await connection.request('test', { timeout: 1 });
      } catch (e) {
        expect(e).toEqual('timeout');
      }
    });
  });

  describe('close()', () => {
    it('should close port if connected', () => {
      const connection = new Connection();
      //@ts-ignore
      connection.port = { close: () => {} };
      //@ts-ignore
      spyOn(connection.port, 'close');
      connection.connected = true;
      connection.close();
      //@ts-ignore
      expect(connection.port.close).toHaveBeenCalled();
      expect(connection.connected).toEqual(false);
    });
    it('should remove event listener if client inits listener', () => {
      const connection = new Connection();
      //@ts-ignore
      connection.messageListener = true;
      //@ts-ignore
      spyOn(connection.options.window, 'removeEventListener');
      connection.close();
      //@ts-ignore
      expect(connection.options.window.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('initPortEvents()', () => {
    it('should handle error on message error', () => {
      const connection = new Connection({ debug: true });
      //@ts-ignore
      connection.port = {};
      //@ts-ignore
      connection.initPortEvents();
      //@ts-ignore
      spyOn(connection, 'handleError').and.callThrough();
      //@ts-ignore
      connection.port.onmessageerror();
      //@ts-ignore
      expect(connection.handleError).toHaveBeenCalled();
    });
  });

  describe('getRequestTimeout()', () => {
    it('should return timeout if numeric', () => {
      const connection = new Connection();
      //@ts-ignore
      const timeout = connection.getRequestTimeout(10);
      expect(timeout).toEqual(10);
    });
    it('should return 0 if timeout is < 0', () => {
      const connection = new Connection();
      //@ts-ignore
      const timeout = connection.getRequestTimeout(-1);
      expect(timeout).toEqual(0);
    });
    it('should return options.timeout if timeout is true', () => {
      const connection = new Connection({ timeout: 100 });
      //@ts-ignore
      const timeout = connection.getRequestTimeout(true);
      expect(timeout).toEqual(100);
    });
    it('should return false if timeout is false', () => {
      const connection = new Connection();
      //@ts-ignore
      const timeout = connection.getRequestTimeout(false);
      expect(timeout).toEqual(false);
    });
  });

  describe('portMessage()', () => {
    it('should call console.log if debug enabled', () => {
      const connection = new Connection({ debug: true });
      spyOn(console, 'log');
      //@ts-ignore
      connection.port = { postMessage: () => {} };
      //@ts-ignore
      connection.portMessage(MESSAGE_TYPE.EMIT);
      expect(console.log).toHaveBeenCalled();
    });
  });
});
