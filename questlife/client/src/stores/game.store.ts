import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CharacterClass, Quest, CharacterStatus } from '@shared/types';

interface GameState {
  // User
  user: User | null;
  setUser: (user: User) => void;
  
  // Classes
  classes: CharacterClass[];
  activeClass: CharacterClass | null;
  setClasses: (classes: CharacterClass[]) => void;
  setActiveClass: (classId: string) => void;
  addClass: (newClass: CharacterClass) => void;
  
  // Quests
  quests: Quest[];
  setQuests: (quests: Quest[]) => void;
  completeQuest: (questId: string, xpGained: number) => void;
  
  // Status
  characterStatus: CharacterStatus | null;
  setCharacterStatus: (status: CharacterStatus) => void;
  
  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  showLevelUpModal: boolean;
  setShowLevelUpModal: (show: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Classes
      classes: [],
      activeClass: null,
      setClasses: (classes) => set({ classes }),
      setActiveClass: (classId) => {
        const classes = get().classes;
        const activeClass = classes.find(c => c.id === classId) || null;
        set({ activeClass });
      },
      addClass: (newClass) => set((state) => ({
        classes: [...state.classes, newClass],
        activeClass: newClass
      })),
      
      // Quests
      quests: [],
      setQuests: (quests) => set({ quests }),
      completeQuest: (questId, xpGained) => set((state) => {
        const updatedQuests = state.quests.map(q =>
          q.id === questId ? { ...q, status: 'completed' as const } : q
        );
        
        if (state.activeClass) {
          const newXP = state.activeClass.currentXP + xpGained;
          const leveledUp = newXP >= state.activeClass.xpToNextLevel;
          
          if (leveledUp) {
            set({ showLevelUpModal: true });
          }
          
          const updatedClass = {
            ...state.activeClass,
            currentXP: leveledUp ? newXP - state.activeClass.xpToNextLevel : newXP,
            level: leveledUp ? state.activeClass.level + 1 : state.activeClass.level
          };
          
          const updatedClasses = state.classes.map(c =>
            c.id === updatedClass.id ? updatedClass : c
          );
          
          return {
            quests: updatedQuests,
            activeClass: updatedClass,
            classes: updatedClasses
          };
        }
        
        return { quests: updatedQuests };
      }),
      
      // Status
      characterStatus: null,
      setCharacterStatus: (status) => set({ characterStatus: status }),
      
      // UI State
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      showLevelUpModal: false,
      setShowLevelUpModal: (show) => set({ showLevelUpModal: show })
    }),
    {
      name: 'questlife-storage',
      partialize: (state) => ({
        user: state.user,
        classes: state.classes,
        activeClass: state.activeClass
      })
    }
  )
);