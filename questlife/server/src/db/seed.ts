import { v4 as uuidv4 } from 'uuid';
import { getDatabase, initDatabase } from './index.js';

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Initialize database first
    await initDatabase();
    const db = getDatabase();
    
    // Create a test user
    const userId = uuidv4();
    const now = new Date().toISOString();
    
    console.log('Creating test user...');
    db.prepare(`
      INSERT INTO users (id, created_at, updated_at, settings)
      VALUES (?, ?, ?, ?)
    `).run(
      userId,
      now,
      now,
      JSON.stringify({ theme: 'dark', notifications: true, soundEffects: true })
    );
    
    // Create character status
    console.log('Creating character status...');
    db.prepare(`
      INSERT INTO character_status (
        id, user_id, strength, wisdom, creativity, discipline, charisma,
        total_power_level, mastered_class_count, total_quests_completed, permanent_bonuses
      ) VALUES (?, ?, 25, 30, 28, 22, 20, 125, 0, 45, '[]')
    `).run(uuidv4(), userId);
    
    // Create two level 30 classes for testing evolution
    console.log('Creating level 30 classes for evolution testing...');
    
    // Class 1: AI Scholar (Level 30)
    const class1Id = uuidv4();
    db.prepare(`
      INSERT INTO character_classes (
        id, user_id, name, description, level, current_xp, xp_to_next_level,
        status, target_level, ultimate_goal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      class1Id,
      userId,
      'AI Scholar',
      'A master of artificial intelligence and machine learning, dedicated to understanding and creating intelligent systems.',
      30,
      0,
      0,
      'active',
      30,
      'Create groundbreaking AI applications',
      now
    );
    
    // Class 2: Code Warrior (Level 30)
    const class2Id = uuidv4();
    db.prepare(`
      INSERT INTO character_classes (
        id, user_id, name, description, level, current_xp, xp_to_next_level,
        status, target_level, ultimate_goal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      class2Id,
      userId,
      'Code Warrior',
      'A battle-hardened programmer who conquers complex challenges with elegant code and unwavering determination.',
      30,
      0,
      0,
      'active',
      30,
      'Master all programming paradigms',
      now
    );
    
    // Class 3: Still leveling (Level 15)
    const class3Id = uuidv4();
    db.prepare(`
      INSERT INTO character_classes (
        id, user_id, name, description, level, current_xp, xp_to_next_level,
        status, target_level, ultimate_goal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      class3Id,
      userId,
      'Digital Artist',
      'A creative soul mastering the art of digital creation and visual storytelling.',
      15,
      650,
      1150,
      'active',
      25,
      'Create stunning digital masterpieces',
      now
    );
    
    // Create skill trees for each class
    console.log('Creating skill trees...');
    [class1Id, class2Id, class3Id].forEach(classId => {
      db.prepare(`
        INSERT INTO skill_trees (id, class_id, skills, available_points, total_points_earned)
        VALUES (?, ?, '[]', 3, 15)
      `).run(uuidv4(), classId);
    });
    
    // Create some quests for each class
    console.log('Creating sample quests...');
    
    // AI Scholar quests
    const questTypes = ['daily', 'daily', 'daily', 'weekly', 'special'];
    const questTitles = [
      'Study Neural Networks',
      'Implement ML Algorithm',
      'Read Research Papers',
      'Build AI Project',
      'Master Deep Learning'
    ];
    
    questTypes.forEach((type, index) => {
      db.prepare(`
        INSERT INTO quests (
          id, class_id, type, title, description, xp_reward,
          status, difficulty, level_trigger, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        class1Id,
        type,
        questTitles[index],
        `Complete this ${type} quest to progress in your AI journey`,
        type === 'daily' ? 100 : type === 'weekly' ? 800 : 3000,
        index < 2 ? 'completed' : 'pending',
        type === 'special' ? 5 : Math.min(index + 1, 4),
        type === 'special' ? 30 : null,
        now
      );
    });
    
    // Create progress streak
    console.log('Creating progress streak...');
    db.prepare(`
      INSERT INTO progress_streaks (
        id, user_id, current_streak, longest_streak, multiplier, last_completion_date, streak_milestones
      ) VALUES (?, ?, 5, 12, 5.0, ?, '[]')
    `).run(uuidv4(), userId, new Date().toISOString().split('T')[0]);
    
    // Create some achievements
    console.log('Creating achievements...');
    const achievements = [
      { type: 'first_quest', name: 'Quest Beginner', description: 'Completed your first quest' },
      { type: 'level_10', name: 'Rising Star', description: 'Reached level 10 with a class' },
      { type: 'level_30', name: 'Master', description: 'Reached level 30 with a class' },
      { type: 'week_streak', name: 'Dedicated', description: '7-day completion streak' }
    ];
    
    achievements.forEach(achievement => {
      db.prepare(`
        INSERT INTO achievements (
          id, user_id, type, name, description, icon, rarity, unlocked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        userId,
        achievement.type,
        achievement.name,
        achievement.description,
        '🏆',
        achievement.type === 'level_30' ? 'legendary' : 'common',
        now
      );
    });
    
    console.log('✅ Database seeded successfully!');
    console.log(`\n📝 Test User ID: ${userId}`);
    console.log('You can use this ID to test the application.');
    console.log('\n🎮 Two level 30 classes are ready for evolution testing:');
    console.log('  - AI Scholar (Level 30)');
    console.log('  - Code Warrior (Level 30)');
    console.log('  - Digital Artist (Level 15 - still leveling)');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();