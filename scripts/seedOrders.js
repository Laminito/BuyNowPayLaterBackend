require('dotenv').config();
const mongoose = require('mongoose');

// Import des modèles
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

const connectDB = require('../src/config/database');

// Données clients de test avec mot de passe hashé en bcrypt
// Hash bcrypt pour 'password123': $2a$12$Ui0GJf504HHmEiiw05l1d.zWPf5CTLMrS0rXbNsmMG7a9dksM.XO6
const testUsers = [
  {
    name: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    password: '$2a$12$Ui0GJf504HHmEiiw05l1d.zWPf5CTLMrS0rXbNsmMG7a9dksM.XO6',
    role: 'user'
  },
  {
    name: 'Marie Martin',
    email: 'marie.martin@email.com',
    password: '$2a$12$Ui0GJf504HHmEiiw05l1d.zWPf5CTLMrS0rXbNsmMG7a9dksM.XO6',
    role: 'user'
  },
  {
    name: 'Pierre Bernard',
    email: 'pierre.bernard@email.com',
    password: '$2a$12$Ui0GJf504HHmEiiw05l1d.zWPf5CTLMrS0rXbNsmMG7a9dksM.XO6',
    role: 'user'
  },
  {
    name: 'Sophie Laurent',
    email: 'sophie.laurent@email.com',
    password: '$2a$12$Ui0GJf504HHmEiiw05l1d.zWPf5CTLMrS0rXbNsmMG7a9dksM.XO6',
    role: 'user'
  },
  {
    name: 'Marc Moreau',
    email: 'marc.moreau@email.com',
    password: '$2a$12$Ui0GJf504HHmEiiw05l1d.zWPf5CTLMrS0rXbNsmMG7a9dksM.XO6',
    role: 'user'
  }
];

// Adresses de livraison de test
const shippingAddresses = [
  {
    firstName: 'Jean',
    lastName: 'Dupont',
    street: '123 Rue de Paris',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    phone: '+33123456789'
  },
  {
    firstName: 'Marie',
    lastName: 'Martin',
    street: '456 Avenue des Champs',
    city: 'Lyon',
    postalCode: '69000',
    country: 'France',
    phone: '+33123456789'
  },
  {
    firstName: 'Pierre',
    lastName: 'Bernard',
    street: '789 Boulevard Saint-Germain',
    city: 'Marseille',
    postalCode: '13000',
    country: 'France',
    phone: '+33123456789'
  },
  {
    firstName: 'Sophie',
    lastName: 'Laurent',
    street: '321 Rue de Toulouse',
    city: 'Toulouse',
    postalCode: '31000',
    country: 'France',
    phone: '+33123456789'
  },
  {
    firstName: 'Marc',
    lastName: 'Moreau',
    street: '654 Avenue de Bordeaux',
    city: 'Bordeaux',
    postalCode: '33000',
    country: 'France',
    phone: '+33123456789'
  }
];

const seedOrders = async () => {
  try {
    await connectDB();

    console.log('🧹 Cleaning existing orders and test users...');
    // Nettoyer les commandes et utilisateurs de test existants
    await Order.deleteMany({});
    // Ne supprimer que les utilisateurs de test (pas l'admin)
    await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } });

    console.log('👥 Creating customer users...');
    // Créer les utilisateurs clients
    const createdUsers = await User.insertMany(testUsers);

    // Restaurer les hashs directement pour éviter un double hachage par le hook pre-save
    const hashedPassword = '$2a$12$Ui0GJf504HHmEiiw05l1d.zWPf5CTLMrS0rXbNsmMG7a9dksM.XO6';
    for (const user of createdUsers) {
      await User.updateOne(
        { _id: user._id },
        { password: hashedPassword }
      );
    }

    console.log('📦 Fetching products...');
    // Récupérer tous les produits
    const products = await Product.find().limit(46);

    if (products.length === 0) {
      throw new Error('❌ Aucun produit trouvé. Veuillez d\'abord exécuter: npm run seed');
    }

    console.log(`📊 Found ${products.length} products to use in orders`);

    console.log('🛒 Creating sample orders...');
    // Générer des commandes de test
    const orders = [];

    // Helper pour générer un orderNumber unique
    const generateOrderNumber = (index) => {
      return `ORD-${Date.now()}-${String(index).padStart(3, '0')}`;
    };

    // Commande 1: Jean - 1 canapé
    orders.push({
      orderNumber: generateOrderNumber(1),
      user: createdUsers[0]._id,
      items: [
        {
          product: products[10]._id, // Salon d'angle 7 places Cuir
          quantity: 1,
          price: products[10].price,
          name: products[10].name,
          image: products[10].images[0]?.url
        }
      ],
      shippingAddress: shippingAddresses[0],
      pricing: {
        subtotal: products[10].price,
        shipping: 50000,
        tax: Math.round(products[10].price * 0.2),
        total: products[10].price + 50000 + Math.round(products[10].price * 0.2)
      },
      payment: {
        method: 'kredika',
        status: 'paid',
        kredikaTransactionId: 'KREDIKA-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paidAt: new Date()
      },
      status: 'delivered',
      tracking: {
        carrier: 'DHL',
        trackingNumber: 'DHL-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Commande 2: Marie - 1 chambre + 1 commode
    orders.push({
      orderNumber: generateOrderNumber(2),
      user: createdUsers[1]._id,
      items: [
        {
          product: products[0]._id, // Chambre Complète Moderne Wengé
          quantity: 1,
          price: products[0].price,
          name: products[0].name,
          image: products[0].images[0]?.url
        },
        {
          product: products[26]._id, // Commode 5 Tiroirs
          quantity: 1,
          price: products[26].price,
          name: products[26].name,
          image: products[26].images[0]?.url
        }
      ],
      shippingAddress: shippingAddresses[1],
      pricing: {
        subtotal: products[0].price + products[26].price,
        shipping: 75000,
        tax: Math.round((products[0].price + products[26].price) * 0.2),
        total: products[0].price + products[26].price + 75000 + Math.round((products[0].price + products[26].price) * 0.2)
      },
      payment: {
        method: 'card',
        status: 'paid',
        paidAt: new Date()
      },
      status: 'processing',
      tracking: {
        carrier: 'UPS',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    });

    // Commande 3: Pierre - 1 cuisine
    orders.push({
      orderNumber: generateOrderNumber(3),
      user: createdUsers[2]._id,
      items: [
        {
          product: products[35]._id, // Cuisine Complète L-Shape
          quantity: 1,
          price: products[35].price,
          name: products[35].name,
          image: products[35].images[0]?.url
        }
      ],
      shippingAddress: shippingAddresses[2],
      pricing: {
        subtotal: products[35].price,
        shipping: 100000,
        tax: Math.round(products[35].price * 0.2),
        total: products[35].price + 100000 + Math.round(products[35].price * 0.2)
      },
      payment: {
        method: 'kredika',
        status: 'pending',
        kredikaTransactionId: 'KREDIKA-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      },
      status: 'pending'
    });

    // Commande 4: Sophie - Multiple bureaux
    const officeProducts = [products[40], products[41], products[42]]; // Bureau items
    const officeItems = officeProducts.map(p => ({
      product: p._id,
      quantity: 1,
      price: p.price,
      name: p.name,
      image: p.images[0]?.url
    }));

    const officeSubtotal = officeProducts.reduce((sum, p) => sum + p.price, 0);
    orders.push({
      orderNumber: generateOrderNumber(4),
      user: createdUsers[3]._id,
      items: officeItems,
      shippingAddress: shippingAddresses[3],
      pricing: {
        subtotal: officeSubtotal,
        shipping: 50000,
        tax: Math.round(officeSubtotal * 0.2),
        total: officeSubtotal + 50000 + Math.round(officeSubtotal * 0.2)
      },
      payment: {
        method: 'paypal',
        status: 'paid',
        paidAt: new Date()
      },
      status: 'confirmed',
      tracking: {
        carrier: 'FedEx',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    });

    // Commande 5: Marc - Mobilier complet
    const fullFurniture = [products[5], products[15], products[30]]; // Mix chambre, salon, cuisine
    const fullItems = fullFurniture.map(p => ({
      product: p._id,
      quantity: 1,
      price: p.price,
      name: p.name,
      image: p.images[0]?.url
    }));

    const fullSubtotal = fullFurniture.reduce((sum, p) => sum + p.price, 0);
    orders.push({
      orderNumber: generateOrderNumber(5),
      user: createdUsers[4]._id,
      items: fullItems,
      shippingAddress: shippingAddresses[4],
      pricing: {
        subtotal: fullSubtotal,
        shipping: 125000,
        tax: Math.round(fullSubtotal * 0.2),
        total: fullSubtotal + 125000 + Math.round(fullSubtotal * 0.2)
      },
      payment: {
        method: 'kredika',
        status: 'paid',
        kredikaTransactionId: 'KREDIKA-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paidAt: new Date()
      },
      status: 'shipped',
      tracking: {
        carrier: 'DPD',
        trackingNumber: 'DPD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      }
    });

    // Commandes additionnelles avec différentes statuts
    // Commande 6: Premier client - Petites pièces décoratives
    const decorItems = [products[28], products[29]]; // Chevets et Miroir
    const decorSubtotal = decorItems.reduce((sum, p) => sum + p.price, 0);
    orders.push({
      orderNumber: generateOrderNumber(6),
      user: createdUsers[0]._id,
      items: decorItems.map(p => ({
        product: p._id,
        quantity: 1,
        price: p.price,
        name: p.name,
        image: p.images[0]?.url
      })),
      shippingAddress: shippingAddresses[0],
      pricing: {
        subtotal: decorSubtotal,
        shipping: 20000,
        tax: Math.round(decorSubtotal * 0.2),
        total: decorSubtotal + 20000 + Math.round(decorSubtotal * 0.2)
      },
      payment: {
        method: 'card',
        status: 'paid',
        paidAt: new Date()
      },
      status: 'delivered',
      tracking: {
        carrier: 'Colissimo',
        trackingNumber: 'COLIS-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        estimatedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Déjà livré
      }
    });

    // Commande 7: Deuxième client - Table et chaises
    const diningProducts = [products[36]]; // Table + 6 Chaises
    orders.push({
      orderNumber: generateOrderNumber(7),
      user: createdUsers[1]._id,
      items: [{
        product: diningProducts[0]._id,
        quantity: 1,
        price: diningProducts[0].price,
        name: diningProducts[0].name,
        image: diningProducts[0].images[0]?.url
      }],
      shippingAddress: shippingAddresses[1],
      pricing: {
        subtotal: diningProducts[0].price,
        shipping: 60000,
        tax: Math.round(diningProducts[0].price * 0.2),
        total: diningProducts[0].price + 60000 + Math.round(diningProducts[0].price * 0.2)
      },
      payment: {
        method: 'kredika',
        status: 'failed'
      },
      status: 'cancelled'
    });

    // Commande 8: Troisième client - Sièges salon
    const seatingProducts = [products[18], products[19]]; // Tabourets et Chaises
    const seatingSubtotal = seatingProducts.reduce((sum, p) => sum + p.price, 0);
    orders.push({
      orderNumber: generateOrderNumber(8),
      user: createdUsers[2]._id,
      items: seatingProducts.map(p => ({
        product: p._id,
        quantity: 1,
        price: p.price,
        name: p.name,
        image: p.images[0]?.url
      })),
      shippingAddress: shippingAddresses[2],
      pricing: {
        subtotal: seatingSubtotal,
        shipping: 35000,
        tax: Math.round(seatingSubtotal * 0.2),
        total: seatingSubtotal + 35000 + Math.round(seatingSubtotal * 0.2)
      },
      payment: {
        method: 'card',
        status: 'pending'
      },
      status: 'pending'
    });

    await Order.insertMany(orders);

    console.log('\n✅ Database orders seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - 👥 ${createdUsers.length} test users created`);
    console.log(`   - 📦 ${orders.length} orders created`);
    console.log(`   - 💰 Total order value: ${orders.reduce((sum, o) => sum + o.pricing.total, 0).toLocaleString('fr-FR')} CFA`);
    console.log('\n🔐 Test Customer Accounts:');
    console.log('   Login avec: email & password123 (voir detailsbelow)');
    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. Email: ${user.email} | Password: password123`);
    });
    
    console.log('\n📊 Order Distribution by Status:');
    const statusCounts = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} order(s)`);
    });

    console.log('\n💳 Payment Method Distribution:');
    const paymentCounts = {};
    orders.forEach(o => {
      paymentCounts[o.payment.method] = (paymentCounts[o.payment.method] || 0) + 1;
    });
    Object.entries(paymentCounts).forEach(([method, count]) => {
      console.log(`   - ${method}: ${count} order(s)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    process.exit(1);
  }
};

seedOrders();
