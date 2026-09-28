const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// Cloudflare Turnstile verification
// --------------------------------------------------

async function verifyTurnstile(token, remoteIp) {
  if (!token) {
    return {
      success: false,
      error: 'Turnstile token is missing'
    };
  }

  try {
    const params = new URLSearchParams();

    params.append(
      'secret',
      process.env.TURNSTILE_SECRET_KEY
    );

    params.append('response', token);

    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      }
    );

    const result = await response.json();

    console.log('Turnstile verification:', result);

    return result;
  } catch (error) {
    console.error(
      'Turnstile verification error:',
      error
    );

    return {
      success: false,
      error: 'Turnstile verification request failed'
    };
  }
}

// --------------------------------------------------
// API 1
// --------------------------------------------------

app.post('/api/charges', async (req, res) => {
  try {
    console.log('here')
    const { turnstileToken, ...payload } = req.body;

    // Verify Turnstile
    const turnstileResult = await verifyTurnstile(
      turnstileToken,
      req.ip
    );

    if (!turnstileResult.success) {
      return res.status(403).json({
        success: false,
        error: 'Turnstile verification failed',
        details: turnstileResult['error-codes'] || []
      });
    }

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxODQyMyIsImp0aSI6ImZlMDU0ZDcyOWUzNzIyNGM4NzBlY2NhMTE1ZWQ0ZDM2Yzg1NGM5NjNiZDVhMjY4YjczYzk1OTMwODkxY2JiY2I1NGQzNzYxMGUyYWM5ZTBiIiwiaWF0IjoxNzIyNjI1NDc3LCJuYmYiOjE3MjI2MjU0NzcsImV4cCI6MTg4MDMwNTQ3Nywic3ViIjoiMzkyOTMiLCJzY29wZXMiOiIqIn0.V45p8IHE5SUyJoawaGLn0H2nTkkfSXGShN_NC1iZWo8xWdmZ-BaX7YKOT4rMs-3zVH_zjRFso2Pv1VTYaesysziFgiFeWpRZudITaoWmvtZuAl8SbwCJMsEw97Uat70nrgmNTLjMyeoFOwpugwdTeg4nLGA3CAgz1VoadmWKU_Y0T2WuX56gkcHrsFeNqqvvpTltlOSe71KKBwQJGPJGlKZLokrNMifPv7gxBSn-TxJu-gY4w2Xv6nsEm5UYqva8SSdzy6Wn_FeiUDJrZ0qfSvATqHQL-x_w-4w6aumbcXhhkAnchxP7ouXeiBHwQgaAo-PB6jHNV65tVG_uWMugocn_QRoGd3SLLiTG9lbV5EbZpSHAxrqmo_y0QjhzUQ28gz1Wg6HpZEDWfWpYAx6xVwe-bBOL_UxvXeZYWUg6XiAi2ZqXCvRxQrV8X25nGnBytgqw1vvPFguxABZyHG7H02sgzS24Xnxvste0hy1vPykFAwmG1IoE9veIyzfyK6pAcLTJLmy2gZLDhxlRZCmRCnwnZoShGPHnIXk06lXOGfzhQkZORwLUKeU2mNLlUyOc-gf90qITI3pTW1iyZC51zFxK3thzj9xKJMPbFgkQhdEJwztU9--yZO_t1wS36oNPgxDd73AwBE8pAg4BQpLoZMTlflYVkgQgLBh0Bdk8Xtw'
    };
    
    const formBody = Object.keys(payload)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(payload[key]))
      .join('&');

    // Call your external API
    const apiResponse = await fetch(
      'https://api.payarc.net/v1/charges',
      {
        headers,
        method: 'POST',
        body: formBody
      }
    );

    if (!apiResponse.ok) {
      console.error(
        'charges api returned:',
        apiResponse.status
      );

      return res.status(502).json({
        success: false,
        error: 'External API request failed'
      });
    }

    const data = await apiResponse.json();

    // Send external API response to React
    return res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('charges api error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// --------------------------------------------------
// API 2
// --------------------------------------------------

app.post('/api/tokens', async (req, res) => {
  try {
    console.log('started')
    const { turnstileToken, ...payload } = req.body;

    // Verify Turnstile
    const turnstileResult = await verifyTurnstile(
      turnstileToken,
      req.ip
    );

    if (!turnstileResult.success) {
      return res.status(403).json({
        success: false,
        error: 'Turnstile verification failed',
        details: turnstileResult['error-codes'] || []
      });
    }


    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxODQyMyIsImp0aSI6ImZlMDU0ZDcyOWUzNzIyNGM4NzBlY2NhMTE1ZWQ0ZDM2Yzg1NGM5NjNiZDVhMjY4YjczYzk1OTMwODkxY2JiY2I1NGQzNzYxMGUyYWM5ZTBiIiwiaWF0IjoxNzIyNjI1NDc3LCJuYmYiOjE3MjI2MjU0NzcsImV4cCI6MTg4MDMwNTQ3Nywic3ViIjoiMzkyOTMiLCJzY29wZXMiOiIqIn0.V45p8IHE5SUyJoawaGLn0H2nTkkfSXGShN_NC1iZWo8xWdmZ-BaX7YKOT4rMs-3zVH_zjRFso2Pv1VTYaesysziFgiFeWpRZudITaoWmvtZuAl8SbwCJMsEw97Uat70nrgmNTLjMyeoFOwpugwdTeg4nLGA3CAgz1VoadmWKU_Y0T2WuX56gkcHrsFeNqqvvpTltlOSe71KKBwQJGPJGlKZLokrNMifPv7gxBSn-TxJu-gY4w2Xv6nsEm5UYqva8SSdzy6Wn_FeiUDJrZ0qfSvATqHQL-x_w-4w6aumbcXhhkAnchxP7ouXeiBHwQgaAo-PB6jHNV65tVG_uWMugocn_QRoGd3SLLiTG9lbV5EbZpSHAxrqmo_y0QjhzUQ28gz1Wg6HpZEDWfWpYAx6xVwe-bBOL_UxvXeZYWUg6XiAi2ZqXCvRxQrV8X25nGnBytgqw1vvPFguxABZyHG7H02sgzS24Xnxvste0hy1vPykFAwmG1IoE9veIyzfyK6pAcLTJLmy2gZLDhxlRZCmRCnwnZoShGPHnIXk06lXOGfzhQkZORwLUKeU2mNLlUyOc-gf90qITI3pTW1iyZC51zFxK3thzj9xKJMPbFgkQhdEJwztU9--yZO_t1wS36oNPgxDd73AwBE8pAg4BQpLoZMTlflYVkgQgLBh0Bdk8Xtw'
    };

    const formBody = Object.keys(payload)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(payload[key]))
      .join('&');

    // Call your external API
    const apiResponse = await fetch(
      'https://api.payarc.net/v1/tokens',
      {
        headers,
        method: 'POST',
        body: formBody
      }
    );

   // Read response regardless of status 
   const responseText = await apiResponse.text()
    console.log('Payarc status:', apiResponse.status)
    console.log('Payarc response:', responseText)
    // Return SAME status and SAME response res.status(apiResponse.status)
    const contentType = apiResponse.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
     try { return res.json(JSON.parse(responseText)); } 
     catch { return res.send(responseText); }
    }
    
    return res.send(responseText);

  } catch (error) {
    console.error('tokens api error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running'
  });
});

// --------------------------------------------------
// Serve React build
// --------------------------------------------------

const buildPath = path.join(__dirname, 'frontend', 'build');

app.use(express.static(buildPath));

app.get('/{*splat}', (req, res) => { console.log('here2'); res.sendFile( path.join(buildPath, 'index.html') ); });

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );

  console.log(
    `http://localhost:${PORT}`
  );
});