import { describe, it, expect, beforeEach } from 'vitest';
import { getElement } from '../domUtils';

describe('domUtils', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-div"></div>
      <button id="test-btn"></button>
    `;
  });

  it('should return the correct HTMLElement for a valid ID', () => {
    const element = getElement<HTMLDivElement>('test-div');
    expect(element).not.toBeNull();
    expect(element?.tagName.toLowerCase()).toBe('div');
  });

  it('should return null for an invalid ID', () => {
    const element = getElement<HTMLElement>('non-existent');
    expect(element).toBeNull();
  });

  it('should cast the element to the specified type', () => {
    const button = getElement<HTMLButtonElement>('test-btn');
    expect(button).not.toBeNull();
    expect(button?.tagName.toLowerCase()).toBe('button');
  });
});
