const defaultStandings = [
  { rank: 1, team: "Patna Warriors", played: 4, won: 3, lost: 1, tied: 0, scoreDiff: "+24", points: 15, form: ["W", "W", "L", "W"] },
  { rank: 2, team: "Bengal Tigers", played: 4, won: 3, lost: 1, tied: 0, scoreDiff: "+18", points: 15, form: ["W", "L", "W", "W"] },
  { rank: 3, team: "Jaipur Panthers", played: 4, won: 2, lost: 2, tied: 0, scoreDiff: "+6", points: 10, form: ["L", "W", "W", "L"] },
  { rank: 4, team: "Bengaluru Bulls", played: 4, won: 2, lost: 2, tied: 0, scoreDiff: "-4", points: 10, form: ["W", "L", "L", "W"] },
  { rank: 5, team: "Mumbai Warriors", played: 4, won: 1, lost: 3, tied: 0, scoreDiff: "-16", points: 5, form: ["L", "W", "L", "L"] },
  { rank: 6, team: "Tamil Thalas", played: 4, won: 1, lost: 3, tied: 0, scoreDiff: "-28", points: 5, form: ["L", "L", "W", "L"] }
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json(defaultStandings);
};
