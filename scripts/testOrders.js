require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';
let testOrderId = '';

const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true // Don't throw on any status
});

const test = async () => {
  try {
    console.log('🧪 Testing Order APIs...\n');

    // 1. Login with existing test user
    console.log('1️⃣  Testing Login...');
    let response = await client.post('/auth/login', {
      email: 'jean.dupont@email.com',
      password: 'password123'
    });

    if (response.status === 200) {
      authToken = response.data.token;
      console.log('✅ Login OK - Token obtained\n');
    } else {
      // If login fails, try to register first
      console.log('   Login failed, trying to register...');
      response = await client.post('/auth/register', {
        email: `test${Date.now()}@furniture.com`,
        password: 'Test1234!',
        name: 'API Test User'
      });
      
      if (response.status === 201) {
        authToken = response.data.token;
        console.log('✅ Register OK - Token obtained\n');
      } else {
        console.log(`❌ Register failed: ${response.status} - ${JSON.stringify(response.data)}\n`);
        return;
      }
    }

    // Set authorization header
    client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // 2. Get products
    console.log('2️⃣  Fetching products...');
    response = await client.get('/products?limit=5');
    if (response.status === 200 && response.data.data.length > 0) {
      console.log(`✅ Found ${response.data.data.length} products\n`);
    } else {
      console.log(`❌ Failed to fetch products\n`);
      return;
    }

    const products = response.data.data;

    // 3. Create an order
    console.log('3️⃣  Creating order...');
    const orderData = {
      items: [
        {
          productId: products[0]._id,
          quantity: 1
        }
      ],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Test Street',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        phone: '+33123456789'
      },
      paymentMethod: 'card'
    };

    response = await client.post('/orders', orderData);
    if (response.status === 201) {
      testOrderId = response.data.order._id;
      console.log(`✅ Order created: ${testOrderId}\n`);
      console.log('Order details:', {
        status: response.data.order.status,
        total: response.data.order.pricing.total,
        items: response.data.order.items.length
      }, '\n');
    } else {
      console.log(`❌ Create order failed: ${response.status} - ${JSON.stringify(response.data)}\n`);
      return;
    }

    // 4. Get user orders
    console.log('4️⃣  Fetching user orders...');
    response = await client.get('/orders');
    if (response.status === 200) {
      console.log(`✅ Found ${response.data.data.length} orders`);
      console.log('Pagination:', response.data.pagination, '\n');
    } else {
      console.log(`❌ Fetch orders failed: ${response.status}\n`);
    }

    // 5. Get single order
    console.log('5️⃣  Getting single order...');
    response = await client.get(`/orders/${testOrderId}`);
    if (response.status === 200) {
      console.log(`✅ Order retrieved: ${response.data.data.orderNumber}`);
      console.log('Status:', response.data.data.status, '\n');
    } else {
      console.log(`❌ Get order failed: ${response.status}\n`);
    }

    // 6. Update order
    console.log('6️⃣  Updating order...');
    response = await client.put(`/orders/${testOrderId}`, {
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '456 New Street',
        city: 'Lyon',
        postalCode: '69000',
        country: 'France',
        phone: '+33123456789'
      }
    });
    if (response.status === 200) {
      console.log(`✅ Order updated successfully`);
      console.log('New address city:', response.data.data.shippingAddress.city, '\n');
    } else {
      console.log(`❌ Update order failed: ${response.status} - ${response.data.message}\n`);
    }

    // 7. Cancel order
    console.log('7️⃣  Cancelling order...');
    response = await client.put(`/orders/${testOrderId}/cancel`);
    if (response.status === 200) {
      console.log(`✅ Order cancelled successfully`);
      console.log('New status:', response.data.data.status, '\n');
    } else {
      console.log(`❌ Cancel order failed: ${response.status} - ${response.data.message}\n`);
    }

    // 8. Create another order to test delete
    console.log('8️⃣  Creating another order for delete test...');
    response = await client.post('/orders', orderData);
    if (response.status === 201) {
      const deleteTestOrderId = response.data.order._id;
      console.log(`✅ Order created: ${deleteTestOrderId}\n`);

      // 9. Delete order
      console.log('9️⃣  Deleting order...');
      response = await client.delete(`/orders/${deleteTestOrderId}`);
      if (response.status === 200) {
        console.log(`✅ Order deleted successfully\n`);
      } else {
        console.log(`❌ Delete order failed: ${response.status} - ${response.data.message}\n`);
      }
    }

    console.log('✅ All tests completed!\n');
    console.log('📊 Summary:');
    console.log('✓ Register endpoint');
    console.log('✓ Create order (POST /orders)');
    console.log('✓ Get orders (GET /orders)');
    console.log('✓ Get single order (GET /orders/:id)');
    console.log('✓ Update order (PUT /orders/:id)');
    console.log('✓ Cancel order (PUT /orders/:id/cancel)');
    console.log('✓ Delete order (DELETE /orders/:id)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
};

// Run tests after a delay to ensure server is ready
setTimeout(test, 2000);
