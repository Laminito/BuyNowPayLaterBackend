require('dotenv').config();
const mongoose = require('mongoose');

// Import des modèles
const Review = require('../src/models/Review');
const User = require('../src/models/User');
const Product = require('../src/models/Product');

const connectDB = require('../src/config/database');

const seedReviews = async () => {
  try {
    await connectDB();

    console.log('🧹 Cleaning existing reviews...');
    await Review.deleteMany({});

    console.log('👥 Fetching users and products...');
    const users = await User.find({ role: 'user' }).limit(5);
    const products = await Product.find().limit(20);

    if (users.length === 0 || products.length === 0) {
      throw new Error('❌ Users or products not found. Please seed database first.');
    }

    console.log('⭐ Creating sample reviews...');

    const reviews = [];
    const reviewTexts = [
      {
        title: 'Excellent quality, very comfortable!',
        comment: 'This bedroom set exceeds my expectations. The quality is outstanding and it looks even better in person than in the pictures. Assembly was straightforward and customer service was very helpful.'
      },
      {
        title: 'Great value for money',
        comment: 'Amazing furniture for the price. Very durable and stylish. I\'ve had it for several months now and it\'s holding up perfectly. Highly recommend!'
      },
      {
        title: 'Perfect fit for my space',
        comment: 'I was worried about the size, but it fits perfectly in my living room. The color is exactly as shown in the photos. Very satisfied with this purchase.'
      },
      {
        title: 'Disappointed with delivery',
        comment: 'The furniture itself is nice, but delivery took longer than expected. However, once I received it, the quality made up for the delay.'
      },
      {
        title: 'Love it!',
        comment: 'Exactly what I was looking for. Modern design, good quality materials, and arrived well packaged. Will definitely buy from here again.'
      },
      {
        title: 'Not as described',
        comment: 'The color is slightly different from the online pictures, but still acceptable. Quality is good though.'
      },
      {
        title: 'Best purchase ever',
        comment: 'Outstanding craftsmanship. This piece is a centerpiece in my home. Everyone who visits asks where I got it. Absolutely worth the investment.'
      },
      {
        title: 'Good but expensive',
        comment: 'Nice furniture but quite pricey. Quality justifies the price though. Would have appreciated a discount for bulk purchase.'
      }
    ];

    // Create reviews for multiple products and users
    for (let i = 0; i < 15; i++) {
      const user = users[i % users.length];
      const product = products[i % products.length];
      const reviewText = reviewTexts[i % reviewTexts.length];
      const rating = [3, 4, 4, 5, 5, 4, 5, 4][i % 8];

      // Check if review already exists
      const exists = await Review.findOne({ product: product._id, user: user._id });
      if (!exists) {
        reviews.push({
          product: product._id,
          user: user._id,
          title: reviewText.title,
          comment: reviewText.comment,
          rating: rating,
          status: 'approved', // Auto-approve for demo
          verified: true
        });
      }
    }

    const createdReviews = await Review.insertMany(reviews);

    console.log('\n✅ Reviews seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - ⭐ ${createdReviews.length} reviews created`);
    console.log(`   - Ratings distribution:`);
    
    const ratingDist = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    ratingDist.forEach(r => {
      console.log(`     • ${r._id} stars: ${r.count} review(s)`);
    });

    console.log('\n📋 Sample Reviews Created:');
    createdReviews.slice(0, 3).forEach((review, index) => {
      console.log(`   ${index + 1}. "${review.title}" - ${review.rating}⭐ (Verified: ${review.verified})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    process.exit(1);
  }
};

seedReviews();
