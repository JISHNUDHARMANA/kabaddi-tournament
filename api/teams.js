const defaultTeams = [
  {
    name: "Patna Warriors",
    city: "Patna",
    color: "#FF6B00",
    captain: "Sachin Tanwar",
    coach: "Ram Mehar Singh",
    players: [
      { jersey: "1", name: "Sachin Tanwar", role: "Raider", isCaptain: true },
      { jersey: "2", name: "Manjeet Dahiya", role: "Raider" },
      { jersey: "3", name: "Neeraj Kumar", role: "Defender" },
      { jersey: "4", name: "Sunil Kumar", role: "Defender" },
      { jersey: "5", name: "Mohit Goyat", role: "All-Rounder" },
      { jersey: "6", name: "Sajin C.", role: "Defender" },
      { jersey: "7", name: "Shubham Shinde", role: "Defender" }
    ],
    substitutes: [
      { jersey: "21", name: "Rohit Gulia", role: "Raider" },
      { jersey: "22", name: "Monu Goyat", role: "Raider" },
      { jersey: "24", name: "Vikas Jaglan", role: "All-Rounder" }
    ]
  },
  {
    name: "Bengal Tigers",
    city: "Kolkata",
    color: "#00B4D8",
    captain: "Maninder Singh",
    coach: "K. Baskaran",
    players: [
      { jersey: "9", name: "Maninder Singh", role: "Raider", isCaptain: true },
      { jersey: "10", name: "Shrikant Jadhav", role: "Raider" },
      { jersey: "11", name: "Vaibhav Garje", role: "Defender" },
      { jersey: "12", name: "Jaskirat Singh", role: "Defender" },
      { jersey: "13", name: "Nitin Rawal", role: "All-Rounder" },
      { jersey: "14", name: "Darshan J.", role: "Defender" },
      { jersey: "15", name: "Shubham Kumar", role: "Defender" }
    ],
    substitutes: [
      { jersey: "25", name: "Akshay Kumar", role: "Defender" },
      { jersey: "27", name: "Suyog Gaikar", role: "Raider" },
      { jersey: "29", name: "Hem Raj", role: "All-Rounder" }
    ]
  }
];

let cachedTeams = null;

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (body.teams) {
        cachedTeams = body.teams;
      }
      return res.status(200).json({ success: true, count: cachedTeams ? cachedTeams.length : 0 });
    } catch (e) {
      return res.status(200).json({ success: true });
    }
  }

  return res.status(200).json(cachedTeams || defaultTeams);
};
