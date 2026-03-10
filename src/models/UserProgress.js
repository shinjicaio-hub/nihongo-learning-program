const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

/** Converte string de 24 hex para ObjectId; mantém ObjectId; evita quebra quando ID vem da URL/API. */
function toObjectId(id) {
  if (id == null) return id;
  if (typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id)) return new ObjectId(id);
  return id;
}

class UserProgress {
  constructor(progressData) {
    this.user_id = progressData.user_id;
    this.lesson_id = progressData.lesson_id;
    this.status = progressData.status || 'not_started'; // not_started, in_progress, completed
    this.score = progressData.score || 0; // Pontuação na lição (0-100)
    this.attempts = progressData.attempts || 0; // Número de tentativas
    this.time_spent = progressData.time_spent || 0; // Tempo gasto em segundos
    this.completed_at = progressData.completed_at || null;
    this.started_at = progressData.started_at || new Date();
    this.last_accessed = new Date();
    this.notes = progressData.notes || null;
    this.favorite = progressData.favorite || false;
  }

  static async create(progressData) {
    try {
      const db = getDB();
      const userId = toObjectId(progressData.user_id);
      const lessonId = toObjectId(progressData.lesson_id);
      const normalized = { ...progressData, user_id: userId, lesson_id: lessonId };

      // Verificar se já existe progresso para este usuário e lição
      const existingProgress = await db.collection('user_progress').findOne({
        user_id: userId,
        lesson_id: lessonId
      });

      if (existingProgress) {
        throw new Error('Progresso já existe para este usuário e lição');
      }

      const progress = new UserProgress(normalized);
      const result = await db.collection('user_progress').insertOne(progress);
      progress._id = result.insertedId;

      return progress;
    } catch (error) {
      throw error;
    }
  }

  static async findByUserAndLesson(userId, lessonId) {
    try {
      const db = getDB();
      return await db.collection('user_progress').findOne({
        user_id: toObjectId(userId),
        lesson_id: toObjectId(lessonId)
      });
    } catch (error) {
      throw error;
    }
  }

  static async findByUser(userId) {
    try {
      const db = getDB();
      return await db.collection('user_progress')
        .find({ user_id: toObjectId(userId) })
        .sort({ last_accessed: -1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async updateProgress(userId, lessonId, updateData) {
    try {
      const db = getDB();
      updateData.last_accessed = new Date();
      
      if (updateData.status === 'completed' && !updateData.completed_at) {
        updateData.completed_at = new Date();
      }
      
      const result = await db.collection('user_progress').updateOne(
        { user_id: toObjectId(userId), lesson_id: toObjectId(lessonId) },
        { $set: updateData }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async updateScore(userId, lessonId, score) {
    try {
      const db = getDB();
      const result = await db.collection('user_progress').updateOne(
        { user_id: toObjectId(userId), lesson_id: toObjectId(lessonId) },
        { 
          $set: { 
            score: Math.max(score, 0), // Garantir que não seja negativo
            last_accessed: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async markAsCompleted(userId, lessonId, score = 100) {
    try {
      const db = getDB();
      const result = await db.collection('user_progress').updateOne(
        { user_id: toObjectId(userId), lesson_id: toObjectId(lessonId) },
        { 
          $set: { 
            status: 'completed',
            score: score,
            completed_at: new Date(),
            last_accessed: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getCompletedLessons(userId) {
    try {
      const db = getDB();
      return await db.collection('user_progress')
        .find({ 
          user_id: toObjectId(userId), 
          status: 'completed' 
        })
        .sort({ completed_at: -1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async getInProgressLessons(userId) {
    try {
      const db = getDB();
      return await db.collection('user_progress')
        .find({ 
          user_id: toObjectId(userId), 
          status: 'in_progress' 
        })
        .sort({ last_accessed: -1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async getFavoriteLessons(userId) {
    try {
      const db = getDB();
      return await db.collection('user_progress')
        .find({ 
          user_id: toObjectId(userId), 
          favorite: true 
        })
        .sort({ last_accessed: -1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async getUserStats(userId) {
    try {
      const db = getDB();
      
      const stats = await db.collection('user_progress').aggregate([
        { $match: { user_id: toObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalLessons: { $sum: 1 },
            completedLessons: { 
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
            },
            inProgressLessons: { 
              $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } 
            },
            averageScore: { $avg: '$score' },
            totalTimeSpent: { $sum: '$time_spent' },
            favoriteLessons: { 
              $sum: { $cond: ['$favorite', 1, 0] } 
            }
          }
        }
      ]).toArray();

      return stats[0] || {
        totalLessons: 0,
        completedLessons: 0,
        inProgressLessons: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        favoriteLessons: 0
      };
    } catch (error) {
      throw error;
    }
  }

  static async getLeaderboard(limit = 10) {
    try {
      const db = getDB();
      
      return await db.collection('user_progress').aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$user_id',
            totalScore: { $sum: '$score' },
            completedLessons: { $sum: 1 },
            averageScore: { $avg: '$score' }
          }
        },
        { $sort: { totalScore: -1 } },
        { $limit: limit }
      ]).toArray();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserProgress;
