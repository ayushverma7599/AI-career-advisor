const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { User } = require('./User');

const PuzzleCategory = sequelize.define('PuzzleCategory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  course: {
    type: DataTypes.STRING,
    allowNull: false
  },

  icon: {
    type: DataTypes.STRING,
    allowNull: true
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'puzzle_categories',
  indexes: [
    {
      fields: ['course']
    },
    {
      fields: ['active']
    }
  ]
});

const Puzzle = sequelize.define('Puzzle', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true // e.g., CS001, MED001
  },

  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: PuzzleCategory,
      key: 'id'
    }
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  difficulty: {
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard', 'Expert'),
    allowNull: false
  },

  course: {
    type: DataTypes.STRING,
    allowNull: false
  },

  coin_reward: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  time_limit: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: false
  },

  problem_statement: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  hints: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  test_cases: {
    type: DataTypes.JSONB,
    allowNull: true // for coding problems
  },

  sample_input: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  sample_output: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  solution: {
    type: DataTypes.TEXT,
    allowNull: true // encrypted or hidden
  },

  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  prerequisites: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  attempt_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  success_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  success_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },

  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'puzzles',
  indexes: [
    {
      fields: ['category_id']
    },
    {
      fields: ['difficulty']
    },
    {
      fields: ['course']
    },
    {
      fields: ['active']
    }
  ]
});

const PuzzleAttempt = sequelize.define('PuzzleAttempt', {
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

  puzzle_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Puzzle,
      key: 'id'
    }
  },

  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  time_taken: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },

  submission: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  status: {
    type: DataTypes.ENUM('in_progress', 'submitted', 'correct', 'incorrect', 'partial', 'timeout', 'abandoned'),
    defaultValue: 'in_progress'
  },

  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },

  coins_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  hints_used: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  attempts_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'puzzle_attempts',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['puzzle_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['submitted_at']
    }
  ]
});

// Associations
PuzzleCategory.hasMany(Puzzle, { foreignKey: 'category_id' });
Puzzle.belongsTo(PuzzleCategory, { foreignKey: 'category_id' });

User.hasMany(Puzzle, { foreignKey: 'created_by' });
Puzzle.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(PuzzleAttempt, { foreignKey: 'user_id' });
PuzzleAttempt.belongsTo(User, { foreignKey: 'user_id' });

Puzzle.hasMany(PuzzleAttempt, { foreignKey: 'puzzle_id' });
PuzzleAttempt.belongsTo(Puzzle, { foreignKey: 'puzzle_id' });

module.exports = { PuzzleCategory, Puzzle, PuzzleAttempt };
