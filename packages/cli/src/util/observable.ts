type AllHandler = (key: PropertyKey) => void;
type KeyHandler = () => void;
type Handlers = {
  all: Set<AllHandler>;
  keys: Record<PropertyKey, Set<KeyHandler>>;
};

const REGISTRY = new WeakMap<Observable, Handlers>();

function invokeHandlers(handlers: Handlers, key: PropertyKey) {
  for (const handler of handlers.all) {
    handler(key);
  }

  const keyHandlers = handlers.keys[key];
  if (keyHandlers) {
    for (const handler of keyHandlers) {
      handler();
    }
  }
}

// we can replace this with https://github.com/tc39/proposal-signals once it makes it to the spec
export function observable<O extends object>(options: O): Observable<O> {
  const observable = new Proxy<Observable<O>>(options as Observable<O>, {
    set(target, key, value) {
      const set = Reflect.set(target, key, value);
      const handlers = REGISTRY.get(observable);
      if (handlers !== void 0) {
        invokeHandlers(handlers, key);
      }

      return set;
    },
  });
  REGISTRY.set(observable, { all: new Set(), keys: {} });
  return observable;
}

export function observe<O extends object>(observable: Observable<O>, key: keyof O, cb: () => void) {
  const registry = REGISTRY.get(observable);
  if (registry === void 0) {
    throw new Error('Observable not registered');
  }

  registry.keys[key] ??= new Set();
  registry.keys[key].add(cb);
}

export function observeAll<O extends object>(observable: Observable<O>, cb: (key: keyof O) => void) {
  const registry = REGISTRY.get(observable);
  if (registry === void 0) {
    throw new Error('Observable not registered');
  }

  registry.all.add(cb as AllHandler);
}

export function disposeHandlers(observable: Observable) {
  const registry = REGISTRY.get(observable);
  if (registry === void 0) {
    return;
  }

  registry.all.clear();
  for (const key of Object.keys(registry.keys)) {
    registry.keys[key].clear();
  }
}

const INTERNAL_SYMBOL = Symbol('internal');

export type Observable<O extends object = object> = O & {
  [INTERNAL_SYMBOL]: true;
};
