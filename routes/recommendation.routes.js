// recommendationService.js - Adapted for your schema
class RecommendationService {
  constructor(userModel, courseModel) {
    this.User = userModel;
    this.Course = courseModel;
  }

  // Main recommendation function
  async getRecommendations(userId, limit = 10) {
    try {
      const user = await this.User.findById(userId)
        .populate('profile.coursesEnrolled')
        .populate('profile.coursesCreated')
        .populate('purchasedCourses');
      
      if (!user) {
        throw new Error('User not found');
      }

      let recommendations = [];

      switch (user.role) {
        case 'APPRENANT':
          recommendations = await this.getStudentRecommendations(user, limit);
          break;
        case 'INSTRUCTEUR':
        case 'EXPERT':
          recommendations = await this.getInstructorRecommendations(user, limit);
          break;
        case 'ADMIN':
          recommendations = await this.getAdminRecommendations(user, limit);
          break;
        default:
          recommendations = await this.getFallbackRecommendations(limit);
      }

      return recommendations;
    } catch (error) {
      console.error('Recommendation error:', error);
      return this.getFallbackRecommendations(limit);
    }
  }

  // Student recommendations (APPRENANT)
  async getStudentRecommendations(user, limit) {
    const enrolledIds = user.profile.coursesEnrolled.map(c => c._id.toString());
    const purchasedIds = user.purchasedCourses.map(c => c._id.toString());
    const excludeIds = [...new Set([...enrolledIds, ...purchasedIds])];

    const recommendations = await Promise.all([
      this.getSkillBasedRecommendations(user, excludeIds, Math.ceil(limit * 0.4)),
      this.getCollaborativeRecommendations(user, excludeIds, Math.ceil(limit * 0.3)),
      this.getPopularRecommendations(excludeIds, Math.ceil(limit * 0.2)),
      this.getProgressionRecommendations(user, excludeIds, Math.ceil(limit * 0.1))
    ]);

    return this.combineAndRankRecommendations(recommendations.flat(), limit);
  }

  // Instructor/Expert recommendations
  async getInstructorRecommendations(user, limit) {
    const createdIds = user.profile.coursesCreated.map(c => c._id.toString());
    const userSkills = user.profile.skills || [];

    const recommendations = await Promise.all([
      this.getCompetitorAnalysis(user, createdIds, Math.ceil(limit * 0.5)),
      this.getSkillBasedRecommendations(user, createdIds, Math.ceil(limit * 0.3)),
      this.getTrendingInField(userSkills, createdIds, Math.ceil(limit * 0.2))
    ]);

    return this.combineAndRankRecommendations(recommendations.flat(), limit);
  }

  // Admin recommendations - overview of platform
  async getAdminRecommendations(user, limit) {
    const recommendations = await Promise.all([
      this.getSystemOverviewRecommendations(Math.ceil(limit * 0.4)),
      this.getPopularRecommendations([], Math.ceil(limit * 0.3)),
      this.getRecentlyCreatedRecommendations(Math.ceil(limit * 0.3))
    ]);

    return this.combineAndRankRecommendations(recommendations.flat(), limit);
  }

  // Skill-based recommendations
  async getSkillBasedRecommendations(user, excludeIds, limit) {
    const userSkills = user.profile.skills || [];
    
    if (userSkills.length === 0) {
      return this.getPopularRecommendations(excludeIds, limit);
    }

    const courses = await this.Course.find({
      _id: { $nin: excludeIds },
      requiredSkills: { $in: userSkills }
    });

    return courses.map(course => {
      const matchingSkills = course.requiredSkills.filter(skill => 
        userSkills.includes(skill)
      );
      
      return {
        course,
        score: this.calculateSkillScore(matchingSkills.length, userSkills.length, course.requiredSkills.length),
        reason: `Matches ${matchingSkills.length} of your skills`,
        type: 'skill-based'
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  }

  // Collaborative filtering based on similar users
  async getCollaborativeRecommendations(user, excludeIds, limit) {
    const userSkills = new Set(user.profile.skills || []);
    const userEnrolledIds = new Set(user.profile.coursesEnrolled.map(c => c._id.toString()));

    // Find users with similar skills
    const similarUsers = await this.User.find({
      _id: { $ne: user._id },
      role: 'APPRENANT',
      'profile.skills': { $in: Array.from(userSkills) }
    })
    .populate('profile.coursesEnrolled')
    .limit(50);

    const courseScores = new Map();

    similarUsers.forEach(similarUser => {
      const similarity = this.calculateSkillSimilarity(
        userSkills, 
        new Set(similarUser.profile.skills || [])
      );

      if (similarity > 0.2) { // Minimum similarity threshold
        similarUser.profile.coursesEnrolled.forEach(course => {
          const courseId = course._id.toString();
          
          if (!excludeIds.includes(courseId) && !userEnrolledIds.has(courseId)) {
            const currentScore = courseScores.get(courseId) || 0;
            courseScores.set(courseId, currentScore + similarity);
          }
        });
      }
    });

    const courseIds = Array.from(courseScores.keys())
      .sort((a, b) => courseScores.get(b) - courseScores.get(a))
      .slice(0, limit);

    const courses = await this.Course.find({ _id: { $in: courseIds } });

    return courses.map(course => ({
      course,
      score: courseScores.get(course._id.toString()) / similarUsers.length,
      reason: 'Students with similar skills enrolled',
      type: 'collaborative'
    }));
  }

  // Popular recommendations
  async getPopularRecommendations(excludeIds, limit) {
    // Get courses with most enrollments
    const pipeline = [
      { $match: { _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'profile.coursesEnrolled',
          as: 'enrollments'
        }
      },
      {
        $addFields: {
          enrollmentCount: { $size: '$enrollments' }
        }
      },
      { $sort: { enrollmentCount: -1, createdAt: -1 } },
      { $limit: limit }
    ];

    const courses = await this.Course.aggregate(pipeline);

    return courses.map(course => ({
      course,
      score: Math.min(course.enrollmentCount / 100, 1), // Normalize to 0-1
      reason: `${course.enrollmentCount} students enrolled`,
      type: 'popular'
    }));
  }

  // Progression-based recommendations
  async getProgressionRecommendations(user, excludeIds, limit) {
    const enrolledCourses = user.profile.coursesEnrolled;
    
    if (enrolledCourses.length === 0) return [];

    // Get skills from enrolled courses
    const learnedSkills = new Set();
    enrolledCourses.forEach(course => {
      course.requiredSkills.forEach(skill => learnedSkills.add(skill));
    });

    // Find courses that build upon learned skills
    const courses = await this.Course.find({
      _id: { $nin: excludeIds },
      requiredSkills: { 
        $not: { $elemMatch: { $nin: Array.from(learnedSkills) } },
        $exists: true,
        $ne: []
      }
    }).limit(limit);

    return courses.map(course => ({
      course,
      score: 0.8,
      reason: 'Next step in your learning path',
      type: 'progression'
    }));
  }

  // Competitor analysis for instructors
  async getCompetitorAnalysis(user, excludeIds, limit) {
    const userSkills = user.profile.skills || [];
    
    const courses = await this.Course.find({
      _id: { $nin: excludeIds },
      requiredSkills: { $in: userSkills }
    })
    .populate('comments')
    .limit(limit * 2);

    return courses.map(course => ({
      course,
      score: 0.7,
      reason: 'Similar courses in your expertise area',
      type: 'competitor-analysis'
    })).slice(0, limit);
  }

  // Trending courses in specific field
  async getTrendingInField(skills, excludeIds, limit) {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 3); // Last 3 months

    const courses = await this.Course.find({
      _id: { $nin: excludeIds },
      requiredSkills: { $in: skills },
      createdAt: { $gte: recentDate }
    })
    .sort({ createdAt: -1 })
    .limit(limit);

    return courses.map(course => ({
      course,
      score: 0.6,
      reason: 'Recently trending in your field',
      type: 'trending'
    }));
  }

  // System overview for admins
  async getSystemOverviewRecommendations(limit) {
    const courses = await this.Course.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    return courses.map(course => ({
      course,
      score: 0.5,
      reason: 'Platform overview',
      type: 'admin-overview'
    }));
  }

  // Recently created courses
  async getRecentlyCreatedRecommendations(limit) {
    const courses = await this.Course.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    return courses.map(course => ({
      course,
      score: 0.4,
      reason: 'Recently added to platform',
      type: 'recent'
    }));
  }

  // Helper methods
  combineAndRankRecommendations(recommendations, limit) {
    const seen = new Set();
    const combined = [];

    recommendations.forEach(rec => {
      const courseId = rec.course._id.toString();
      if (!seen.has(courseId)) {
        seen.add(courseId);
        combined.push(rec);
      }
    });

    return combined
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  calculateSkillScore(matchingSkills, userSkillCount, courseSkillCount) {
    if (userSkillCount === 0 || courseSkillCount === 0) return 0;
    
    // Jaccard similarity with boost for exact matches
    const union = userSkillCount + courseSkillCount - matchingSkills;
    const jaccard = matchingSkills / union;
    
    // Boost for courses that match more user skills
    const coverage = matchingSkills / userSkillCount;
    
    return (jaccard * 0.6) + (coverage * 0.4);
  }

  calculateSkillSimilarity(skillsA, skillsB) {
    const intersection = new Set([...skillsA].filter(x => skillsB.has(x)));
    const union = new Set([...skillsA, ...skillsB]);
    return intersection.size / union.size;
  }

  async getFallbackRecommendations(limit) {
    const courses = await this.Course.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    return courses.map(course => ({
      course,
      score: 0.3,
      reason: 'Featured courses',
      type: 'fallback'
    }));
  }
}

// Updated Express.js routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { userModel: User } = require('../Models/user.model');
const Course = require('../Models/course.model');

// Initialize recommendation service
const recommendationService = new RecommendationService(User, Course);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user; // user contains decoded JWT payload (e.g., { id: userId })
    next();
  });
};

// Get current user details
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id role profile.skills');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});
router.get('/recommendations', async (req, res) => {
  try {
    const { userId, limit = 10, type = 'mixed' } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    let recommendations;

    if (type === 'mixed') {
      recommendations = await recommendationService.getRecommendations(userId, parseInt(limit));
    } else {
      // Handle specific recommendation types
      const user = await User.findById(userId).populate('profile.coursesEnrolled profile.coursesCreated purchasedCourses');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      const excludeIds = [
        ...user.profile.coursesEnrolled.map(c => c._id.toString()),
        ...user.purchasedCourses.map(c => c._id.toString())
      ];

      switch (type) {
        case 'skill-based':
          recommendations = await recommendationService.getSkillBasedRecommendations(user, excludeIds, parseInt(limit));
          break;
        case 'collaborative':
          recommendations = await recommendationService.getCollaborativeRecommendations(user, excludeIds, parseInt(limit));
          break;
        case 'popular':
          recommendations = await recommendationService.getPopularRecommendations(excludeIds, parseInt(limit));
          break;
        default:
          recommendations = await recommendationService.getRecommendations(userId, parseInt(limit));
      }
    }

    res.json({
      success: true,
      data: recommendations,
      totalCount: recommendations.length,
      userId: userId
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Track user interactions for improving recommendations
router.post('/track-interaction', async (req, res) => {
  try {
    const { userId, courseId, interactionType, value } = req.body;
    
    if (!userId || !courseId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: 'userId, courseId, and interactionType are required'
      });
    }

    // Handle different interaction types
    switch (interactionType) {
      case 'enroll':
        await User.findByIdAndUpdate(userId, {
          $addToSet: { 'profile.coursesEnrolled': courseId }
        });
        break;
      
      case 'purchase':
        await User.findByIdAndUpdate(userId, {
          $addToSet: { purchasedCourses: courseId }
        });
        break;
      
      case 'view':
        // Could track views for analytics
        console.log(`User ${userId} viewed course ${courseId}`);
        break;
      
      case 'rate':
        // Could add rating to course comments or separate rating system
        if (value) {
          await Course.findByIdAndUpdate(courseId, {
            $push: {
              comments: {
                userId: userId,
                type: 'rating',
                text: `Rating: ${value}/5`,
                createdAt: new Date()
              }
            }
          });
        }
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track interaction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's recommendation stats
router.get('/recommendation-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('profile.coursesEnrolled')
      .populate('profile.coursesCreated')
      .populate('purchasedCourses');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = {
      enrolledCount: user.profile.coursesEnrolled.length,
      createdCount: user.profile.coursesCreated.length,
      purchasedCount: user.purchasedCourses.length,
      skillsCount: user.profile.skills.length,
      role: user.role
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;