import { useState, useEffect, useCallback } from 'react';
import { Bill, DashboardStats } from '../types/bahiverse';
import { billsApi } from '../services/api';

export function useBills(params?: { page?: number; limit?: number; status?: string }) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await billsApi.list(params);
      setBills(res.bills as Bill[]);
      setTotal(res.total);
      setPages(res.pages);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { bills, total, pages, isLoading, error, refetch: fetch };
}

export function useBillStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const s = await billsApi.stats();
      setStats(s);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { stats, isLoading, error, refetch: fetch };
}

export function useBill(id: string | undefined) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const b = await billsApi.get(id);
      setBill(b as Bill);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);
  return { bill, isLoading, error, refetch: fetch };
}
