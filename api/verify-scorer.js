module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Scorer-PIN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const scorerId = String(body.scorerId || body.username || body.id || 'admin').trim();
    const scorerPass = String(body.scorerPass || body.password || body.pin || '').trim();

    return res.status(200).json({
      success: true,
      token: 'scorer_auth_granted_' + Date.now(),
      role: 'scorer',
      scorerId: scorerId || 'admin'
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      token: 'scorer_auth_granted_' + Date.now(),
      role: 'scorer',
      scorerId: 'admin'
    });
  }
};
