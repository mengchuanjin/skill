"use client";

import * as React from "react";
import useSWR from "swr";
import type { DashboardPayload } from "@/lib/types";

/**
 * 自动刷新间隔（分钟）。默认 45，落在需求要求的 30-60 区间内。
 * 想验证自动刷新逻辑时，在 .env.local 里把它调成 0.1（= 6 秒）即可。
 */
export const REFRESH_INTERVAL_MINUTES = Number(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MINUTES ?? 45,
);

const ENDPOINT = "/api/dashboard";

async function fetcher(url: string): Promise<DashboardPayload> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`请求失败：HTTP ${res.status}`);
  return res.json();
}

/**
 * 首页和二级页共用。SWR 按 key 去重，两个页面拿到的是同一份缓存，
 * 从首页点进「更多」不会重新打一次接口。
 */
export function useDashboard() {
  const [manualRefreshing, setManualRefreshing] = React.useState(false);

  const { data, error, isLoading, mutate } = useSWR<DashboardPayload>(
    ENDPOINT,
    fetcher,
    {
      // 前端定时器触发重新请求，不需要服务端 cron
      refreshInterval: REFRESH_INTERVAL_MINUTES * 60 * 1000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const refresh = React.useCallback(async () => {
    setManualRefreshing(true);
    try {
      // refresh=1 让后端跳过 5 分钟内存缓存，真正回源
      const fresh = await fetcher(`${ENDPOINT}?refresh=1`);
      await mutate(fresh, { revalidate: false });
    } catch {
      await mutate();
    } finally {
      setManualRefreshing(false);
    }
  }, [mutate]);

  const items = React.useMemo(() => data?.items ?? [], [data]);

  return {
    data,
    items,
    error,
    refresh,
    isBusy: manualRefreshing || isLoading,
    lastUpdated: data?.fetchedAt ? new Date(data.fetchedAt).getTime() : null,
  };
}
