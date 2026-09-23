const axios = require('axios');

async function testFast2SMS() {
  const apiKey = 'isGQMvuBa5n7REXHhVPpqc2jlbK1dJZrkyTNWYF0xeCw9zUtSmWkZRvuUmqsblxyDoOMid4tB6TXFG5c';
  
  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',
        message: 'Your PhoneMail OTP is 123456',
        language: 'english',
        flash: 0,
        numbers: '8349231458'
      },
      {
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testFast2SMS();
