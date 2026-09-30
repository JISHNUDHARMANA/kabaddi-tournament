const defaultFixtures = [
  { id: "fixture_1", matchNumber: 1, stage: "League Match", court: "Mat 1", time: "09:30 AM", date: "Tomorrow", teamA: "Patna Warriors", teamB: "Bengal Tigers", status: "live", scoreA: 0, scoreB: 0 },
  { id: "fixture_2", matchNumber: 2, stage: "League Match", court: "Mat 1", time: "11:00 AM", date: "Tomorrow", teamA: "Mumbai Warriors", teamB: "Bengaluru Bulls", status: "upcoming", scoreA: 0, scoreB: 0 },
  { id: "fixture_3", matchNumber: 3, stage: "League Match", court: "Mat 1", time: "02:00 PM", date: "Tomorrow", teamA: "Jaipur Panthers", teamB: "Tamil Thalas", status: "upcoming", scoreA: 0, scoreB: 0 },
  { id: "fixture_4", matchNumber: 4, stage: "Quarter Final", court: "Mat 1", time: "04:30 PM", date: "Tomorrow", teamA: "Top Qualifier A", teamB: "Top Qualifier B", status: "upcoming", scoreA: 0, scoreB: 0 },
  { id: "fixture_5", matchNumber: 5, stage: "Semi Final", court: "Mat 1", time: "06:30 PM", date: "Tomorrow", teamA: "Semi-Finalist 1", teamB: "Semi-Finalist 2", status: "upcoming", scoreA: 0, scoreB: 0 },
  { id: "fixture_6", matchNumber: 6, stage: "Grand Final", court: "Mat 1", time: "08:15 PM", date: "Tomorrow", teamA: "Finalist 1", teamB: "Finalist 2", status: "upcoming", scoreA: 0, scoreB: 0 }
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json(defaultFixtures);
};
