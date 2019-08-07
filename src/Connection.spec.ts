import { Connection } from '../src/Connection';
describe('Connection', () => {
  it('emit should return itself', () => {
    const connection = new Connection();
    expect(connection.emit('blah')).toBe(connection);
  });
  it('request should return a promise', () => {
    const connection = new Connection();
    expect(connection.request('blah') instanceof Promise).toBeTruthy();
  });
  it('on should return itself', () => {
    const connection = new Connection();
    expect(connection.on('blah', () => {})).toBe(connection);
  });
});
