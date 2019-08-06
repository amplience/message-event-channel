import { ServerConnection } from '../src/ServerConnection'

describe('Server', () => {
  it('attaches an event listener to the frame', () => {
    const frame = document.createElement('iframe')
    const frameEvent = spyOn(frame, 'addEventListener')
    new ServerConnection(frame)
    expect(frameEvent).toHaveBeenCalled()
    expect(frameEvent).toHaveBeenCalledTimes(1)
  })

  it("doesn't attach an event listener to the frame if onload is fals", () => {
    const frame = document.createElement('iframe')
    const frameEvent = spyOn(frame, 'addEventListener')
    new ServerConnection(frame, { onload: false })
    expect(frameEvent).not.toHaveBeenCalled()
  })

  it('calls init when the frame is loaded', done => {
    const frame = document.createElement('iframe')
    const server = new ServerConnection(frame)
    const serverInit = spyOn(server, 'init')
    document.body.appendChild(frame)
    frame.onload = () => {
      expect(serverInit).toHaveBeenCalled()
      done()
    }
    frame.src = './base/src/frame.html'
  })
})
