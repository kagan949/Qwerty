"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomePayload } from "@/types";

async function loadHome(): Promise<HomePayload> {
  const response = await fetch("/api/home", { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`home_${response.status}`);
  return (await response.json()) as HomePayload;
}

export function useHomeData() {
  return useQuery({
    queryKey: ["home"],
    queryFn: loadHome,
    staleTime: 5 * 60_000,
    retry: 2,
  });
}
