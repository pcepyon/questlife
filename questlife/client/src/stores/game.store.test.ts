import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './game.store';
import type { User, CharacterClass, Quest, CharacterStatus } from '@shared/types';

describe('Game Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      user: null,
      classes: [],
      activeClass: null,
      quests: [],
      characterStatus: null,
      isLoading: false,
      showLevelUpModal: false
    });
  });

  describe('User Management', () => {
    it('should set user', () => {
      const user: User = {
        id: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          theme: 'dark',
          notifications: true,
          soundEffects: true
        }
      };

      useGameStore.getState().setUser(user);
      expect(useGameStore.getState().user).toEqual(user);
    });
  });

  describe('Class Management', () => {
    const mockClass: CharacterClass = {
      id: 'class-1',
      userId: 'user-1',
      name: 'Code Warrior',
      description: 'Master of algorithms',
      level: 5,
      currentXP: 250,
      xpToNextLevel: 500,
      status: 'active',
      targetLevel: 30,
      ultimateGoal: 'Become a senior developer',
      createdAt: new Date(),
      plannedEvolutions: []
    };

    it('should set classes', () => {
      const classes = [mockClass];
      useGameStore.getState().setClasses(classes);
      expect(useGameStore.getState().classes).toEqual(classes);
    });

    it('should set active class by ID', () => {
      useGameStore.getState().setClasses([mockClass]);
      useGameStore.getState().setActiveClass('class-1');
      expect(useGameStore.getState().activeClass).toEqual(mockClass);
    });

    it('should add new class and set it as active', () => {
      const newClass: CharacterClass = {
        ...mockClass,
        id: 'class-2',
        name: 'Data Sage'
      };

      useGameStore.getState().addClass(newClass);
      
      const state = useGameStore.getState();
      expect(state.classes).toHaveLength(1);
      expect(state.classes[0]).toEqual(newClass);
      expect(state.activeClass).toEqual(newClass);
    });

    it('should handle non-existent class ID', () => {
      useGameStore.getState().setClasses([mockClass]);
      useGameStore.getState().setActiveClass('non-existent');
      expect(useGameStore.getState().activeClass).toBeNull();
    });
  });

  describe('Quest Management', () => {
    const mockQuest: Quest = {
      id: 'quest-1',
      classId: 'class-1',
      type: 'daily',
      title: 'Complete coding challenge',
      description: 'Solve a problem',
      xpReward: 50,
      status: 'pending',
      difficulty: 2,
      createdAt: new Date(),
      attemptCount: 0
    };

    it('should set quests', () => {
      const quests = [mockQuest];
      useGameStore.getState().setQuests(quests);
      expect(useGameStore.getState().quests).toEqual(quests);
    });

    it('should complete quest and update XP', () => {
      const mockClass: CharacterClass = {
        id: 'class-1',
        userId: 'user-1',
        name: 'Test Class',
        description: 'Test',
        level: 5,
        currentXP: 250,
        xpToNextLevel: 500,
        status: 'active',
        targetLevel: 30,
        ultimateGoal: 'Test',
        createdAt: new Date(),
        plannedEvolutions: []
      };

      useGameStore.setState({
        classes: [mockClass],
        activeClass: mockClass,
        quests: [mockQuest]
      });

      useGameStore.getState().completeQuest('quest-1', 50);

      const state = useGameStore.getState();
      
      // Quest should be marked as completed
      expect(state.quests[0].status).toBe('completed');
      
      // XP should be added
      expect(state.activeClass?.currentXP).toBe(300);
      
      // Level should remain the same (not enough XP to level up)
      expect(state.activeClass?.level).toBe(5);
      expect(state.showLevelUpModal).toBe(false);
    });

    it('should handle level up when XP threshold is reached', () => {
      const mockClass: CharacterClass = {
        id: 'class-1',
        userId: 'user-1',
        name: 'Test Class',
        description: 'Test',
        level: 5,
        currentXP: 480,
        xpToNextLevel: 500,
        status: 'active',
        targetLevel: 30,
        ultimateGoal: 'Test',
        createdAt: new Date(),
        plannedEvolutions: []
      };

      useGameStore.setState({
        classes: [mockClass],
        activeClass: mockClass,
        quests: [mockQuest]
      });

      useGameStore.getState().completeQuest('quest-1', 50);

      const state = useGameStore.getState();
      
      // Should level up
      expect(state.activeClass?.level).toBe(6);
      expect(state.activeClass?.currentXP).toBe(30); // 480 + 50 - 500
      expect(state.showLevelUpModal).toBe(true);
    });

    it('should not update XP if no active class', () => {
      useGameStore.setState({
        activeClass: null,
        quests: [mockQuest]
      });

      useGameStore.getState().completeQuest('quest-1', 50);

      const state = useGameStore.getState();
      expect(state.quests[0].status).toBe('completed');
      expect(state.activeClass).toBeNull();
    });
  });

  describe('Character Status', () => {
    it('should set character status', () => {
      const status: CharacterStatus = {
        id: 'status-1',
        userId: 'user-1',
        strength: 15,
        wisdom: 20,
        creativity: 18,
        discipline: 12,
        charisma: 10,
        totalPowerLevel: 75,
        masteredClassCount: 2,
        totalQuestsCompleted: 45,
        permanentBonuses: [],
        updatedAt: new Date()
      };

      useGameStore.getState().setCharacterStatus(status);
      expect(useGameStore.getState().characterStatus).toEqual(status);
    });
  });

  describe('UI State', () => {
    it('should set loading state', () => {
      useGameStore.getState().setLoading(true);
      expect(useGameStore.getState().isLoading).toBe(true);
      
      useGameStore.getState().setLoading(false);
      expect(useGameStore.getState().isLoading).toBe(false);
    });

    it('should control level up modal', () => {
      useGameStore.getState().setShowLevelUpModal(true);
      expect(useGameStore.getState().showLevelUpModal).toBe(true);
      
      useGameStore.getState().setShowLevelUpModal(false);
      expect(useGameStore.getState().showLevelUpModal).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist specific state fields', () => {
      const user: User = {
        id: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          theme: 'dark',
          notifications: true,
          soundEffects: false
        }
      };

      const mockClass: CharacterClass = {
        id: 'class-1',
        userId: 'user-1',
        name: 'Persistent Class',
        description: 'Test',
        level: 10,
        currentXP: 500,
        xpToNextLevel: 1000,
        status: 'active',
        targetLevel: 30,
        ultimateGoal: 'Test',
        createdAt: new Date(),
        plannedEvolutions: []
      };

      useGameStore.setState({
        user,
        classes: [mockClass],
        activeClass: mockClass
      });

      // Get persisted state
      const persistedState = useGameStore.persist.getOptions().partialize?.(
        useGameStore.getState()
      );

      expect(persistedState).toEqual({
        user,
        classes: [mockClass],
        activeClass: mockClass
      });

      // Non-persisted fields should not be included
      expect(persistedState).not.toHaveProperty('isLoading');
      expect(persistedState).not.toHaveProperty('showLevelUpModal');
      expect(persistedState).not.toHaveProperty('quests');
    });
  });
});