import mio from './mio'
import { Operator } from './Operator'
import { Connection } from './Connection'
describe('mio instance', () => {
  it('should be an instance of Operator', () => {
    expect(mio instanceof Operator).toBeTruthy()
  })

  it('a connection should be an instance of Connection', () => {
    const connection = mio.connect()
    expect(connection instanceof Connection).toBeTruthy()
  })

  it('it should emit an connection event', done => {
    const frame = document.createElement('iframe')
    document.body.appendChild(frame)
    const connection = mio.connect(frame)
    frame.src = './base/src/frame.html'
    connection.on('mio-connected', (data: any) => {
      expect(data).toBeUndefined()
      document.body.removeChild(frame)
      done()
    })
  })

  it('it should return the data that was sent to it', done => {
    const frame = document.createElement('iframe')
    const requestJSON = {
      hello: 'there',
      test: true
    }
    document.body.appendChild(frame)
    const connection = mio.connect(frame)
    frame.src = './base/src/frame.html'
    connection.request('request-data-passthrough-success', requestJSON).then(dataReturned => {
      expect(dataReturned).toEqual(requestJSON)
      document.body.removeChild(frame)
      done()
    })
  })

  it('it should catch when response rejects', done => {
    const frame = document.createElement('iframe')
    const requestJSON = {
      hello: 'there',
      test: true
    }
    document.body.appendChild(frame)
    const connection = mio.connect(frame)
    frame.src = './base/src/frame.html'
    connection.request('request-data-passthrough-fail', requestJSON).catch(error => {
      expect(error).toEqual(requestJSON)
      document.body.removeChild(frame)
      done()
    })
  })
})
