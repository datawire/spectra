import { observable, observe, observeAll, disposeHandlers, Observable } from '../observable';

describe('observable', () => {
  it('notifies key-specific observers when a key is set', () => {
    const obj = observable({ a: 1 });
    const callback = jest.fn(() => {
      expect(obj.a).toBe(2);
    });
    observe(obj, 'a', callback);

    obj.a = 2;

    expect(callback).toHaveBeenCalled();
  });

  it('notifies global observer when any key is set', () => {
    const obj = observable({ a: 1, b: 2 });
    const callback = jest
      .fn()
      .mockImplementationOnce(() => {
        expect(obj.a).toBe(3);
      })
      .mockImplementationOnce(() => {
        expect(obj.b).toBe(4);
      });
    observeAll(obj, callback);

    obj.a = 3;
    obj.b = 4;

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('does not notify observers after handlers are disposed', () => {
    const obj = observable({ a: 1 });
    const callback = jest.fn();
    observe(obj, 'a', callback);

    disposeHandlers(obj);
    obj.a = 2;

    expect(callback).not.toHaveBeenCalled();
  });

  it('should throw an error if trying to observe an unregistered observable', () => {
    const obj = observable({ a: 1 });
    const callback = jest.fn();

    expect(() => observe({ ...obj }, 'a', callback)).toThrow('Observable not registered');
  });

  it('handles observing a key that does not exist initially', () => {
    const obj = observable<{ a?: number }>({});
    const callback = jest.fn();
    observe(obj, 'a', callback);

    obj.a = 1;

    expect(callback).toHaveBeenCalled();
  });
});
