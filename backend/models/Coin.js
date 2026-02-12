const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { User } = require('./User');

const CoinTransaction = sequelize.define('CoinTransaction', {
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

  transaction_type: {
    type: DataTypes.ENUM('earned', 'spent', 'bonus', 'penalty', 'refund'),
    allowNull: false
  },

  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  reason: {
    type: DataTypes.STRING,
    allowNull: false
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  source: {
    type: DataTypes.ENUM('registration', 'assessment', 'puzzle', 'streak', 'referral', 'redemption', 'admin'),
    allowNull: false
  },

  reference_id: {
    type: DataTypes.STRING,
    allowNull: true // ID of related entity (puzzle_id, assessment_id, etc.)
  },

  balance_before: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  balance_after: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'completed'
  },

  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'coin_transactions',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['transaction_type']
    },
    {
      fields: ['source']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

const CoinRedemption = sequelize.define('CoinRedemption', {
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

  redemption_type: {
    type: DataTypes.ENUM('mentorship', 'ebook_discount', 'library_extension', 'course_access', 'premium_features'),
    allowNull: false
  },

  item_name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  coins_spent: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  redemption_code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },

  redemption_details: {
    type: DataTypes.JSONB,
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM('pending', 'active', 'used', 'expired', 'cancelled'),
    defaultValue: 'active'
  },

  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  used_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'coin_redemptions',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['redemption_code']
    },
    {
      fields: ['redemption_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['expires_at']
    }
  ]
});

// Associations
User.hasMany(CoinTransaction, { foreignKey: 'user_id' });
CoinTransaction.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(CoinRedemption, { foreignKey: 'user_id' });
CoinRedemption.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { CoinTransaction, CoinRedemption };
