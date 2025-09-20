import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { PinInput } from '@/components/auth/PinInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function PinSetup() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setupPin } = useAuthStore();
  const navigate = useNavigate();

  const handlePinComplete = async (completedPin: string) => {
    if (step === 'setup') {
      if (completedPin.length >= 4 && completedPin.length <= 6) {
        setPin(completedPin);
        setStep('confirm');
        setError('');
      } else {
        setError('PIN은 4-6자리 숫자여야 합니다.');
      }
    } else if (step === 'confirm') {
      setConfirmPin(completedPin);
      if (completedPin === pin) {
        await handleSetupPin(pin);
      } else {
        setError('PIN이 일치하지 않습니다. 다시 시도해주세요.');
        setStep('setup');
        setPin('');
        setConfirmPin('');
      }
    }
  };

  const handleSetupPin = async (pinValue: string) => {
    setIsLoading(true);
    try {
      await setupPin(pinValue);
      navigate('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      setStep('setup');
      setPin('');
      setConfirmPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('setup');
      setConfirmPin('');
      setError('');
    }
  };

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
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="mx-auto"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                {step === 'setup' ? (
                  <Shield className="w-8 h-8 text-primary" />
                ) : (
                  <Sparkles className="w-8 h-8 text-primary" />
                )}
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {step === 'setup' ? 'PIN 설정' : 'PIN 확인'}
              </CardTitle>
              <CardDescription className="mt-2">
                {step === 'setup'
                  ? 'QuestLife를 시작하기 위해 4-6자리 PIN을 설정해주세요.'
                  : '방금 입력한 PIN을 다시 한 번 입력해주세요.'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {step === 'setup' ? 'PIN 입력' : 'PIN 재입력'}
                </p>
                <div className="flex justify-center">
                  <PinInput
                    length={pin.length || 4}
                    value={step === 'setup' ? pin : confirmPin}
                    onChange={step === 'setup' ? setPin : setConfirmPin}
                    onComplete={handlePinComplete}
                    disabled={isLoading}
                    error={!!error}
                  />
                </div>
              </div>

              {step === 'setup' && pin.length >= 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <Button
                    onClick={() => {
                      if (pin.length >= 4 && pin.length <= 6) {
                        setStep('confirm');
                        setError('');
                      }
                    }}
                    disabled={isLoading}
                    className="w-full"
                  >
                    다음
                  </Button>
                </motion.div>
              )}

              {step === 'confirm' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    이전
                  </Button>
                </motion.div>
              )}
            </div>

            {isLoading && (
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">설정 중...</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                PIN은 앱 보안을 위해 사용됩니다.
                <br />
                잊지 않도록 주의해주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}