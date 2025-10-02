const express = require('express');
const { getDB } = require('../config/database');
const router = express.Router();

// Middleware para verificar se é admin (por enquanto, vamos permitir acesso direto)
const isAdmin = (req, res, next) => {
  // Por enquanto, permitir acesso direto para desenvolvimento
  // Em produção, implementar autenticação adequada
  next();
};

// Rota para listar todas as collections
router.get('/collections', isAdmin, async (req, res) => {
  try {
    const db = getDB();
    const collections = await db.listCollections().toArray();
    
    const collectionsInfo = await Promise.all(
      collections.map(async (collection) => {
        const count = await db.collection(collection.name).countDocuments();
        return {
          name: collection.name,
          count: count,
          type: collection.type || 'collection'
        };
      })
    );

    res.json({
      success: true,
      collections: collectionsInfo
    });
  } catch (error) {
    console.error('Erro ao listar collections:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar collections',
      error: error.message
    });
  }
});

// Rota para buscar dados de uma collection específica
router.get('/collections/:collectionName', isAdmin, async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const db = getDB();
    const collection = db.collection(collectionName);
    
    // Construir query de busca se fornecida
    let query = {};
    if (search) {
      // Busca em campos de texto (adaptar conforme necessário)
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { japanese: { $regex: search, $options: 'i' } },
          { portuguese: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Buscar documentos
    const documents = await collection
      .find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ _id: -1 })
      .toArray();
    
    // Contar total de documentos
    const total = await collection.countDocuments(query);
    
    // Remover senhas dos usuários por segurança
    const safeDocuments = documents.map(doc => {
      if (doc.password) {
        delete doc.password;
      }
      return doc;
    });
    
    res.json({
      success: true,
      data: safeDocuments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados da collection:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados da collection',
      error: error.message
    });
  }
});

// Rota para obter estatísticas gerais
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    const stats = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('lessons').countDocuments(),
      db.collection('vocabulary').countDocuments(),
      db.collection('user_progress').countDocuments()
    ]);
    
    // Estatísticas de usuários por nível
    const usersByLevel = await db.collection('users').aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]).toArray();
    
    // Estatísticas de lições por categoria
    const lessonsByCategory = await db.collection('lessons').aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]).toArray();
    
    // Estatísticas de progresso
    const progressStats = await db.collection('user_progress').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    res.json({
      success: true,
      stats: {
        totalUsers: stats[0],
        totalLessons: stats[1],
        totalVocabulary: stats[2],
        totalProgress: stats[3],
        usersByLevel,
        lessonsByCategory,
        progressStats
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message
    });
  }
});

// Rota para obter detalhes de um documento específico
router.get('/collections/:collectionName/:documentId', isAdmin, async (req, res) => {
  try {
    const { collectionName, documentId } = req.params;
    const db = getDB();
    
    // Converter string ID para ObjectId se necessário
    let query = { _id: documentId };
    try {
      const { ObjectId } = require('mongodb');
      query = { _id: new ObjectId(documentId) };
    } catch (e) {
      // Se não conseguir converter para ObjectId, usar como string
    }
    
    const document = await db.collection(collectionName).findOne(query);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      });
    }
    
    // Remover senha se existir
    if (document.password) {
      delete document.password;
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar documento',
      error: error.message
    });
  }
});

module.exports = router;