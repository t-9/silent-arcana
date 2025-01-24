import { describe, it, expect, beforeEach } from 'vitest';
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
    expect(loadingEl.getAttribute('data-text')).toBe('Loading...');
  });

  it('should override the previous text content', () => {
    setLoadingText(loadingEl, 'First');
    setLoadingText(loadingEl, 'Second');
    expect(loadingEl.textContent).toBe('Second');
    expect(loadingEl.getAttribute('data-text')).toBe('Second');
  });

  it('should clear the text content when no text is provided', () => {
    setLoadingText(loadingEl, 'Loading...');
    setLoadingText(loadingEl, '');
    expect(loadingEl.textContent).toBe('');
    expect(loadingEl.getAttribute('data-text')).toBe('');
  });
});
