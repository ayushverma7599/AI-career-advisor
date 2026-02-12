const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  // Basic Authentication
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },

  password: {
    type: DataTypes.STRING,
    allowNull: true // null for OAuth users
  },

  // OAuth Fields
  google_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },

  auth_method: {
    type: DataTypes.ENUM('traditional', 'google'),
    defaultValue: 'traditional'
  },

  // Registration Step 1: Basic Information
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  phone: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      len: [10, 10]
    }
  },

  // Registration Step 2 & 3: Verification
  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  aadhaar_number: {
    type: DataTypes.STRING(12),
    allowNull: true,
    validate: {
      len: [12, 12]
    }
  },

  aadhaar_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  // Registration Step 4: Personal Details
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true
  },

  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  city: {
    type: DataTypes.STRING,
    allowNull: true
  },

  state: {
    type: DataTypes.STRING,
    allowNull: true
  },

  pincode: {
    type: DataTypes.STRING(6),
    allowNull: true
  },

  // Registration Step 5: Academic Records
  class_10_board: {
    type: DataTypes.STRING,
    allowNull: true
  },

  class_10_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 2000,
      max: new Date().getFullYear()
    }
  },

  class_10_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },

  class_12_board: {
    type: DataTypes.STRING,
    allowNull: true
  },

  class_12_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 2000,
      max: new Date().getFullYear()
    }
  },

  class_12_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },

  class_12_stream: {
    type: DataTypes.ENUM('science', 'commerce', 'arts', 'other'),
    allowNull: true
  },

  // Registration Step 6: Family Information
  father_name: {
    type: DataTypes.STRING,
    allowNull: true
  },

  father_occupation: {
    type: DataTypes.STRING,
    allowNull: true
  },

  father_phone: {
    type: DataTypes.STRING(10),
    allowNull: true
  },

  mother_name: {
    type: DataTypes.STRING,
    allowNull: true
  },

  mother_occupation: {
    type: DataTypes.STRING,
    allowNull: true
  },

  mother_phone: {
    type: DataTypes.STRING(10),
    allowNull: true
  },

  guardian_name: {
    type: DataTypes.STRING,
    allowNull: true
  },

  guardian_relation: {
    type: DataTypes.STRING,
    allowNull: true
  },

  guardian_phone: {
    type: DataTypes.STRING(10),
    allowNull: true
  },

  // Registration Step 7: Documents
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true
  },

  signature_image: {
    type: DataTypes.STRING,
    allowNull: true
  },

  id_proof_type: {
    type: DataTypes.ENUM('aadhaar', 'passport', 'driving_license', 'pan_card'),
    allowNull: true
  },

  id_proof_image: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // Progress Tracking
  registration_step: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 9
    }
  },

  registration_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  registration_completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // User Role and Status
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'alumni', 'college_administrator'),
    defaultValue: 'student'
  },

  account_status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_verification'),
    defaultValue: 'pending_verification'
  },

  // Assessment and Career
  assessment_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  assessment_completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  career_guidance_generated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  // Gamification
  total_coins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },

  current_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },

  puzzles_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },

  forum_posts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },

  reputation_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // College Information (if admitted)
  college_name: {
    type: DataTypes.STRING,
    allowNull: true
  },

  course_name: {
    type: DataTypes.STRING,
    allowNull: true
  },

  admission_number: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },

  admission_year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // Security and Privacy
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  two_factor_secret: {
    type: DataTypes.STRING,
    allowNull: true
  },

  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },

  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  account_locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Privacy Settings
  profile_visibility: {
    type: DataTypes.ENUM('public', 'private', 'friends_only'),
    defaultValue: 'public'
  },

  email_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  sms_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['google_id']
    },
    {
      fields: ['admission_number']
    },
    {
      fields: ['phone']
    },
    {
      fields: ['role']
    }
  ]
});

// Hash password before creating user
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Hash password before updating user
User.beforeUpdate(async (user) => {
  if (user.changed('password') && user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Instance method to check password
User.prototype.checkPassword = async function(password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

// Instance method to get public profile
User.prototype.getPublicProfile = function() {
  const publicFields = {
    id: this.id,
    name: this.name,
    email: this.email,
    profile_picture: this.profile_picture,
    role: this.role,
    college_name: this.college_name,
    course_name: this.course_name,
    admission_year: this.admission_year,
    total_coins: this.total_coins,
    reputation_score: this.reputation_score,
    puzzles_solved: this.puzzles_solved,
    forum_posts: this.forum_posts,
    created_at: this.created_at
  };

  return publicFields;
};

module.exports = { User };
