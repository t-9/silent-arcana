import { setLoadingText } from '../uiUtils';

describe('uiUtils', () => {
  let loadingEl: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `<div id="loading"></div>`;
    loadingEl = document.getElementById('loading')!;
  });

  it('should set the text content of the loading element', () => {
    setLoadingText(loadingEl, 'Loading...');
    expect(loadingEl.textContent).toBe('Loading...');
  });

  it('should override the previous text content', () => {
    setLoadingText(loadingEl, 'Loading...');
    setLoadingText(loadingEl, 'Complete');
    expect(loadingEl.textContent).toBe('Complete');
  });
});
