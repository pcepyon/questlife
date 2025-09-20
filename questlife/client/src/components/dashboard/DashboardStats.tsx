import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  stats: {
    totalClasses: number;
    completedQuests: number;
    totalXP: number;
    maxStreak: number;
    todayXP: number;
    weeklyXP: number;
    completionRate: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      icon: Trophy,
      label: '총 클래스',
      value: stats.totalClasses,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      icon: Target,
      label: '완료한 퀘스트',
      value: stats.completedQuests,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: Zap,
      label: '총 경험치',
      value: stats.totalXP.toLocaleString(),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      icon: TrendingUp,
      label: '최고 연속',
      value: `${stats.maxStreak}일`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* Additional Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="col-span-2 md:col-span-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{stats.todayXP}</div>
                <div className="text-xs text-muted-foreground">오늘 획득 XP</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-500">{stats.weeklyXP}</div>
                <div className="text-xs text-muted-foreground">주간 XP</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-lg font-bold text-green-500">
                    {stats.completionRate}%
                  </div>
                  <Badge variant="outline" className="text-xs">완료율</Badge>
                </div>
                <div className="text-xs text-muted-foreground">이번 주 완료율</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}