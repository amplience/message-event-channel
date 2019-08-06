import { ClientConnection } from '../src/ClientConnection'

beforeAll(() => {})

describe('Server', () => {
  it('adds a window message listener', () => {
    const windowEvent = spyOn(window, 'addEventListener')
    new ClientConnection()
    expect(windowEvent).toHaveBeenCalled()
    expect(windowEvent).toHaveBeenCalledTimes(1)
    expect(windowEvent).toHaveBeenCalledWith('message', jasmine.any(Function))
  })

  it('should initiate on message and remove listner', () => {})
})
