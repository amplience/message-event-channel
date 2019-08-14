const createIframe = (uri: string = '') => {
  const frame: HTMLIFrameElement = document.createElement('iframe');
  frame.setAttribute(
    'sandbox',
    'allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox'
  );
  frame.src = uri;
  return frame;
};
const appendIframe = (frame: HTMLIFrameElement) => {
  document.body.appendChild(frame);
};
const removeIframe = (frame: HTMLIFrameElement) => {
  document.body.removeChild(frame);
};

export { createIframe, appendIframe, removeIframe };
