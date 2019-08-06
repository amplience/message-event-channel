import { Operator } from '../src/Operator'
import { ClientConnection } from '../src/ClientConnection'
import { ServerConnection } from '../src/ServerConnection'

describe('Operator', () => {
  it('creates a client connection without an iframe', () => {
    const op = new Operator()
    const connection = op.connect()
    expect(connection instanceof ClientConnection).toBeTruthy()
  })
  it('creates a server connection with an iframe', () => {
    const frame = document.createElement('iframe')
    const op = new Operator()
    const connection = op.connect(frame)
    expect(connection instanceof ServerConnection).toBeTruthy()
  })
  it('closes a connection', () => {
    const frame = document.createElement('iframe')
    const op = new Operator()
    const connection = op.connect(frame)
    const spyClose = spyOn(connection, 'close')
    op.close(connection)
    expect(spyClose).toHaveBeenCalled()
  })

  it('emits to all connections', () => {
    const frame = document.createElement('iframe')
    const op = new Operator()
    const connection1 = op.connect(frame)
    const connection2 = op.connect(frame)
    const spyEmit1 = spyOn(connection1, 'emit')
    const spyEmit2 = spyOn(connection2, 'emit')
    op.emit('event')
    expect(spyEmit1).toHaveBeenCalled()
    expect(spyEmit2).toHaveBeenCalled()
  })

  it("doesn't emit to closed connections", () => {
    const frame = document.createElement('iframe')
    const op = new Operator()
    const connection1 = op.connect(frame)
    const connection2 = op.connect(frame)
    const spyEmit1 = spyOn(connection1, 'emit')
    const spyEmit2 = spyOn(connection2, 'emit')
    op.close(connection1)
    op.emit('event')
    expect(spyEmit1).not.toHaveBeenCalled()
    expect(spyEmit2).toHaveBeenCalled()
  })
})
