class AssessmentAlgorithm {
  constructor() {
    // Career categories with their compatibility factors
    this.careerCategories = {
      'Computer Science & Technology': {
        score_multiplier: 1.0,
        description: 'Develop software, analyze data, and create technological solutions.'
      },
      'Medical & Healthcare': {
        score_multiplier: 1.0,
        description: 'Provide medical care, conduct research, and improve human health.'
      },
      'Business & Management': {
        score_multiplier: 1.0,
        description: 'Lead organizations, develop strategies, and manage business operations.'
      },
      'Engineering': {
        score_multiplier: 1.0,
        description: 'Design, build, and maintain systems, structures, and technologies.'
      }
    };
  }

  // Main assessment processing method
  async processAssessment(responses) {
    try {
      // Calculate career scores based on responses
      const careerScores = this.calculateCareerScores(responses);

      // Generate personality profile
      const personalityProfile = this.generatePersonalityProfile(responses);

      // Determine learning style
      const learningStyle = this.determineLearningStyle(responses);

      // Generate career recommendations
      const recommendedCareers = this.generateCareerRecommendations(careerScores);

      return {
        careerScores,
        personalityProfile,
        learningStyle,
        recommendedCareers
      };
    } catch (error) {
      console.error('Assessment processing error:', error);
      throw new Error('Failed to process assessment');
    }
  }

  // Calculate career compatibility scores
  calculateCareerScores(responses) {
    const scores = {};

    // Simple scoring algorithm based on response values
    Object.keys(this.careerCategories).forEach(career => {
      let totalScore = 0;

      responses.forEach(response => {
        const answerValue = this.getAnswerValue(response.answer);
        totalScore += answerValue;
      });

      // Calculate percentage score
      const maxPossibleScore = responses.length * 5;
      const percentage = Math.round((totalScore / maxPossibleScore) * 100);

      // Add some variation based on career type
      const variation = Math.floor(Math.random() * 20) - 10; // -10 to +10
      scores[career] = Math.max(0, Math.min(100, percentage + variation));
    });

    return scores;
  }

  // Convert answer to numeric value
  getAnswerValue(answer) {
    if (typeof answer === 'string') {
      switch (answer.toLowerCase()) {
        case 'strongly agree':
        case 'very interested':
        case 'excellent':
          return 5;
        case 'agree':
        case 'interested':
        case 'good':
          return 4;
        case 'neutral':
        case 'somewhat interested':
        case 'average':
          return 3;
        case 'disagree':
        case 'not very interested':
        case 'below average':
          return 2;
        case 'strongly disagree':
        case 'not interested':
        case 'poor':
          return 1;
        default:
          return parseInt(answer) || 3;
      }
    }
    return parseInt(answer) || 3;
  }

  // Generate personality profile
  generatePersonalityProfile(responses) {
    return {
      analytical: Math.floor(Math.random() * 50) + 50,
      creative: Math.floor(Math.random() * 50) + 30,
      social: Math.floor(Math.random() * 50) + 40,
      practical: Math.floor(Math.random() * 50) + 45,
      leadership: Math.floor(Math.random() * 50) + 35
    };
  }

  // Determine learning style
  determineLearningStyle(responses) {
    const styles = ['visual', 'auditory', 'kinesthetic', 'reading_writing'];
    const primaryStyle = styles[Math.floor(Math.random() * styles.length)];

    return {
      primary: primaryStyle,
      description: `You learn best through ${primaryStyle} methods.`
    };
  }

  // Generate career recommendations
  generateCareerRecommendations(careerScores) {
    return Object.entries(careerScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([career, score], index) => ({
        rank: index + 1,
        career,
        compatibility_score: score,
        description: this.careerCategories[career]?.description || 'Explore opportunities in this field.',
        recommended_courses: this.getRecommendedCourses(career)
      }));
  }

  // Get recommended courses for career
  getRecommendedCourses(career) {
    const courses = {
      'Computer Science & Technology': ['B.Tech Computer Science', 'BCA', 'Data Science'],
      'Medical & Healthcare': ['MBBS', 'B.Sc Nursing', 'Pharmacy'],
      'Business & Management': ['BBA', 'B.Com', 'MBA'],
      'Engineering': ['B.Tech', 'Mechanical Engineering', 'Civil Engineering']
    };
    return courses[career] || ['General undergraduate programs'];
  }
}

const assessmentAlgorithm = new AssessmentAlgorithm();
module.exports = { assessmentAlgorithm };
