const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { User } = require('./User');

const Assessment = sequelize.define('Assessment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },

  // Assessment Metadata
  assessment_version: {
    type: DataTypes.STRING,
    defaultValue: '1.0'
  },

  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // Question Responses
  responses: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },

  // Results
  career_scores: {
    type: DataTypes.JSONB,
    allowNull: true
  },

  personality_profile: {
    type: DataTypes.JSONB,
    allowNull: true
  },

  recommended_careers: {
    type: DataTypes.JSONB,
    allowNull: true
  },

  learning_style: {
    type: DataTypes.JSONB,
    allowNull: true
  },

  // Status
  status: {
    type: DataTypes.ENUM('in_progress', 'completed', 'abandoned'),
    defaultValue: 'in_progress'
  },

  coins_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'assessments',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['completed_at']
    }
  ]
});

const AssessmentQuestion = sequelize.define('AssessmentQuestion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  question_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  category: {
    type: DataTypes.ENUM('interest', 'aptitude', 'personality', 'learning_style'),
    allowNull: false
  },

  question_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  options: {
    type: DataTypes.JSONB,
    allowNull: false
  },

  weights: {
    type: DataTypes.JSONB,
    allowNull: false
  },

  version: {
    type: DataTypes.STRING,
    defaultValue: '1.0'
  },

  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'assessment_questions',
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['version']
    },
    {
      fields: ['active']
    }
  ]
});

// Associations
User.hasMany(Assessment, { foreignKey: 'user_id' });
Assessment.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { Assessment, AssessmentQuestion };
