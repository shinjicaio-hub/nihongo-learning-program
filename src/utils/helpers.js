// Funções auxiliares para a aplicação

// Gerar ID único
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Formatar data para exibição
const formatDate = (date, format = 'pt-BR') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (format === 'pt-BR') {
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  if (format === 'pt-BR-full') {
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
  
  return d.toISOString();
};

// Formatar tempo em segundos para formato legível
const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  
  result += `${secs}s`;
  
  return result.trim();
};

// Calcular porcentagem
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar senha forte
const isStrongPassword = (password) => {
  // Mínimo 8 caracteres, pelo menos uma letra maiúscula, uma minúscula e um número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Sanitizar string para busca
const sanitizeSearchTerm = (term) => {
  if (!term) return '';
  
  return term
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '') // Manter caracteres japoneses
    .replace(/\s+/g, ' '); // Múltiplos espaços para um só
};

// Gerar slug para URLs
const generateSlug = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiais
    .replace(/\s+/g, '-') // Espaços para hífens
    .replace(/-+/g, '-') // Múltiplos hífens para um só
    .replace(/^-|-$/g, ''); // Remover hífens no início e fim
};

// Calcular nível baseado na pontuação
const calculateLevel = (score, totalLessons) => {
  if (totalLessons === 0) return 'beginner';
  
  const completionRate = score / totalLessons;
  
  if (completionRate >= 0.8) return 'advanced';
  if (completionRate >= 0.5) return 'intermediate';
  return 'beginner';
};

// Gerar recomendações de estudo
const generateStudyRecommendations = (userLevel, completedLessons, inProgressLessons) => {
  const recommendations = [];
  
  // Recomendações baseadas no nível
  if (userLevel === 'beginner') {
    recommendations.push({
      type: 'level_up',
      message: 'Continue com as lições básicas para avançar para o nível intermediário',
      priority: 'high'
    });
  }
  
  // Recomendações baseadas no progresso
  if (completedLessons.length === 0) {
    recommendations.push({
      type: 'start_learning',
      message: 'Comece sua jornada de aprendizado com as primeiras lições',
      priority: 'high'
    });
  }
  
  if (inProgressLessons.length > 3) {
    recommendations.push({
      type: 'focus',
      message: 'Concentre-se em completar as lições em andamento antes de iniciar novas',
      priority: 'medium'
    });
  }
  
  // Recomendações de revisão
  if (completedLessons.length > 5) {
    recommendations.push({
      type: 'review',
      message: 'Faça uma revisão das lições concluídas para reforçar o aprendizado',
      priority: 'medium'
    });
  }
  
  return recommendations;
};

// Calcular pontuação de exercício
const calculateExerciseScore = (correctAnswers, totalQuestions, timeSpent, maxTime) => {
  const accuracyScore = (correctAnswers / totalQuestions) * 70; // 70% da pontuação baseada na precisão
  
  let timeScore = 0;
  if (timeSpent <= maxTime) {
    timeScore = 30; // 30% da pontuação baseada no tempo
  } else {
    timeScore = Math.max(0, 30 - ((timeSpent - maxTime) / maxTime) * 30);
  }
  
  return Math.round(accuracyScore + timeScore);
};

// Gerar relatório de progresso
const generateProgressReport = (userStats, period = 'week') => {
  const report = {
    period,
    summary: {
      totalLessons: userStats.totalLessons,
      completedLessons: userStats.completedLessons,
      completionRate: calculatePercentage(userStats.completedLessons, userStats.totalLessons),
      averageScore: Math.round(userStats.averageScore || 0),
      totalStudyTime: formatTime(userStats.totalTimeSpent)
    },
    achievements: [],
    recommendations: []
  };
  
  // Conquistas baseadas no progresso
  if (userStats.completedLessons >= 10) {
    report.achievements.push({
      type: 'milestone',
      title: 'Primeiros Passos',
      description: 'Completou 10 lições!',
      icon: '🎯'
    });
  }
  
  if (userStats.averageScore >= 90) {
    report.achievements.push({
      type: 'excellence',
      title: 'Excelência',
      description: 'Mantém uma pontuação média acima de 90%!',
      icon: '🏆'
    });
  }
  
  if (userStats.totalTimeSpent >= 3600) { // 1 hora
    report.achievements.push({
      type: 'dedication',
      title: 'Dedicado',
      description: 'Dedicou mais de 1 hora aos estudos!',
      icon: '⏰'
    });
  }
  
  // Recomendações
  report.recommendations = generateStudyRecommendations(
    userStats.level || 'beginner',
    userStats.completedLessons || 0,
    userStats.inProgressLessons || 0
  );
  
  return report;
};

// Validar dados de entrada
const validateInput = (data, schema) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Campo ${field} é obrigatório`);
      continue;
    }
    
    if (value !== undefined && value !== null) {
      if (rules.type && typeof value !== rules.type) {
        errors.push(`Campo ${field} deve ser do tipo ${rules.type}`);
      }
      
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Campo ${field} deve ter pelo menos ${rules.minLength} caracteres`);
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Campo ${field} deve ter no máximo ${rules.maxLength} caracteres`);
      }
      
      if (rules.min && value < rules.min) {
        errors.push(`Campo ${field} deve ser maior ou igual a ${rules.min}`);
      }
      
      if (rules.max && value > rules.max) {
        errors.push(`Campo ${field} deve ser menor ou igual a ${rules.max}`);
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`Campo ${field} não está no formato correto`);
      }
    }
  }
  
  return errors;
};

module.exports = {
  generateUniqueId,
  formatDate,
  formatTime,
  calculatePercentage,
  isValidEmail,
  isStrongPassword,
  sanitizeSearchTerm,
  generateSlug,
  calculateLevel,
  generateStudyRecommendations,
  calculateExerciseScore,
  generateProgressReport,
  validateInput
};
