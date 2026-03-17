type DebugFn = ((...args: unknown[]) => void) & {
  enabled: boolean;
  namespace: string;
  extend: (subNamespace: string) => DebugFn;
  destroy: () => void;
  log: (...args: unknown[]) => void;
};

const createDebug = (namespace = ""): DebugFn => {
  const fn = ((..._args: unknown[]) => {}) as DebugFn;
  fn.enabled = false;
  fn.namespace = namespace;
  fn.extend = (subNamespace: string) =>
    createDebug(namespace ? `${namespace}:${subNamespace}` : subNamespace);
  fn.destroy = () => {};
  fn.log = (..._args: unknown[]) => {};
  return fn;
};

(createDebug as unknown as { default: typeof createDebug }).default =
  createDebug;
(createDebug as unknown as { enable: (namespaces: string) => void }).enable = (
  _namespaces: string,
) => {};
(createDebug as unknown as { disable: () => string }).disable = () => "";
(
  createDebug as unknown as { enabled: (namespace: string) => boolean }
).enabled = (_namespace: string) => false;
(createDebug as unknown as { log: (...args: unknown[]) => void }).log = (
  ..._args: unknown[]
) => {};
(
  createDebug as unknown as { formatArgs: (...args: unknown[]) => void }
).formatArgs = (..._args: unknown[]) => {};
(createDebug as unknown as { save: (namespaces: string) => void }).save = (
  _namespaces: string,
) => {};
(createDebug as unknown as { load: () => string }).load = () => "";
(createDebug as unknown as { useColors: () => boolean }).useColors = () =>
  false;
(
  createDebug as unknown as { humanize: (value: string | number) => string }
).humanize = (value: string | number) => String(value);

export default createDebug;
