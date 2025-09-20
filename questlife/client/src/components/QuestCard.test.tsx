import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestCard } from './QuestCard';
import type { Quest } from '@shared/types';

describe('QuestCard', () => {
  const mockQuest: Quest = {
    id: 'quest-1',
    classId: 'class-1',
    type: 'daily',
    title: 'Complete coding challenge',
    description: 'Solve a medium difficulty algorithm problem',
    xpReward: 50,
    status: 'pending',
    difficulty: 3,
    createdAt: new Date(),
    attemptCount: 0
  };

  const mockOnComplete = vi.fn();

  it('should render quest information', () => {
    render(<QuestCard quest={mockQuest} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('Complete coding challenge')).toBeInTheDocument();
    expect(screen.getByText('Solve a medium difficulty algorithm problem')).toBeInTheDocument();
    expect(screen.getByText(/50 XP/)).toBeInTheDocument();
  });

  it('should display correct quest type badge', () => {
    render(<QuestCard quest={mockQuest} onComplete={mockOnComplete} />);
    
    const badge = screen.getByText('Daily');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-blue-100');
  });

  it('should show difficulty stars', () => {
    render(<QuestCard quest={mockQuest} onComplete={mockOnComplete} />);
    
    const stars = screen.getAllByTestId('difficulty-star');
    expect(stars).toHaveLength(5);
    
    // First 3 should be filled (difficulty = 3)
    expect(stars[0].className).toContain('text-yellow-500');
    expect(stars[1].className).toContain('text-yellow-500');
    expect(stars[2].className).toContain('text-yellow-500');
    expect(stars[3].className).toContain('text-gray-300');
    expect(stars[4].className).toContain('text-gray-300');
  });

  it('should handle complete button click', () => {
    render(<QuestCard quest={mockQuest} onComplete={mockOnComplete} />);
    
    const completeButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(completeButton);
    
    expect(mockOnComplete).toHaveBeenCalledWith('quest-1');
  });

  it('should disable complete button for completed quests', () => {
    const completedQuest = { ...mockQuest, status: 'completed' as const };
    render(<QuestCard quest={completedQuest} onComplete={mockOnComplete} />);
    
    const completeButton = screen.getByRole('button');
    expect(completeButton).toBeDisabled();
    expect(completeButton).toHaveTextContent('Completed');
  });

  it('should show urgent badge for urgent quests', () => {
    const urgentQuest = { ...mockQuest, type: 'urgent' as const };
    render(<QuestCard quest={urgentQuest} onComplete={mockOnComplete} />);
    
    const badge = screen.getByText('Urgent');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-red-100');
  });

  it('should show time remaining for time-limited quests', () => {
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    const timedQuest = { ...mockQuest, expiresAt, timeLimit: 7200 };
    render(<QuestCard quest={timedQuest} onComplete={mockOnComplete} />);
    
    expect(screen.getByText(/Time remaining:/)).toBeInTheDocument();
  });

  it('should apply correct styling for different quest types', () => {
    const questTypes = [
      { type: 'daily' as const, color: 'blue' },
      { type: 'weekly' as const, color: 'purple' },
      { type: 'monthly' as const, color: 'green' },
      { type: 'urgent' as const, color: 'red' },
      { type: 'special' as const, color: 'yellow' }
    ];

    questTypes.forEach(({ type, color }) => {
      const { unmount } = render(
        <QuestCard 
          quest={{ ...mockQuest, type }} 
          onComplete={mockOnComplete} 
        />
      );
      
      const badge = screen.getByText(type.charAt(0).toUpperCase() + type.slice(1));
      expect(badge.className).toContain(`bg-${color}-100`);
      
      unmount();
    });
  });

  it('should show loading state while completing', async () => {
    const { rerender } = render(
      <QuestCard quest={mockQuest} onComplete={mockOnComplete} isCompleting={false} />
    );
    
    let completeButton = screen.getByRole('button', { name: /complete/i });
    expect(completeButton).not.toBeDisabled();
    
    rerender(
      <QuestCard quest={mockQuest} onComplete={mockOnComplete} isCompleting={true} />
    );
    
    completeButton = screen.getByRole('button');
    expect(completeButton).toBeDisabled();
    expect(completeButton).toHaveTextContent('Completing...');
  });
});