import { debounceCallback } from '../debounceCallback';

jest.mock('node:timers', () => ({
  setTimeout: jest.fn((cb: Function, timeout: number, ...args: unknown[]) =>
    globalThis.setTimeout(cb, timeout, ...args)
  ),
  clearTimeout: jest.fn(((...args) => globalThis.clearTimeout(...args)) satisfies typeof globalThis.clearTimeout),
}));

describe('debounceCallback', () => {
  jest.useFakeTimers();

  it('should call the callback after the specified delay', () => {
    const callback = jest.fn();
    const signal = new AbortController().signal;
    const debouncedCallback = debounceCallback(callback, signal);

    debouncedCallback('test-path');
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledWith('test-path');
  });

  it('should reset the timer if called again before the delay', () => {
    const callback = jest.fn();
    const signal = new AbortController().signal;
    const debouncedCallback = debounceCallback(callback, signal);

    debouncedCallback('test-path');
    jest.advanceTimersByTime(300);
    debouncedCallback('test-path');
    jest.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledWith('test-path');
  });

  it('should track multiple paths separately', () => {
    const callback = jest.fn();
    const signal = new AbortController().signal;
    const debouncedCallback = debounceCallback(callback, signal);

    debouncedCallback('test-path-1');
    debouncedCallback('test-path-2');
    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledWith('test-path-1');
    expect(callback).toHaveBeenCalledWith('test-path-2');
  });

  it('should clear the timeout when the signal is aborted', () => {
    const callback = jest.fn();
    const abortController = new AbortController();
    const debouncedCallback = debounceCallback(callback, abortController.signal);

    debouncedCallback('test-path');
    abortController.abort();
    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
  });
});
