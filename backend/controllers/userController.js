const { User } = require('../models/User');
const { Assessment } = require('../models/Assessment');
const { CoinTransaction } = require('../models/Coin');
const { PuzzleAttempt } = require('../models/Puzzle');
const { ForumPost } = require('../models/Forum');
const { cloudinaryService } = require('../utils/cloudinaryService');
const { encryptionService } = require('../utils/encryptionService');
const { REGISTRATION_STEPS } = require('../config/constants');

class UserController {
  getRegistrationStatus = async (req, res) => {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          current_step: user.registration_step,
          completed: user.registration_completed,
          steps_completed: user.registration_step - 1,
          total_steps: 9,
          step_details: {
            1: { name: 'Basic Information', completed: user.registration_step > 1 },
            2: { name: 'OTP Verification', completed: user.phone_verified && user.email_verified },
            3: { name: 'Aadhaar Verification', completed: user.aadhaar_verified },
            4: { name: 'Personal Details', completed: user.date_of_birth !== null },
            5: { name: 'Academic Records', completed: user.class_12_percentage !== null },
            6: { name: 'Family Information', completed: user.father_name !== null },
            7: { name: 'Document Upload', completed: user.profile_picture !== null },
            8: { name: 'Review', completed: user.registration_step > 8 },
            9: { name: 'Submission', completed: user.registration_completed }
          }
        }
      });
    } catch (error) {
      console.error('Get registration status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch registration status',
        error: error.message
      });
    }
  };

  updateRegistrationStep = async (req, res) => {
    try {
      const { stepNumber } = req.params;
      const stepData = req.body;
      const user = req.user;
      const step = parseInt(stepNumber);

      if (step < 1 || step > 9) {
        return res.status(400).json({
          success: false,
          message: 'Invalid step number'
        });
      }

      if (step > user.registration_step + 1) {
        return res.status(400).json({
          success: false,
          message: 'Complete previous steps first'
        });
      }

      let updateData = {};

      switch (step) {
        case 1:
          updateData = {
            name: stepData.name,
            phone: stepData.phone,
            registration_step: Math.max(user.registration_step, 2)
          };
          break;
        case 2:
          updateData = {
            registration_step: Math.max(user.registration_step, 3)
          };
          break;
        case 3:
          updateData = {
            aadhaar_number: encryptionService.encrypt(stepData.aadhaar_number),
            registration_step: Math.max(user.registration_step, 4)
          };
          break;
        case 4:
          updateData = {
            date_of_birth: stepData.date_of_birth,
            gender: stepData.gender,
            address: stepData.address,
            city: stepData.city,
            state: stepData.state,
            pincode: stepData.pincode,
            registration_step: Math.max(user.registration_step, 5)
          };
          break;
        case 5:
          updateData = {
            class_10_board: stepData.class_10_board,
            class_10_year: stepData.class_10_year,
            class_10_percentage: stepData.class_10_percentage,
            class_12_board: stepData.class_12_board,
            class_12_year: stepData.class_12_year,
            class_12_percentage: stepData.class_12_percentage,
            class_12_stream: stepData.class_12_stream,
            registration_step: Math.max(user.registration_step, 6)
          };
          break;
        case 6:
          updateData = {
            father_name: stepData.father_name,
            father_occupation: stepData.father_occupation,
            father_phone: stepData.father_phone,
            mother_name: stepData.mother_name,
            mother_occupation: stepData.mother_occupation,
            mother_phone: stepData.mother_phone,
            guardian_name: stepData.guardian_name,
            guardian_relation: stepData.guardian_relation,
            guardian_phone: stepData.guardian_phone,
            registration_step: Math.max(user.registration_step, 7)
          };
          break;
        case 7:
          updateData = {
            registration_step: Math.max(user.registration_step, 8)
          };
          break;
        case 8:
          updateData = {
            registration_step: Math.max(user.registration_step, 9)
          };
          break;
        case 9:
          updateData = {
            registration_completed: true,
            registration_completed_at: new Date(),
            account_status: 'active',
            registration_step: 9
          };
          break;
      }

      await user.update(updateData);

      res.json({
        success: true,
        message: `Step ${step} updated successfully`,
        data: {
          current_step: user.registration_step,
          step_data: updateData
        }
      });
    } catch (error) {
      console.error('Update registration step error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update registration step',
        error: error.message
      });
    }
  };

  completeRegistration = async (req, res) => {
    try {
      const user = req.user;

      const requiredFields = [
        'name', 'phone', 'date_of_birth', 'gender', 'address',
        'class_10_percentage', 'class_12_percentage', 'father_name',
        'profile_picture'
      ];

      const missingFields = requiredFields.filter(field => !user[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Registration incomplete',
          missing_fields: missingFields
        });
      }

      await user.update({
        registration_completed: true,
        registration_completed_at: new Date(),
        account_status: 'active',
        registration_step: 9
      });

      res.json({
        success: true,
        message: 'Registration completed successfully!',
        data: {
          user: user.getPublicProfile(),
          next_steps: [
            'Take career assessment',
            'Explore college options',
            'Join community forums'
          ]
        }
      });
    } catch (error) {
      console.error('Complete registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete registration',
        error: error.message
      });
    }
  };

  uploadDocuments = async (req, res) => {
    try {
      const user = req.user;
      const files = req.files;
      let updateData = {};

      if (files.profile_picture && files.profile_picture[0]) {
        const profilePictureUrl = await cloudinaryService.upload(
          files.profile_picture[0],
          'profile_pictures'
        );
        updateData.profile_picture = profilePictureUrl;
      }

      if (files.signature_image && files.signature_image[0]) {
        const signatureUrl = await cloudinaryService.upload(
          files.signature_image[0],
          'signatures'
        );
        updateData.signature_image = signatureUrl;
      }

      if (files.id_proof_image && files.id_proof_image[0]) {
        const idProofUrl = await cloudinaryService.upload(
          files.id_proof_image[0],
          'id_proofs'
        );
        updateData.id_proof_image = idProofUrl;
      }

      await user.update(updateData);

      res.json({
        success: true,
        message: 'Documents uploaded successfully',
        data: updateData
      });
    } catch (error) {
      console.error('Upload documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload documents',
        error: error.message
      });
    }
  };

  getProfile = async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'two_factor_secret'] }
      });

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message
      });
    }
  };

  updateProfile = async (req, res) => {
    try {
      const user = req.user;
      const updates = req.body;

      const protectedFields = [
        'id', 'email', 'password', 'google_id', 'total_coins',
        'registration_completed', 'assessment_completed'
      ];

      protectedFields.forEach(field => delete updates[field]);

      await user.update(updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: user.getPublicProfile() }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  };

  updateAcademicInfo = async (req, res) => {
    try {
      const user = req.user;
      const academicData = req.body;

      const updateData = {
        class_10_board: academicData.class_10_board,
        class_10_year: academicData.class_10_year,
        class_10_percentage: academicData.class_10_percentage,
        class_12_board: academicData.class_12_board,
        class_12_year: academicData.class_12_year,
        class_12_percentage: academicData.class_12_percentage,
        class_12_stream: academicData.class_12_stream
      };

      await user.update(updateData);

      res.json({
        success: true,
        message: 'Academic information updated successfully',
        data: { academic_info: updateData }
      });
    } catch (error) {
      console.error('Update academic info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update academic information',
        error: error.message
      });
    }
  };

  updateFamilyInfo = async (req, res) => {
    try {
      const user = req.user;
      const familyData = req.body;

      const updateData = {
        father_name: familyData.father_name,
        father_occupation: familyData.father_occupation,
        father_phone: familyData.father_phone,
        mother_name: familyData.mother_name,
        mother_occupation: familyData.mother_occupation,
        mother_phone: familyData.mother_phone,
        guardian_name: familyData.guardian_name,
        guardian_relation: familyData.guardian_relation,
        guardian_phone: familyData.guardian_phone
      };

      await user.update(updateData);

      res.json({
        success: true,
        message: 'Family information updated successfully',
        data: { family_info: updateData }
      });
    } catch (error) {
      console.error('Update family info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update family information',
        error: error.message
      });
    }
  };

  updatePrivacySettings = async (req, res) => {
    try {
      const user = req.user;
      const privacyData = req.body;

      const updateData = {
        privacy_profile_visible: privacyData.profile_visible || true,
        privacy_email_visible: privacyData.email_visible || false,
        privacy_phone_visible: privacyData.phone_visible || false
      };

      await user.update(updateData);

      res.json({
        success: true,
        message: 'Privacy settings updated successfully',
        data: { privacy_settings: updateData }
      });
    } catch (error) {
      console.error('Update privacy settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update privacy settings',
        error: error.message
      });
    }
  };

  getVerificationStatus = async (req, res) => {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          aadhaar_verified: user.aadhaar_verified,
          account_status: user.account_status
        }
      });
    } catch (error) {
      console.error('Get verification status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch verification status',
        error: error.message
      });
    }
  };

  verifyAadhaar = async (req, res) => {
    try {
      const user = req.user;
      const { aadhaar_number } = req.body;

      await user.update({
        aadhaar_number: encryptionService.encrypt(aadhaar_number),
        aadhaar_verified: true
      });

      res.json({
        success: true,
        message: 'Aadhaar verified successfully'
      });
    } catch (error) {
      console.error('Verify Aadhaar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify Aadhaar',
        error: error.message
      });
    }
  };

  getDashboard = async (req, res) => {
    try {
      const user = req.user;

      const recentTransactions = await CoinTransaction.findAll({
        where: { user_id: user.id },
        limit: 5,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          user: user.getPublicProfile(),
          progress: {
            registration_completed: user.registration_completed,
            assessment_completed: user.assessment_completed,
            career_guidance_generated: user.career_guidance_generated
          },
          statistics: {
            total_coins: user.total_coins,
            current_streak: user.current_streak,
            puzzles_solved: user.puzzles_solved,
            forum_posts: user.forum_posts,
            reputation_score: user.reputation_score
          },
          recent_transactions: recentTransactions
        }
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  };

  getProgress = async (req, res) => {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          registration_progress: (user.registration_step / 9) * 100,
          assessment_completed: user.assessment_completed,
          career_guidance_generated: user.career_guidance_generated,
          total_coins: user.total_coins,
          current_streak: user.current_streak
        }
      });
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress',
        error: error.message
      });
    }
  };

  getStatistics = async (req, res) => {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          total_coins: user.total_coins,
          current_streak: user.current_streak,
          puzzles_solved: user.puzzles_solved,
          forum_posts: user.forum_posts,
          reputation_score: user.reputation_score,
          assessments_taken: user.assessments_taken || 0,
          achievements_unlocked: user.achievements_unlocked || 0
        }
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  };

  getAchievements = async (req, res) => {
    try {
      const user = req.user;

      const achievements = [
        {
          id: 1,
          name: 'Registration Complete',
          description: 'Complete your profile registration',
          unlocked: user.registration_completed,
          unlocked_at: user.registration_completed_at
        },
        {
          id: 2,
          name: 'First Assessment',
          description: 'Take your first career assessment',
          unlocked: user.assessment_completed,
          unlocked_at: user.assessment_completed_at
        }
      ];

      res.json({
        success: true,
        data: { achievements }
      });
    } catch (error) {
      console.error('Get achievements error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch achievements',
        error: error.message
      });
    }
  };

  updateCollegeInfo = async (req, res) => {
    try {
      const user = req.user;
      const collegeData = req.body;

      const updateData = {
        current_college: collegeData.college_name,
        current_course: collegeData.course_name,
        college_year: collegeData.year,
        college_city: collegeData.city
      };

      await user.update(updateData);

      res.json({
        success: true,
        message: 'College information updated successfully',
        data: { college_info: updateData }
      });
    } catch (error) {
      console.error('Update college info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update college information',
        error: error.message
      });
    }
  };
}

const userController = new UserController();
module.exports = userController;

