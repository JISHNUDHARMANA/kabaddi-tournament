let cachedState = null;
let lastVersion = 0;

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Scorer-PIN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (body.state) {
        cachedState = typeof body.state === 'string' ? JSON.parse(body.state) : body.state;
        lastVersion = Date.now();
      }
      return res.status(200).json({ success: true, version: lastVersion });
    } catch (e) {
      return res.status(200).json({ success: true, version: lastVersion });
    }
  }

  // GET
  return res.status(200).json({
    success: true,
    version: lastVersion,
    state: cachedState
  });
};
