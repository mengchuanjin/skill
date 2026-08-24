/**
 * 极简内存缓存。只为避免频繁打第三方 API（GitHub 未认证只有 60 次/小时）。
 * 进程重启即清空，不落盘、不用数据库 —— 这是刻意的，看板只展示当前快照。
 */
type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

/** 默认缓存 5 分钟 */
export const DEFAULT_TTL_MS = 5 * 60 * 1000;

/** 同一个 key 的并发请求共享同一次抓取，避免刷新按钮被连点时打穿上游 */
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  opts: { force?: boolean } = {},
): Promise<T> {
  if (!opts.force) {
    const hit = store.get(key) as Entry<T> | undefined;
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    const pending = inflight.get(key) as Promise<T> | undefined;
    if (pending) return pending;
  }

  const task = loader()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, task);
  return task;
}

export function clearCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
