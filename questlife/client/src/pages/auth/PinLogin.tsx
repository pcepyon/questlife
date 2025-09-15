import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { PinInput } from '@/components/auth/PinInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/spinner';
import { Lock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function PinLogin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  const { user, verifyPin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // If no user exists, redirect to setup
    if (!user) {
      navigate('/setup');
    }
  }, [user, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockedUntil) {
      interval = setInterval(() => {
        const now = new Date();
        if (now >= lockedUntil) {
          setLockedUntil(null);
          setError('');
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockedUntil]);

  const handlePinComplete = async (completedPin: string) => {
    if (lockedUntil && new Date() < lockedUntil) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await verifyPin(completedPin);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || '잘못된 PIN입니다.');
      setPin('');

      // Handle attempt tracking and lockout
      if (error.attemptsRemaining !== undefined) {
        setAttemptsRemaining(error.attemptsRemaining);
      }
      if (error.lockedUntil) {
        setLockedUntil(new Date(error.lockedUntil));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPin('');
    setError('');
  };

  const isLocked = Boolean(lockedUntil && new Date() < lockedUntil);
  const remainingTime = isLocked
    ? Math.ceil((lockedUntil!.getTime() - new Date().getTime()) / 1000)
    : 0;

  if (!user) {
    return null; // Will redirect to setup
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center space-y-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mx-auto"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                {isLocked ? (
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                ) : (
                  <Lock className="w-8 h-8 text-primary" />
                )}
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {isLocked ? '일시적으로 잠김' : 'PIN 입력'}
              </CardTitle>
              <CardDescription className="mt-2">
                {isLocked
                  ? `${remainingTime}초 후에 다시 시도할 수 있습니다.`
                  : 'QuestLife에 접속하기 위해 PIN을 입력해주세요.'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {attemptsRemaining !== null && attemptsRemaining < 3 && !isLocked && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  남은 시도 횟수: {attemptsRemaining}회
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  PIN 입력
                </p>
                <div className="flex justify-center">
                  <PinInput
                    length={4}
                    value={pin}
                    onChange={setPin}
                    onComplete={handlePinComplete}
                    disabled={isLoading || isLocked}
                    error={!!error}
                  />
                </div>
              </div>

              {pin.length > 0 && !isLocked && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-2"
                >
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    다시 입력
                  </Button>
                </motion.div>
              )}
            </div>

            {isLoading && (
              <div className="text-center flex flex-col items-center gap-2">
                <LoadingSpinner size="default" className="text-primary" />
                <p className="text-sm text-muted-foreground">확인 중...</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                PIN을 잊으셨나요?
                <br />
                앱을 재설치하면 새로운 PIN을 설정할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}