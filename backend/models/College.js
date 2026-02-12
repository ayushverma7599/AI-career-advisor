const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { User } = require('./User');

const College = sequelize.define('College', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },

  type: {
    type: DataTypes.ENUM('government', 'private', 'deemed', 'autonomous'),
    allowNull: false
  },

  location: {
    type: DataTypes.STRING,
    allowNull: false
  },

  city: {
    type: DataTypes.STRING,
    allowNull: false
  },

  state: {
    type: DataTypes.STRING,
    allowNull: false
  },

  ranking_national: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  ranking_global: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  nirf_ranking: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  accreditation: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  website: {
    type: DataTypes.STRING,
    allowNull: true
  },

  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  facilities: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  contact_info: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },

  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'colleges',
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['type']
    },
    {
      fields: ['state']
    },
    {
      fields: ['city']
    },
    {
      fields: ['active']
    }
  ]
});

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  college_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: College,
      key: 'id'
    }
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  code: {
    type: DataTypes.STRING,
    allowNull: false
  },

  degree_type: {
    type: DataTypes.ENUM('undergraduate', 'postgraduate', 'diploma', 'certificate'),
    allowNull: false
  },

  duration: {
    type: DataTypes.INTEGER, // in years
    allowNull: false
  },

  fee_per_year: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  total_seats: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  available_seats: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  eligibility_criteria: {
    type: DataTypes.JSONB,
    allowNull: false
  },

  entrance_exams: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  syllabus: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  career_prospects: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  application_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },

  admission_start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },

  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'courses',
  indexes: [
    {
      fields: ['college_id']
    },
    {
      fields: ['degree_type']
    },
    {
      fields: ['application_deadline']
    },
    {
      fields: ['active']
    }
  ]
});

const Application = sequelize.define('Application', {
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

  college_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: College,
      key: 'id'
    }
  },

  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id'
    }
  },

  application_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },

  application_form: {
    type: DataTypes.JSONB,
    allowNull: false
  },

  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'waitlisted'),
    defaultValue: 'draft'
  },

  submission_date: {
    type: DataTypes.DATE,
    allowNull: true
  },

  review_date: {
    type: DataTypes.DATE,
    allowNull: true
  },

  decision_date: {
    type: DataTypes.DATE,
    allowNull: true
  },

  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  interview_scheduled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  interview_date: {
    type: DataTypes.DATE,
    allowNull: true
  },

  interview_details: {
    type: DataTypes.JSONB,
    allowNull: true
  },

  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },

  application_fee: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'applications',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['college_id']
    },
    {
      fields: ['course_id']
    },
    {
      fields: ['application_number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['submission_date']
    }
  ]
});

// Associations
College.hasMany(Course, { foreignKey: 'college_id' });
Course.belongsTo(College, { foreignKey: 'college_id' });

User.hasMany(Application, { foreignKey: 'user_id' });
Application.belongsTo(User, { foreignKey: 'user_id' });

College.hasMany(Application, { foreignKey: 'college_id' });
Application.belongsTo(College, { foreignKey: 'college_id' });

Course.hasMany(Application, { foreignKey: 'course_id' });
Application.belongsTo(Course, { foreignKey: 'course_id' });

module.exports = { College, Course, Application };
