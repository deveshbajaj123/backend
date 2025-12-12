const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let token = '';
let albumId = '';

async function runTests() {
  try {
    console.log('🚀 Starting API Tests\n');

    // 1. Health Check
    console.log('1️⃣  Testing Health Check...');
    const healthRes = await axios.get('http://localhost:3000/health');
    console.log('   ✅ Health:', healthRes.data.status);
    console.log('');

    // 2. Register
    console.log('2️⃣  Testing Registration...');
    const email = `test${Date.now()}@example.com`;
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      email,
      password: 'password123',
      name: 'Test User'
    });
    token = registerRes.data.token;
    console.log('   ✅ Registered:', registerRes.data.user.email);
    console.log('   📝 Token:', token.substring(0, 30) + '...');
    console.log('');

    // 3. Login
    console.log('3️⃣  Testing Login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email,
      password: 'password123'
    });
    console.log('   ✅ Login successful');
    console.log('');

    // 4. Get Current User
    console.log('4️⃣  Testing Get Current User...');
    const userRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ User:', userRes.data.user.name);
    console.log('');

    // 5. Create Album
    console.log('5️⃣  Testing Create Album...');
    const albumRes = await axios.post(`${API_URL}/albums`, {
      name: 'Test Album',
      description: 'Created by automated test'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    albumId = albumRes.data.album.id;
    console.log('   ✅ Album created:', albumRes.data.album.name);
    console.log('   📝 Album ID:', albumId);
    console.log('');

    // 6. Get Albums
    console.log('6️⃣  Testing Get Albums...');
    const albumsRes = await axios.get(`${API_URL}/albums`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Found', albumsRes.data.albums.length, 'album(s)');
    console.log('');

    // 7. Get Specific Album
    console.log('7️⃣  Testing Get Specific Album...');
    const oneAlbumRes = await axios.get(`${API_URL}/albums/${albumId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Album:', oneAlbumRes.data.album.name);
    console.log('   📷 Photos in album:', oneAlbumRes.data.album.photos.length);
    console.log('');

    // 8. Update Album
    console.log('8️⃣  Testing Update Album...');
    const updateRes = await axios.put(`${API_URL}/albums/${albumId}`, {
      name: 'Updated Test Album',
      description: 'This album was updated'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Album updated:', updateRes.data.album.name);
    console.log('');

    // 9. Create Share Link
    console.log('9️⃣  Testing Create Share Link...');
    const shareRes = await axios.post(`${API_URL}/shares/albums/${albumId}`, {
      expiresInDays: 7
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const shareToken = shareRes.data.share.share_token;
    console.log('   ✅ Share link created');
    console.log('   🔗 URL:', shareRes.data.share.shareUrl);
    console.log('');

    // 10. Get Shared Album (Public - No Auth)
    console.log('🔟 Testing Get Shared Album (Public)...');
    const sharedRes = await axios.get(`${API_URL}/shares/${shareToken}`);
    console.log('   ✅ Shared album accessible:', sharedRes.data.album.name);
    console.log('');

    // 11. Search Photos (Empty)
    console.log('1️⃣1️⃣  Testing Photo Search...');
    const searchRes = await axios.get(`${API_URL}/photos/search?q=test`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Search completed, found', searchRes.data.count, 'photos');
    console.log('');

    // 12. Get Photos
    console.log('1️⃣2️⃣  Testing Get Photos...');
    const photosRes = await axios.get(`${API_URL}/photos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Photos retrieved:', photosRes.data.photos.length);
    console.log('');

    console.log('✨ ALL TESTS PASSED! ✨\n');
    console.log('📊 Test Summary:');
    console.log('   ✅ 12/12 tests passed');
    console.log('   🔑 Auth token:', token.substring(0, 30) + '...');
    console.log('   📁 Album ID:', albumId);
    console.log('   🔗 Share token:', shareToken);
    console.log('\n🎉 Your backend is fully functional!\n');

  } catch (error) {
    console.error('\n❌ Test Failed!\n');
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('URL:', error.config?.url);
      console.error('Method:', error.config?.method?.toUpperCase());
    }
    process.exit(1);
  }
}

// Run the tests
runTests();