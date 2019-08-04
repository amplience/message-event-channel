import mio from "../src/mio";
import { Operator } from "../src/Operator";
import { ClientConnection } from "../src/ClientConnection";
import { ServerConnection } from "../src/ServerConnection";

(function mockMessageChannel() {
  const MessageChannel = function () {
    return {
      port1: jest.fn(),
      port2: jest.fn(),
    };
  };

  global.MessageChannel = MessageChannel;
  global.onmessage = jest.fn();
})();

describe("mio", () => {
  it("is an instance of Operator", () => {
    expect(mio).toBeInstanceOf(Operator)
  })
  it("creates a client connection without an iframe", () => {
    const connection = mio.connect();
    expect(connection).toBeInstanceOf(ClientConnection);
  })
  it("creates a server connection with an iframe", () => {
    const frame = document.createElement('iframe');
    const connection = mio.connect(frame);
    expect(connection).toBeInstanceOf(ServerConnection);
  })
});