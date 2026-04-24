import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ActiveTab = "converter" | "history";
export type Theme = "light" | "dark" | "system";

interface AppState {
  activeTab: ActiveTab;
  theme: Theme;
  jobPollingIds: Set<string>;

  setActiveTab: (tab: ActiveTab) => void;
  setTheme: (theme: Theme) => void;
  addPollingId: (id: string) => void;
  removePollingId: (id: string) => void;
  clearPollingIds: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: "converter",
      theme: "system",
      jobPollingIds: new Set<string>(),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setTheme: (theme) => set({ theme }),
      addPollingId: (id) =>
        set((state) => ({
          jobPollingIds: new Set([...state.jobPollingIds, id]),
        })),
      removePollingId: (id) =>
        set((state) => {
          const next = new Set(state.jobPollingIds);
          next.delete(id);
          return { jobPollingIds: next };
        }),
      clearPollingIds: () => set({ jobPollingIds: new Set<string>() }),
    }),
    {
      name: "framemotion-store",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
