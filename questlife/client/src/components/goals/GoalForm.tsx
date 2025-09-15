import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Milestone {
  id: string;
  title: string;
  description?: string;
}

interface GoalFormData {
  title: string;
  description: string;
  targetDate?: string;
  category: string;
  milestones: Milestone[];
}

interface GoalFormProps {
  onSubmit: (data: GoalFormData) => Promise<void>;
  initialData?: Partial<GoalFormData>;
}

export function GoalForm({ onSubmit, initialData }: GoalFormProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    targetDate: initialData?.targetDate || '',
    category: initialData?.category || '개인 성장',
    milestones: initialData?.milestones || []
  });

  const [newMilestone, setNewMilestone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    '건강', '운동', '학습', '독서', '취미', '커리어', '관계', '창작', '여행', '개인 성장'
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '목표 제목을 입력해주세요.';
    }

    if (!formData.description.trim()) {
      newErrors.description = '목표 설명을 입력해주세요.';
    }

    if (formData.milestones.length === 0) {
      newErrors.milestones = '최소 1개의 마일스톤을 추가해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
      const milestone: Milestone = {
        id: Date.now().toString(),
        title: newMilestone.trim()
      };
      setFormData(prev => ({
        ...prev,
        milestones: [...prev.milestones, milestone]
      }));
      setNewMilestone('');
    }
  };

  const handleRemoveMilestone = (id: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            목표 기본 정보
          </CardTitle>
          <CardDescription>
            달성하고자 하는 목표의 기본 정보를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">목표 제목 *</Label>
            <Input
              id="title"
              placeholder="예: 매일 30분 운동하기"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">목표 설명 *</Label>
            <textarea
              id="description"
              placeholder="이 목표를 통해 무엇을 달성하고 싶은지 자세히 설명해주세요..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.description ? 'border-destructive' : 'border-input'
              }`}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">목표 날짜 (선택사항)</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            마일스톤
          </CardTitle>
          <CardDescription>
            목표 달성을 위한 중간 단계들을 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Milestone */}
          <div className="flex gap-2">
            <Input
              placeholder="마일스톤을 입력하세요..."
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMilestone())}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddMilestone}
              disabled={!newMilestone.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {errors.milestones && (
            <p className="text-sm text-destructive">{errors.milestones}</p>
          )}

          {/* Milestone List */}
          {formData.milestones.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">추가된 마일스톤:</h4>
              <div className="space-y-2">
                {formData.milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-accent/50"
                  >
                    <Badge variant="outline" className="shrink-0">
                      {index + 1}
                    </Badge>
                    <span className="flex-1 text-sm">{milestone.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMilestone(milestone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>미리보기</CardTitle>
          <CardDescription>
            생성될 목표의 미리보기입니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold">{formData.title || '목표 제목'}</h3>
            <p className="text-sm text-muted-foreground">
              {formData.description || '목표 설명'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{formData.category}</Badge>
            {formData.targetDate && (
              <Badge variant="outline">
                {new Date(formData.targetDate).toLocaleDateString('ko-KR')}까지
              </Badge>
            )}
            <Badge variant="outline">
              {formData.milestones.length}개 마일스톤
            </Badge>
          </div>

          {formData.milestones.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">마일스톤:</h4>
              <div className="space-y-1">
                {formData.milestones.slice(0, 3).map((milestone, index) => (
                  <div key={milestone.id} className="text-sm text-muted-foreground">
                    {index + 1}. {milestone.title}
                  </div>
                ))}
                {formData.milestones.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    ... 및 {formData.milestones.length - 3}개 더
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Target className="h-4 w-4 mr-2" />
          )}
          {initialData ? '목표 수정' : '목표 생성 및 클래스 만들기'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        목표를 생성하면 AI가 분석하여 맞춤형 클래스와 퀘스트를 자동으로 생성합니다.
      </div>
    </form>
  );
}