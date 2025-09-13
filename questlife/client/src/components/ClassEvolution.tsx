import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Plus, ArrowRight, Crown } from 'lucide-react';
import type { CharacterClass, ClassEvolution } from '@shared/types';
import { useGameStore } from '@/stores/game.store';

interface ClassEvolutionProps {
  eligibleClasses: CharacterClass[];
}

export function ClassEvolutionComponent({ eligibleClasses }: ClassEvolutionProps) {
  const [selectedClass1, setSelectedClass1] = useState<CharacterClass | null>(null);
  const [selectedClass2, setSelectedClass2] = useState<CharacterClass | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isEvolving, setIsEvolving] = useState(false);
  const [, setAvailableEvolutions] = useState<ClassEvolution[]>([]);
  
  const { user, addClass, setActiveClass } = useGameStore();
  
  useEffect(() => {
    if (user && eligibleClasses.length >= 2) {
      fetchAvailableEvolutions();
    }
  }, [user, eligibleClasses, fetchAvailableEvolutions]);
  
  const fetchAvailableEvolutions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:3000/api/classes/evolutions?userId=${user.id}`);
      const evolutions = await res.json();
      setAvailableEvolutions(evolutions);
    } catch (error) {
      console.error('Failed to fetch evolutions:', error);
    }
  };
  
  const canEvolve = selectedClass1 && selectedClass2 && selectedClass1.id !== selectedClass2.id;
  
  const handleEvolution = async () => {
    if (!user || !selectedClass1 || !selectedClass2) return;
    
    setIsEvolving(true);
    try {
      const res = await fetch('http://localhost:3000/api/classes/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          class1Id: selectedClass1.id,
          class2Id: selectedClass2.id,
          evolutionName: customName || undefined,
          evolutionDescription: customDescription || undefined
        })
      });
      
      if (res.ok) {
        const evolvedClass = await res.json();
        addClass(evolvedClass);
        setActiveClass(evolvedClass.id);
        
        // Reset form
        setSelectedClass1(null);
        setSelectedClass2(null);
        setCustomName('');
        setCustomDescription('');
        
        // Refresh available evolutions
        fetchAvailableEvolutions();
      } else {
        const error = await res.json();
        console.error('Evolution failed:', error);
      }
    } catch (error) {
      console.error('Failed to evolve classes:', error);
    } finally {
      setIsEvolving(false);
    }
  };
  
  const selectClass = (cls: CharacterClass) => {
    if (!selectedClass1) {
      setSelectedClass1(cls);
    } else if (!selectedClass2 && cls.id !== selectedClass1.id) {
      setSelectedClass2(cls);
    } else if (selectedClass1.id === cls.id) {
      setSelectedClass1(null);
      if (selectedClass2) {
        setSelectedClass1(selectedClass2);
        setSelectedClass2(null);
      }
    } else if (selectedClass2?.id === cls.id) {
      setSelectedClass2(null);
    }
  };
  
  if (eligibleClasses.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Class Evolution
          </CardTitle>
          <CardDescription>
            You need at least two classes at level 30 to unlock evolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Continue leveling your classes to unlock this powerful feature!
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Class Evolution
        </CardTitle>
        <CardDescription>
          Combine two level 30 classes to create a legendary evolved class
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Class Selection */}
        <div className="space-y-4">
          <Label>Select Two Classes to Evolve</Label>
          <div className="grid grid-cols-2 gap-4">
            {eligibleClasses.map(cls => {
              const isSelected = selectedClass1?.id === cls.id || selectedClass2?.id === cls.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => selectClass(cls)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold">{cls.name}</div>
                    <Badge variant="secondary" className="mt-1">Level 30</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Evolution Preview */}
        {selectedClass1 && selectedClass2 && (
          <div className="space-y-4 p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="font-semibold">{selectedClass1.name}</div>
                <Badge variant="secondary">Lvl 30</Badge>
              </div>
              <Plus className="h-6 w-6 text-primary" />
              <div className="text-center">
                <div className="font-semibold">{selectedClass2.name}</div>
                <Badge variant="secondary">Lvl 30</Badge>
              </div>
              <ArrowRight className="h-6 w-6 text-primary" />
              <div className="text-center">
                <div className="font-bold text-primary">
                  {customName || '???'}
                </div>
                <Badge variant="default">Evolved</Badge>
              </div>
            </div>
            
            {/* Custom Name & Description */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="evolution-name">Custom Evolution Name (Optional)</Label>
                <Input
                  id="evolution-name"
                  placeholder="Leave blank for auto-generated name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="evolution-desc">Custom Description (Optional)</Label>
                <Input
                  id="evolution-desc"
                  placeholder="Describe your evolved class"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Evolution Benefits */}
        <div className="p-4 rounded-lg bg-primary/10 space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Evolution Benefits
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• +5 to all character attributes</li>
            <li>• Starts at level 1 with enhanced XP requirements</li>
            <li>• Combines the powers of both base classes</li>
            <li>• Unlocks unique skill trees and abilities</li>
            <li>• Permanent stat bonuses carry over</li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleEvolution}
          disabled={!canEvolve || isEvolving}
          className="w-full"
          size="lg"
        >
          {isEvolving ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              Evolving Classes...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              Evolve Classes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}