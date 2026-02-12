const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { User } = require('./User');

const ForumCategory = sequelize.define('ForumCategory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  icon: {
    type: DataTypes.STRING,
    allowNull: true
  },

  color: {
    type: DataTypes.STRING,
    allowNull: true
  },

  allowed_roles: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: ['student', 'teacher', 'alumni', 'college_administrator']
  },

  posts_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  replies_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  tableName: 'forum_categories',
  indexes: [
    {
      fields: ['active']
    },
    {
      fields: ['sort_order']
    }
  ]
});

const ForumPost = sequelize.define('ForumPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ForumCategory,
      key: 'id'
    }
  },

  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [5, 200]
    }
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 10000]
    }
  },

  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  replies_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  votes_up: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  votes_down: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  vote_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  is_locked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  is_solved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  best_answer_id: {
    type: DataTypes.UUID,
    allowNull: true
  },

  last_activity_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  status: {
    type: DataTypes.ENUM('active', 'hidden', 'deleted', 'flagged'),
    defaultValue: 'active'
  }
}, {
  tableName: 'forum_posts',
  indexes: [
    {
      fields: ['category_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['last_activity_at']
    },
    {
      fields: ['is_pinned']
    },
    {
      fields: ['vote_score']
    }
  ]
});

const ForumReply = sequelize.define('ForumReply', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  post_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: ForumPost,
      key: 'id'
    }
  },

  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },

  parent_reply_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'forum_replies',
      key: 'id'
    }
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 5000]
    }
  },

  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  votes_up: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  votes_down: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  vote_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  is_best_answer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  status: {
    type: DataTypes.ENUM('active', 'hidden', 'deleted', 'flagged'),
    defaultValue: 'active'
  }
}, {
  tableName: 'forum_replies',
  indexes: [
    {
      fields: ['post_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['parent_reply_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['vote_score']
    },
    {
      fields: ['is_best_answer']
    }
  ]
});

const ForumVote = sequelize.define('ForumVote', {
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

  post_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: ForumPost,
      key: 'id'
    }
  },

  reply_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: ForumReply,
      key: 'id'
    }
  },

  vote_type: {
    type: DataTypes.ENUM('up', 'down'),
    allowNull: false
  }
}, {
  tableName: 'forum_votes',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'post_id']
    },
    {
      unique: true,
      fields: ['user_id', 'reply_id']
    }
  ]
});

// Associations
ForumCategory.hasMany(ForumPost, { foreignKey: 'category_id' });
ForumPost.belongsTo(ForumCategory, { foreignKey: 'category_id' });

User.hasMany(ForumPost, { foreignKey: 'user_id' });
ForumPost.belongsTo(User, { foreignKey: 'user_id' });

ForumPost.hasMany(ForumReply, { foreignKey: 'post_id' });
ForumReply.belongsTo(ForumPost, { foreignKey: 'post_id' });

User.hasMany(ForumReply, { foreignKey: 'user_id' });
ForumReply.belongsTo(User, { foreignKey: 'user_id' });

ForumReply.hasMany(ForumReply, { as: 'childReplies', foreignKey: 'parent_reply_id' });
ForumReply.belongsTo(ForumReply, { as: 'parentReply', foreignKey: 'parent_reply_id' });

User.hasMany(ForumVote, { foreignKey: 'user_id' });
ForumVote.belongsTo(User, { foreignKey: 'user_id' });

ForumPost.hasMany(ForumVote, { foreignKey: 'post_id' });
ForumVote.belongsTo(ForumPost, { foreignKey: 'post_id' });

ForumReply.hasMany(ForumVote, { foreignKey: 'reply_id' });
ForumVote.belongsTo(ForumReply, { foreignKey: 'reply_id' });

module.exports = { ForumCategory, ForumPost, ForumReply, ForumVote };
