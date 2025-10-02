const { getDB } = require('../config/database');

class Vocabulary {
  constructor(vocabData) {
    this.japanese = vocabData.japanese; // Palavra em japonês
    this.romaji = vocabData.romaji; // Pronúncia em romaji
    this.portuguese = vocabData.portuguese; // Tradução em português
    this.english = vocabData.english; // Tradução em inglês (opcional)
    this.lesson_id = vocabData.lesson_id; // ID da lição relacionada
    this.category = vocabData.category; // Tipo de vocabulário
    this.level = vocabData.level; // Nível de dificuldade
    this.audio_url = vocabData.audio_url || null; // URL do áudio de pronúncia
    this.example_sentence = vocabData.example_sentence || null; // Frase de exemplo
    this.example_translation = vocabData.example_translation || null; // Tradução da frase
    this.notes = vocabData.notes || null; // Notas adicionais
    this.tags = vocabData.tags || []; // Tags para categorização
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isActive = vocabData.isActive !== undefined ? vocabData.isActive : true;
  }

  static async create(vocabData) {
    try {
      const db = getDB();
      
      // Verificar se já existe este vocabulário
      const existingVocab = await db.collection('vocabulary').findOne({
        japanese: vocabData.japanese,
        lesson_id: vocabData.lesson_id
      });

      if (existingVocab) {
        throw new Error('Este vocabulário já existe nesta lição');
      }

      const vocabulary = new Vocabulary(vocabData);
      const result = await db.collection('vocabulary').insertOne(vocabulary);
      vocabulary._id = result.insertedId;

      return vocabulary;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const db = getDB();
      return await db.collection('vocabulary').findOne({ _id: id });
    } catch (error) {
      throw error;
    }
  }

  static async findByLesson(lessonId) {
    try {
      const db = getDB();
      return await db.collection('vocabulary')
        .find({ lesson_id: lessonId, isActive: true })
        .sort({ japanese: 1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async findByCategory(category) {
    try {
      const db = getDB();
      return await db.collection('vocabulary')
        .find({ category, isActive: true })
        .sort({ japanese: 1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async findByLevel(level) {
    try {
      const db = getDB();
      return await db.collection('vocabulary')
        .find({ level, isActive: true })
        .sort({ japanese: 1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async search(searchTerm) {
    try {
      const db = getDB();
      const regex = new RegExp(searchTerm, 'i');
      
      return await db.collection('vocabulary')
        .find({
          $or: [
            { japanese: regex },
            { romaji: regex },
            { portuguese: regex },
            { english: regex }
          ],
          isActive: true
        })
        .sort({ japanese: 1 })
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const db = getDB();
      updateData.updatedAt = new Date();
      
      const result = await db.collection('vocabulary').updateOne(
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
      const result = await db.collection('vocabulary').updateOne(
        { _id: id },
        { $set: { isActive: false } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getRandomVocabulary(limit = 10, level = null, category = null) {
    try {
      const db = getDB();
      let query = { isActive: true };
      
      if (level) query.level = level;
      if (category) query.category = category;
      
      return await db.collection('vocabulary')
        .aggregate([
          { $match: query },
          { $sample: { size: limit } }
        ])
        .toArray();
    } catch (error) {
      throw error;
    }
  }

  static async getVocabularyStats() {
    try {
      const db = getDB();
      
      const stats = await db.collection('vocabulary').aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byLevel: {
              $push: {
                level: '$level',
                count: 1
              }
            },
            byCategory: {
              $push: {
                category: '$category',
                count: 1
              }
            }
          }
        }
      ]).toArray();

      return stats[0] || { total: 0, byLevel: [], byCategory: [] };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Vocabulary;
