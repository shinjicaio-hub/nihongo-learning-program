const { getDB } = require('../config/database');

class Lesson {
  constructor(lessonData) {
    this.title = lessonData.title;
    this.description = lessonData.description;
    this.level = lessonData.level; // beginner, intermediate, advanced
    this.category = lessonData.category; // hiragana, katakana, kanji, grammar, vocabulary, conversation
    this.order = lessonData.order;
    this.content = lessonData.content || [];
    this.exercises = lessonData.exercises || [];
    this.duration = lessonData.duration || 30; // minutos estimados
    this.isActive = lessonData.isActive !== undefined ? lessonData.isActive : true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.prerequisites = lessonData.prerequisites || [];
    this.tags = lessonData.tags || [];
  }

  static async create(lessonData) {
    try {
      const db = getDB();
      
      // Verificar se já existe uma lição com esta ordem neste nível e categoria
      const existingLesson = await db.collection('lessons').findOne({
        level: lessonData.level,
        category: lessonData.category,
        order: lessonData.order
      });

      if (existingLesson) {
        throw new Error('Já existe uma lição com esta ordem neste nível e categoria');
      }

      const lesson = new Lesson(lessonData);
      const result = await db.collection('lessons').insertOne(lesson);
      lesson._id = result.insertedId;

      return lesson;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const db = getDB();
      return await db.collection('lessons').findOne({ _id: id });
    } catch (error) {
      throw error;
    }
  }

  static async findByLevelAndCategory(level, category) {
    try {
      const db = getDB();
      return await db.collection('lessons')
        .find({ level, category, isActive: true })
        .sort({ order: 1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async findByLevel(level) {
    try {
      const db = getDB();
      return await db.collection('lessons')
        .find({ level, isActive: true })
        .sort({ category: 1, order: 1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async getAllActive() {
    try {
      const db = getDB();
      return await db.collection('lessons')
        .find({ isActive: true })
        .sort({ level: 1, category: 1, order: 1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const db = getDB();
      updateData.updatedAt = new Date();
      
      const result = await db.collection('lessons').updateOne(
        { _id: id },
        { $set: updateData }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const db = getDB();
      const result = await db.collection('lessons').updateOne(
        { _id: id },
        { $set: { isActive: false } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getNextLesson(currentLessonId) {
    try {
      const db = getDB();
      const currentLesson = await this.findById(currentLessonId);
      
      if (!currentLesson) {
        throw new Error('Lição não encontrada');
      }

      const nextLesson = await db.collection('lessons').findOne({
        level: currentLesson.level,
        category: currentLesson.category,
        order: { $gt: currentLesson.order },
        isActive: true
      });

      return nextLesson;
    } catch (error) {
      throw error;
    }
  }

  static async getPreviousLesson(currentLessonId) {
    try {
      const db = getDB();
      const currentLesson = await this.findById(currentLessonId);
      
      if (!currentLesson) {
        throw new Error('Lição não encontrada');
      }

      const previousLesson = await db.collection('lessons').findOne({
        level: currentLesson.level,
        category: currentLesson.category,
        order: { $lt: currentLesson.order },
        isActive: true
      });

      return previousLesson;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Lesson;
