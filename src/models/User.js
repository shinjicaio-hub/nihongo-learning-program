const { getDB } = require('../config/database');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const { toObjectId } = require('../utils/objectId');

class User {
  constructor(userData) {
    const data = userData || {};
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.level = data.level || 'beginner';
    this.role = data.role || 'user'; // user | admin
    this.createdAt = data.createdAt || new Date();
    this.lastLogin = data.lastLogin ?? null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.preferences = data.preferences || {
      studyTime: 30,
      notifications: true,
      language: 'pt-BR'
    };
    if (data._id) this._id = data._id;
  }

  /** Converte documento do MongoDB em instância de User (com validatePassword e toJSON). */
  static docToUser(doc) {
    if (!doc) return null;
    const user = new User(doc);
    user._id = doc._id;
    return user;
  }

  static async create(userData) {
    try {
      const db = getDB();
      
      // Verificar se usuário já existe
      const existingUser = await db.collection('users').findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        throw new Error('Usuário já existe com este email ou nome de usuário');
      }

      // Criptografar senha
      const saltRounds = config.password.saltRounds;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const user = new User({
        ...userData,
        password: hashedPassword
      });

      const result = await db.collection('users').insertOne(user);
      user._id = result.insertedId;

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const db = getDB();
      const doc = await db.collection('users').findOne({ email });
      return User.docToUser(doc);
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const db = getDB();
      const doc = await db.collection('users').findOne({ _id: toObjectId(id) });
      return User.docToUser(doc);
    } catch (error) {
      throw error;
    }
  }

  static async updateProfile(userId, updateData) {
    try {
      const db = getDB();
      const result = await db.collection('users').updateOne(
        { _id: toObjectId(userId) },
        { $set: updateData }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async updateLevel(userId, newLevel) {
    try {
      const db = getDB();
      const result = await db.collection('users').updateOne(
        { _id: toObjectId(userId) },
        { $set: { level: newLevel } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async updateLastLogin(userId) {
    try {
      const db = getDB();
      await db.collection('users').updateOne(
        { _id: toObjectId(userId) },
        { $set: { lastLogin: new Date() } }
      );
    } catch (error) {
      throw error;
    }
  }

  async validatePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  toJSON() {
    const user = { ...this };
    delete user.password;
    return user;
  }
}

module.exports = User;
