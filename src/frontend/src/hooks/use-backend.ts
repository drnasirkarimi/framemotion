import { useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { Backend } from "../backend";

export function useBackend(): { backend: Backend | null; isReady: boolean } {
  const { actor, isFetching } = useActor(createActor);

  return {
    backend: actor as Backend | null,
    isReady: !!actor && !isFetching,
  };
}
