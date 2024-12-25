import { getElement } from '../domUtils';

describe('domUtils', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-div"></div>
      <button id="test-btn"></button>
    `;
  });

  it('should return the correct HTMLElement for a valid ID', () => {
    const div = getElement<HTMLDivElement>('test-div');
    expect(div).not.toBeNull();
    expect(div?.tagName).toBe('DIV');

    const btn = getElement<HTMLButtonElement>('test-btn');
    expect(btn).not.toBeNull();
    expect(btn?.tagName).toBe('BUTTON');
  });

  it('should return null for an invalid ID', () => {
    const element = getElement<HTMLDivElement>('non-existent');
    expect(element).toBeNull();
  });

  it('should cast the element to the specified type', () => {
    const btn = getElement<HTMLButtonElement>('test-btn');
    expect(btn).not.toBeNull();
    expect(btn instanceof HTMLButtonElement).toBe(true);
  });
});
