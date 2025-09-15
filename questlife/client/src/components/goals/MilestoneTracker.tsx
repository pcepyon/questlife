import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { CheckCircle, Circle, Plus, Calendar, Target, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  targetDate?: Date;
  progress: number;
  milestones: Milestone[];
  classId?: string;
  className?: string;
}

interface MilestoneTrackerProps {
  goal: Goal;
  onUpdateGoal: (updates: Partial<Goal>) => void;
}

export function MilestoneTracker({ goal, onUpdateGoal }: MilestoneTrackerProps) {
  const [newMilestone, setNewMilestone] = useState('');
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const completedMilestones = goal.milestones.filter(m => m.completed).length;
  const totalMilestones = goal.milestones.length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const handleToggleMilestone = (milestoneId: string) => {
    const updatedMilestones = goal.milestones.map(milestone => {
      if (milestone.id === milestoneId) {
        return {
          ...milestone,
          completed: !milestone.completed,
          completedAt: !milestone.completed ? new Date() : undefined
        };
      }
      return milestone;
    });

    const newProgress = Math.round((updatedMilestones.filter(m => m.completed).length / updatedMilestones.length) * 100);

    onUpdateGoal({
      milestones: updatedMilestones,
      progress: newProgress
    });
  };

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
      const newMilestoneObj: Milestone = {
        id: Date.now().toString(),
        title: newMilestone.trim(),
        completed: false
      };

      const updatedMilestones = [...goal.milestones, newMilestoneObj];
      const newProgress = Math.round((updatedMilestones.filter(m => m.completed).length / updatedMilestones.length) * 100);

      onUpdateGoal({
        milestones: updatedMilestones,
        progress: newProgress
      });
      setNewMilestone('');
    }
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    const updatedMilestones = goal.milestones.filter(m => m.id !== milestoneId);
    const newProgress = updatedMilestones.length > 0
      ? Math.round((updatedMilestones.filter(m => m.completed).length / updatedMilestones.length) * 100)
      : 0;

    onUpdateGoal({
      milestones: updatedMilestones,
      progress: newProgress
    });
  };

  const handleEditMilestone = (milestoneId: string, newTitle: string) => {
    const updatedMilestones = goal.milestones.map(milestone =>
      milestone.id === milestoneId
        ? { ...milestone, title: newTitle.trim() }
        : milestone
    );

    onUpdateGoal({ milestones: updatedMilestones });
    setEditingMilestone(null);
    setEditText('');
  };

  const startEditing = (milestone: Milestone) => {
    setEditingMilestone(milestone.id);
    setEditText(milestone.title);
  };

  const cancelEditing = () => {
    setEditingMilestone(null);
    setEditText('');
  };

  const handleStatusChange = (status: Goal['status']) => {
    onUpdateGoal({ status });
  };

  return (
    <div className="space-y-6">
      {/* Goal Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {goal.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {goal.description}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge
                variant={goal.status === 'active' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => handleStatusChange(
                  goal.status === 'active' ? 'paused' : 'active'
                )}
              >
                {goal.status === 'active' ? '진행 중' :
                 goal.status === 'paused' ? '일시정지' : '완료'}
              </Badge>
              {goal.className && (
                <Badge variant="outline">{goal.className}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Overview */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>전체 진행률</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="text-xs text-muted-foreground">
                {completedMilestones}/{totalMilestones} 마일스톤 완료
              </div>
            </div>

            {/* Goal Dates */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>시작: {goal.createdAt.toLocaleDateString('ko-KR')}</span>
              </div>
              {goal.targetDate && (
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>목표: {goal.targetDate.toLocaleDateString('ko-KR')}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone List */}
      <Card>
        <CardHeader>
          <CardTitle>마일스톤 추적</CardTitle>
          <CardDescription>
            목표 달성을 위한 단계별 진행 상황을 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Milestone */}
          <div className="flex gap-2">
            <Input
              placeholder="새 마일스톤을 추가하세요..."
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMilestone())}
              className="flex-1"
            />
            <Button
              onClick={handleAddMilestone}
              disabled={!newMilestone.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Milestone Items */}
          {goal.milestones.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">마일스톤이 없습니다</h3>
              <p className="text-sm text-muted-foreground">
                목표 달성을 위한 첫 번째 마일스톤을 추가해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {goal.milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 rounded-lg border transition-all ${
                    milestone.completed
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                      : 'bg-card hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleMilestone(milestone.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      {milestone.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingMilestone === milestone.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleEditMilestone(milestone.id, editText);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            className="text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditMilestone(milestone.id, editText)}
                              disabled={!editText.trim()}
                            >
                              저장
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className={`font-medium ${
                            milestone.completed ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {milestone.title}
                          </h4>
                          {milestone.completedAt && (
                            <p className="text-xs text-green-600 mt-1">
                              {milestone.completedAt.toLocaleDateString('ko-KR')}에 완료
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {editingMilestone !== milestone.id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(milestone)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Goal Completion */}
          {progressPercentage === 100 && goal.status !== 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-200 dark:border-green-800"
            >
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold mb-2">모든 마일스톤 완료!</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  축하합니다! 모든 마일스톤을 완료하셨습니다. 목표를 완료 처리하시겠습니까?
                </p>
                <Button
                  onClick={() => handleStatusChange('completed')}
                  className="bg-green-500 hover:bg-green-600"
                >
                  목표 완료 처리
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(
                goal.status === 'active' ? 'paused' : 'active'
              )}
            >
              {goal.status === 'active' ? '일시정지' : '다시 시작'}
            </Button>
            {goal.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('completed')}
              >
                목표 완료
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}