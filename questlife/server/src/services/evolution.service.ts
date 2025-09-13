import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { CharacterClass, ClassEvolution } from '@shared/types';

interface EvolveClassesInput {
  userId: string;
  class1Id: string;
  class2Id: string;
  evolutionName?: string;
  evolutionDescription?: string;
}

export async function checkEvolutionEligibility(class1Id: string, class2Id: string): Promise<boolean> {
  const db = getDatabase();
  
  // Get both classes
  const class1 = db.prepare('SELECT * FROM character_classes WHERE id = ?').get(class1Id) as any;
  const class2 = db.prepare('SELECT * FROM character_classes WHERE id = ?').get(class2Id) as any;
  
  if (!class1 || !class2) {
    return false;
  }
  
  // Both classes must be level 30
  return class1.level === 30 && class2.level === 30;
}

export async function evolveClasses(input: EvolveClassesInput): Promise<CharacterClass> {
  const db = getDatabase();
  
  // Verify both classes are level 30
  const eligible = await checkEvolutionEligibility(input.class1Id, input.class2Id);
  if (!eligible) {
    throw new Error('Both classes must be level 30 to evolve');
  }
  
  // Get class details
  const class1 = db.prepare('SELECT * FROM character_classes WHERE id = ?').get(input.class1Id) as any;
  const class2 = db.prepare('SELECT * FROM character_classes WHERE id = ?').get(input.class2Id) as any;
  
  // Check if evolution already exists
  const existingEvolution = db.prepare(`
    SELECT * FROM class_evolutions 
    WHERE (base_class1_id = ? AND base_class2_id = ?) 
       OR (base_class1_id = ? AND base_class2_id = ?)
  `).get(input.class1Id, input.class2Id, input.class2Id, input.class1Id) as any;
  
  if (existingEvolution && existingEvolution.status === 'completed') {
    throw new Error('These classes have already been evolved');
  }
  
  // Generate evolution name if not provided
  const evolutionName = input.evolutionName || generateEvolutionName(class1.name, class2.name);
  const evolutionDescription = input.evolutionDescription || generateEvolutionDescription(class1, class2);
  
  // Create the evolved class
  const evolvedClassId = uuidv4();
  const now = new Date();
  
  const evolvedClass: CharacterClass = {
    id: evolvedClassId,
    userId: input.userId,
    name: evolutionName,
    description: evolutionDescription,
    level: 1, // Evolved classes start at level 1
    currentXP: 0,
    xpToNextLevel: 150, // Slightly higher requirement for evolved classes
    status: 'active',
    targetLevel: 30,
    ultimateGoal: `Master the combined powers of ${class1.name} and ${class2.name}`,
    createdAt: now,
    plannedEvolutions: [],
    baseClassIds: [input.class1Id, input.class2Id]
  };
  
  // Insert evolved class
  db.prepare(`
    INSERT INTO character_classes (
      id, user_id, name, description, level, current_xp, xp_to_next_level,
      status, target_level, ultimate_goal, created_at, base_class_ids
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    evolvedClass.id,
    evolvedClass.userId,
    evolvedClass.name,
    evolvedClass.description,
    evolvedClass.level,
    evolvedClass.currentXP,
    evolvedClass.xpToNextLevel,
    evolvedClass.status,
    evolvedClass.targetLevel,
    evolvedClass.ultimateGoal,
    now.toISOString(),
    JSON.stringify(evolvedClass.baseClassIds)
  );
  
  // Update base classes to 'evolved' status
  db.prepare('UPDATE character_classes SET status = ? WHERE id IN (?, ?)')
    .run('evolved', input.class1Id, input.class2Id);
  
  // Record the evolution
  const evolutionId = uuidv4();
  if (existingEvolution) {
    // Update existing planned evolution
    db.prepare(`
      UPDATE class_evolutions 
      SET evolved_class_id = ?, status = ?, evolved_at = ?
      WHERE id = ?
    `).run(evolvedClassId, 'completed', now.toISOString(), existingEvolution.id);
  } else {
    // Create new evolution record
    db.prepare(`
      INSERT INTO class_evolutions (
        id, user_id, base_class1_id, base_class2_id, evolved_class_id,
        evolution_name, evolution_description, status, unlocked_at, evolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      evolutionId,
      input.userId,
      input.class1Id,
      input.class2Id,
      evolvedClassId,
      evolutionName,
      evolutionDescription,
      'completed',
      now.toISOString(),
      now.toISOString()
    );
  }
  
  // Grant evolution bonuses to character status
  grantEvolutionBonuses(input.userId, class1.name, class2.name);
  
  // Create skill tree for evolved class
  db.prepare(`
    INSERT INTO skill_trees (id, class_id, skills, available_points, total_points_earned)
    VALUES (?, ?, '[]', 1, 1)
  `).run(uuidv4(), evolvedClassId);
  
  return evolvedClass;
}

function generateEvolutionName(class1Name: string, class2Name: string): string {
  // Simple combination logic - can be enhanced
  const prefixes = ['Master', 'Grand', 'Ultimate', 'Legendary', 'Mythic'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  // Try to combine names creatively
  const words1 = class1Name.split(' ');
  const words2 = class2Name.split(' ');
  
  if (words1.length > 1 && words2.length > 1) {
    return `${prefix} ${words1[0]} ${words2[words2.length - 1]}`;
  }
  
  return `${prefix} ${class1Name}-${class2Name}`;
}

function generateEvolutionDescription(class1: any, class2: any): string {
  return `A legendary fusion of ${class1.name} and ${class2.name}, combining their unique strengths into a single powerful class. This evolved form represents mastery over both disciplines and unlocks new potential beyond what either class could achieve alone.`;
}

function grantEvolutionBonuses(userId: string, class1Name: string, class2Name: string) {
  const db = getDatabase();
  
  // Get current character status
  const status = db.prepare('SELECT * FROM character_status WHERE user_id = ?').get(userId) as any;
  
  if (status) {
    // Grant bonus attributes for evolution
    const bonusStrength = 5;
    const bonusWisdom = 5;
    const bonusCreativity = 5;
    const bonusDiscipline = 5;
    const bonusCharisma = 5;
    
    const newStrength = status.strength + bonusStrength;
    const newWisdom = status.wisdom + bonusWisdom;
    const newCreativity = status.creativity + bonusCreativity;
    const newDiscipline = status.discipline + bonusDiscipline;
    const newCharisma = status.charisma + bonusCharisma;
    const newPowerLevel = newStrength + newWisdom + newCreativity + newDiscipline + newCharisma;
    
    // Update permanent bonuses
    const permanentBonuses = JSON.parse(status.permanent_bonuses || '[]');
    permanentBonuses.push({
      attributeType: 'all',
      value: 5,
      source: `Evolution: ${class1Name} + ${class2Name}`
    });
    
    db.prepare(`
      UPDATE character_status 
      SET strength = ?, wisdom = ?, creativity = ?, discipline = ?, charisma = ?,
          total_power_level = ?, permanent_bonuses = ?, updated_at = ?
      WHERE user_id = ?
    `).run(
      newStrength,
      newWisdom,
      newCreativity,
      newDiscipline,
      newCharisma,
      newPowerLevel,
      JSON.stringify(permanentBonuses),
      new Date().toISOString(),
      userId
    );
  }
}

export async function getAvailableEvolutions(userId: string): Promise<ClassEvolution[]> {
  const db = getDatabase();
  
  // Get all level 30 classes for the user
  const level30Classes = db.prepare(`
    SELECT * FROM character_classes 
    WHERE user_id = ? AND level = 30 AND status = 'active'
  `).all(userId) as any[];
  
  const evolutions: ClassEvolution[] = [];
  
  // Check all possible combinations
  for (let i = 0; i < level30Classes.length; i++) {
    for (let j = i + 1; j < level30Classes.length; j++) {
      const class1 = level30Classes[i];
      const class2 = level30Classes[j];
      
      // Check if this evolution already exists
      const existing = db.prepare(`
        SELECT * FROM class_evolutions 
        WHERE ((base_class1_id = ? AND base_class2_id = ?) 
           OR (base_class1_id = ? AND base_class2_id = ?))
           AND status = 'completed'
      `).get(class1.id, class2.id, class2.id, class1.id) as any;
      
      if (!existing) {
        evolutions.push({
          id: uuidv4(),
          userId,
          baseClass1Id: class1.id,
          baseClass2Id: class2.id,
          evolutionName: generateEvolutionName(class1.name, class2.name),
          evolutionDescription: generateEvolutionDescription(class1, class2),
          status: 'ready',
          unlockedAt: new Date()
        });
      }
    }
  }
  
  return evolutions;
}