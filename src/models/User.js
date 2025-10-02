const { getDB } = require('../config/database');
const bcrypt = require('bcrypt');
const config = require('../config/config');

class User {
  constructor(userData) {
    this.username = userData.username;
    this.email = userData.email;
    this.password = userData.password;
    this.firstName = userData.firstName || '';
    this.lastName = userData.lastName || '';
    this.level = userData.level || 'beginner';
    this.createdAt = new Date();
    this.lastLogin = null;
    this.isActive = true;
    this.preferences = {
      studyTime: 30, // minutos por dia
      notifications: true,
      language: 'pt-BR'
    };
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
      return await db.collection('users').findOne({ email });
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const db = getDB();
      return await db.collection('users').findOne({ _id: id });
    } catch (error) {
      throw error;
    }
  }

  static async updateProfile(userId, updateData) {
    try {
      const db = getDB();
      const result = await db.collection('users').updateOne(
        { _id: userId },
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
        { _id: userId },
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
        { _id: userId },
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
