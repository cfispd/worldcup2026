// ═══════════════════════════════════════════════════════════
//  DATA  —  all raw constants, tables, and match records
//  No functions here. All helpers live in helpers.js.
// ═══════════════════════════════════════════════════════════

// ── 1. Visual constants ───────────────────────────────────

const FLAGS = {
  'Mexico':'mx','South Korea':'kr','South Africa':'za','Czech Republic':'cz',
  'Canada':'ca','Switzerland':'ch','Qatar':'qa','Bosnia-Herzegovina':'ba',
  'Brazil':'br','Morocco':'ma','Scotland':'gb-sct','Haiti':'ht',
  'United States':'us','Paraguay':'py','Australia':'au','Turkey':'tr',
  'Germany':'de','Ecuador':'ec','Ivory Coast':'ci','Curaçao':'cw',
  'Netherlands':'nl','Japan':'jp','Sweden':'se','Tunisia':'tn',
  'Belgium':'be','Iran':'ir','Egypt':'eg','New Zealand':'nz',
  'Spain':'es','Uruguay':'uy','Saudi Arabia':'sa','Cape Verde':'cv',
  'France':'fr','Senegal':'sn','Norway':'no','Iraq':'iq',
  'Argentina':'ar','Austria':'at','Algeria':'dz','Jordan':'jo',
  'Portugal':'pt','Colombia':'co','Uzbekistan':'uz','DR Congo':'cd',
  'England':'gb-eng','Croatia':'hr','Panama':'pa','Ghana':'gh',
};

const GROUP_ACCENT = {
  A:'#b71c1c',B:'#e65100',C:'#1b5e20',D:'#0d47a1',
  E:'#4a148c',F:'#006064',G:'#880e4f',H:'#33691e',
  I:'#1a237e',J:'#bf360c',K:'#37474f',L:'#004d40',
};

const ROUND_ACCENT = {
  R32:'#1565c0', R16:'#6a1b9a', QF:'#b71c1c',
  SF:'#e65100',  Final:'#f57f17', '3rd':'#455a64',
};

const ROUND_LABEL = {
  R32:'Round of 32', R16:'Round of 16', QF:'Quarter-Final',
  SF:'Semi-Final',   Final:'Final',     '3rd':'3rd Place',
};

// ── 2. Calendar labels ────────────────────────────────────

const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── 3. City & venue data ──────────────────────────────────

const CITY_GROUPS = [
  { country:'Mexico',        flag:'mx', cities:['Guadalajara','Mexico City','Monterrey'] },
  { country:'United States', flag:'us', cities:['Atlanta','Boston','Dallas','Houston','Kansas City','Los Angeles','Miami','New York/NJ','Philadelphia','San Francisco','Seattle'] },
  { country:'Canada',        flag:'ca', cities:['Toronto','Vancouver'] },
];

// City → nearest airport IATA code
const CITY_IATA = {
  'Atlanta':'ATL','Boston':'BOS','Dallas':'DFW','Houston':'IAH',
  'Kansas City':'MCI','Los Angeles':'LAX','Miami':'MIA','New York/NJ':'EWR',
  'Philadelphia':'PHL','San Francisco':'SFO','Seattle':'SEA',
  'Toronto':'YYZ','Vancouver':'YVR',
  'Guadalajara':'GDL','Mexico City':'MEX','Monterrey':'MTY',
};

// Offset from ET to venue local time (group stage times are stored in ET)
const CITY_TZ_OFFSET = {
  Atlanta:0, Boston:0, Miami:0, 'New York/NJ':0, Philadelphia:0, Toronto:0,
  Dallas:-1, Houston:-1, 'Kansas City':-1, Guadalajara:-1, 'Mexico City':-1, Monterrey:-1,
  'Los Angeles':-3, 'San Francisco':-3, Seattle:-3, Vancouver:-3,
};

// Stadium GPS coordinates — used for hotel search (Booking.com map-based)
const VENUE_COORDS = {
  'Estadio Azteca':          { lat: 19.3026,  lng: -99.1507  },
  'Estadio Akron':           { lat: 20.6696,  lng: -103.3967 },
  'Estadio BBVA':            { lat: 25.6694,  lng: -100.2432 },
  'Mercedes-Benz Stadium':   { lat: 33.7555,  lng: -84.4010  },
  'Gillette Stadium':        { lat: 42.0909,  lng: -71.2643  },
  'AT&T Stadium':            { lat: 32.7480,  lng: -97.0929  },
  'NRG Stadium':             { lat: 29.6847,  lng: -95.4107  },
  'Arrowhead Stadium':       { lat: 39.0489,  lng: -94.4839  },
  'SoFi Stadium':            { lat: 33.9535,  lng: -118.3392 },
  'Hard Rock Stadium':       { lat: 25.9580,  lng: -80.2389  },
  'MetLife Stadium':         { lat: 40.8135,  lng: -74.0745  },
  'Lincoln Financial Field': { lat: 39.9009,  lng: -75.1675  },
  "Levi's Stadium":          { lat: 37.4033,  lng: -121.9694 },
  'Lumen Field':             { lat: 47.5952,  lng: -122.3316 },
  'BMO Field':               { lat: 43.6333,  lng: -79.4181  },
  'BC Place':                { lat: 49.2767,  lng: -123.1118 },
};

// Derived: city → host country  (built from CITY_GROUPS)
const CITY_COUNTRY = {};
CITY_GROUPS.forEach(g => g.cities.forEach(c => { CITY_COUNTRY[c] = g.country; }));

// ── 4. Language state & translation tables ────────────────

let LANG = localStorage.getItem('wc_lang') || 'en';

const TEAM_NAMES_ZH = {
  'Mexico':'墨西哥','South Korea':'韩国','South Africa':'南非',
  'Czech Republic':'捷克','Canada':'加拿大','Switzerland':'瑞士',
  'Qatar':'卡塔尔','Bosnia-Herzegovina':'波黑','Brazil':'巴西',
  'Morocco':'摩洛哥','Scotland':'苏格兰','Haiti':'海地',
  'United States':'美国','Paraguay':'巴拉圭','Australia':'澳大利亚',
  'Turkey':'土耳其','Germany':'德国','Ecuador':'厄瓜多尔',
  'Ivory Coast':'科特迪瓦','Curaçao':'库拉索','Netherlands':'荷兰',
  'Japan':'日本','Sweden':'瑞典','Tunisia':'突尼斯',
  'Belgium':'比利时','Iran':'伊朗','Egypt':'埃及','New Zealand':'新西兰',
  'Spain':'西班牙','Uruguay':'乌拉圭','Saudi Arabia':'沙特阿拉伯',
  'Cape Verde':'佛得角','France':'法国','Senegal':'塞内加尔',
  'Norway':'挪威','Iraq':'伊拉克','Argentina':'阿根廷',
  'Austria':'奥地利','Algeria':'阿尔及利亚','Jordan':'约旦',
  'Portugal':'葡萄牙','Colombia':'哥伦比亚','Uzbekistan':'乌兹别克斯坦',
  'DR Congo':'刚果民主共和国','England':'英格兰','Croatia':'克罗地亚',
  'Panama':'巴拿马','Ghana':'加纳',
};

const CITY_NAMES_ZH = {
  'Guadalajara':'瓜达拉哈拉','Mexico City':'墨西哥城','Monterrey':'蒙特雷',
  'Atlanta':'亚特兰大','Boston':'波士顿','Dallas':'达拉斯',
  'Houston':'休斯顿','Kansas City':'堪萨斯城','Los Angeles':'洛杉矶',
  'Miami':'迈阿密','New York/NJ':'纽约/新泽西','Philadelphia':'费城',
  'San Francisco':'旧金山','Seattle':'西雅图','Toronto':'多伦多',
  'Vancouver':'温哥华',
};

const COUNTRY_NAMES_ZH = {
  'Mexico':'墨西哥','United States':'美国','Canada':'加拿大',
};

const ROUND_LABEL_ZH = {
  R32:'32强', R16:'16强', QF:'四分之一决赛',
  SF:'半决赛', Final:'决赛', '3rd':'季军赛',
};

const WEEKDAYS_ZH = ['日','一','二','三','四','五','六'];

// ── 5. Affiliate settings ─────────────────────────────────

// Replace YOUR_CAMREF with your Partnerize camref once approved
const STUBHUB_CAMREF = 'YOUR_CAMREF';

// Trip.com affiliate tracking params
const TRIP_AFFILIATE = 'Allianceid=8410774&SID=315981072&trip_sub1=';

// Ticket price floor by round (USD)
const TICKET_FROM = { Final:900, SF:500, QF:350, R16:200, R32:150, '3rd':300 };

// Direct StubHub event URLs — key: "home|away|dateISO"
const STUBHUB_EVENT_URLS = {
  'Belgium|Egypt|2026-06-15': 'https://www.stubhub.com/world-cup-seattle-tickets-6-15-2026/event/153020522/',
};

// ── 6. Seed / draw order per group ────────────────────────
// Used as last-resort tiebreaker when all points/GD/GF are equal.
const GROUP_SEED_ORDER = {
  A: ['Mexico','South Korea','South Africa','Czech Republic'],
  B: ['Canada','Switzerland','Qatar','Bosnia-Herzegovina'],
  C: ['Brazil','Morocco','Scotland','Haiti'],
  D: ['United States','Paraguay','Australia','Turkey'],
  E: ['Germany','Ecuador','Ivory Coast','Curaçao'],
  F: ['Netherlands','Japan','Sweden','Tunisia'],
  G: ['Belgium','Iran','Egypt','New Zealand'],
  H: ['Spain','Uruguay','Saudi Arabia','Cape Verde'],
  I: ['France','Senegal','Norway','Iraq'],
  J: ['Argentina','Austria','Algeria','Jordan'],
  K: ['Portugal','Colombia','Uzbekistan','DR Congo'],
  L: ['England','Croatia','Panama','Ghana'],
};

// ── 7. Match data  (group stage + knockout, 104 matches) ──

const ALL_MATCHES = [
  // ── Group Stage ───────────────────────────────────────────
  // Group A
  {group:'A',home:'Mexico',          away:'South Africa',       dateISO:'2026-06-11',time:'3:00 PM', venue:'Estadio Azteca, Mexico City'},
  {group:'A',home:'South Korea',     away:'Czech Republic',     dateISO:'2026-06-11',time:'10:00 PM',venue:'Estadio Akron, Guadalajara'},
  {group:'A',home:'Czech Republic',  away:'South Africa',       dateISO:'2026-06-18',time:'12:00 PM',venue:'Mercedes-Benz Stadium, Atlanta'},
  {group:'A',home:'Mexico',          away:'South Korea',        dateISO:'2026-06-18',time:'9:00 PM', venue:'Estadio Akron, Guadalajara'},
  {group:'A',home:'Czech Republic',  away:'Mexico',             dateISO:'2026-06-24',time:'9:00 PM', venue:'Estadio Azteca, Mexico City'},
  {group:'A',home:'South Africa',    away:'South Korea',        dateISO:'2026-06-24',time:'9:00 PM', venue:'Estadio BBVA, Monterrey'},
  // Group B
  {group:'B',home:'Canada',             away:'Bosnia-Herzegovina', dateISO:'2026-06-12',time:'3:00 PM', venue:'BMO Field, Toronto'},
  {group:'B',home:'Qatar',              away:'Switzerland',        dateISO:'2026-06-13',time:'3:00 PM', venue:"Levi's Stadium, San Francisco"},
  {group:'B',home:'Switzerland',        away:'Bosnia-Herzegovina', dateISO:'2026-06-18',time:'3:00 PM', venue:'SoFi Stadium, Los Angeles'},
  {group:'B',home:'Canada',             away:'Qatar',              dateISO:'2026-06-18',time:'6:00 PM', venue:'BC Place, Vancouver'},
  {group:'B',home:'Switzerland',        away:'Canada',             dateISO:'2026-06-24',time:'3:00 PM', venue:'BC Place, Vancouver'},
  {group:'B',home:'Bosnia-Herzegovina', away:'Qatar',              dateISO:'2026-06-24',time:'3:00 PM', venue:'Lumen Field, Seattle'},
  // Group C
  {group:'C',home:'Brazil',   away:'Morocco',  dateISO:'2026-06-13',time:'6:00 PM', venue:'MetLife Stadium, New York/NJ'},
  {group:'C',home:'Haiti',    away:'Scotland', dateISO:'2026-06-13',time:'9:00 PM', venue:'Gillette Stadium, Boston'},
  {group:'C',home:'Scotland', away:'Morocco',  dateISO:'2026-06-19',time:'6:00 PM', venue:'Gillette Stadium, Boston'},
  {group:'C',home:'Brazil',   away:'Haiti',    dateISO:'2026-06-19',time:'9:00 PM', venue:'Lincoln Financial Field, Philadelphia'},
  {group:'C',home:'Scotland', away:'Brazil',   dateISO:'2026-06-24',time:'6:00 PM', venue:'Hard Rock Stadium, Miami'},
  {group:'C',home:'Morocco',  away:'Haiti',    dateISO:'2026-06-24',time:'6:00 PM', venue:'Mercedes-Benz Stadium, Atlanta'},
  // Group D
  {group:'D',home:'United States', away:'Paraguay',      dateISO:'2026-06-12',time:'9:00 PM',  venue:'SoFi Stadium, Los Angeles'},
  {group:'D',home:'Australia',     away:'Turkey',        dateISO:'2026-06-13',time:'9:00 PM',  venue:'BC Place, Vancouver'},
  {group:'D',home:'United States', away:'Australia',     dateISO:'2026-06-19',time:'3:00 PM',  venue:'Lumen Field, Seattle'},
  {group:'D',home:'Turkey',        away:'Paraguay',      dateISO:'2026-06-19',time:'12:00 AM', venue:"Levi's Stadium, San Francisco"},
  {group:'D',home:'Turkey',        away:'United States', dateISO:'2026-06-25',time:'10:00 PM', venue:'SoFi Stadium, Los Angeles'},
  {group:'D',home:'Paraguay',      away:'Australia',     dateISO:'2026-06-25',time:'10:00 PM', venue:"Levi's Stadium, San Francisco"},
  // Group E
  {group:'E',home:'Germany',     away:'Curaçao',     dateISO:'2026-06-14',time:'1:00 PM', venue:'NRG Stadium, Houston'},
  {group:'E',home:'Ivory Coast', away:'Ecuador',     dateISO:'2026-06-14',time:'7:00 PM', venue:'Lincoln Financial Field, Philadelphia'},
  {group:'E',home:'Germany',     away:'Ivory Coast', dateISO:'2026-06-20',time:'4:00 PM', venue:'BMO Field, Toronto'},
  {group:'E',home:'Ecuador',     away:'Curaçao',     dateISO:'2026-06-20',time:'8:00 PM', venue:'Arrowhead Stadium, Kansas City'},
  {group:'E',home:'Ecuador',     away:'Germany',     dateISO:'2026-06-25',time:'4:00 PM', venue:'MetLife Stadium, New York/NJ'},
  {group:'E',home:'Curaçao',     away:'Ivory Coast', dateISO:'2026-06-25',time:'4:00 PM', venue:'Lincoln Financial Field, Philadelphia'},
  // Group F
  {group:'F',home:'Netherlands', away:'Japan',        dateISO:'2026-06-14',time:'4:00 PM',  venue:'AT&T Stadium, Dallas'},
  {group:'F',home:'Sweden',      away:'Tunisia',      dateISO:'2026-06-14',time:'10:00 PM', venue:'Estadio BBVA, Monterrey'},
  {group:'F',home:'Netherlands', away:'Sweden',       dateISO:'2026-06-20',time:'1:00 PM',  venue:'NRG Stadium, Houston'},
  {group:'F',home:'Tunisia',     away:'Japan',        dateISO:'2026-06-20',time:'12:00 AM', venue:'Estadio BBVA, Monterrey'},
  {group:'F',home:'Japan',       away:'Sweden',       dateISO:'2026-06-25',time:'7:00 PM',  venue:'AT&T Stadium, Dallas'},
  {group:'F',home:'Tunisia',     away:'Netherlands',  dateISO:'2026-06-25',time:'7:00 PM',  venue:'Arrowhead Stadium, Kansas City'},
  // Group G
  {group:'G',home:'Belgium',     away:'Egypt',       dateISO:'2026-06-15',time:'3:00 PM',  venue:'BC Place, Vancouver'},
  {group:'G',home:'Iran',        away:'New Zealand', dateISO:'2026-06-15',time:'9:00 PM',  venue:'SoFi Stadium, Los Angeles'},
  {group:'G',home:'New Zealand', away:'Egypt',       dateISO:'2026-06-21',time:'9:00 PM',  venue:'BC Place, Vancouver'},
  {group:'G',home:'Belgium',     away:'Iran',        dateISO:'2026-06-21',time:'3:00 PM',  venue:'SoFi Stadium, Los Angeles'},
  {group:'G',home:'Egypt',       away:'Iran',        dateISO:'2026-06-26',time:'11:00 PM', venue:'Lumen Field, Seattle'},
  {group:'G',home:'New Zealand', away:'Belgium',     dateISO:'2026-06-26',time:'11:00 PM', venue:'BC Place, Vancouver'},
  // Group H
  {group:'H',home:'Spain',        away:'Cape Verde',   dateISO:'2026-06-15',time:'12:00 PM', venue:'Mercedes-Benz Stadium, Atlanta'},
  {group:'H',home:'Saudi Arabia', away:'Uruguay',      dateISO:'2026-06-15',time:'6:00 PM',  venue:'Hard Rock Stadium, Miami'},
  {group:'H',home:'Spain',        away:'Saudi Arabia', dateISO:'2026-06-21',time:'12:00 PM', venue:'Mercedes-Benz Stadium, Atlanta'},
  {group:'H',home:'Uruguay',      away:'Cape Verde',   dateISO:'2026-06-21',time:'6:00 PM',  venue:'Hard Rock Stadium, Miami'},
  {group:'H',home:'Cape Verde',   away:'Saudi Arabia', dateISO:'2026-06-26',time:'8:00 PM',  venue:'NRG Stadium, Houston'},
  {group:'H',home:'Uruguay',      away:'Spain',        dateISO:'2026-06-26',time:'8:00 PM',  venue:'Estadio Akron, Guadalajara'},
  // Group I
  {group:'I',home:'France',  away:'Senegal', dateISO:'2026-06-16',time:'3:00 PM', venue:'MetLife Stadium, New York/NJ'},
  {group:'I',home:'Iraq',    away:'Norway',  dateISO:'2026-06-16',time:'6:00 PM', venue:'Gillette Stadium, Boston'},
  {group:'I',home:'Norway',  away:'Senegal', dateISO:'2026-06-22',time:'8:00 PM', venue:'MetLife Stadium, New York/NJ'},
  {group:'I',home:'France',  away:'Iraq',    dateISO:'2026-06-22',time:'5:00 PM', venue:'Lincoln Financial Field, Philadelphia'},
  {group:'I',home:'Norway',  away:'France',  dateISO:'2026-06-26',time:'3:00 PM', venue:'Gillette Stadium, Boston'},
  {group:'I',home:'Senegal', away:'Iraq',    dateISO:'2026-06-26',time:'3:00 PM', venue:'BMO Field, Toronto'},
  // Group J
  {group:'J',home:'Argentina', away:'Algeria',   dateISO:'2026-06-16',time:'9:00 PM',  venue:'Arrowhead Stadium, Kansas City'},
  {group:'J',home:'Austria',   away:'Jordan',    dateISO:'2026-06-16',time:'12:00 AM', venue:"Levi's Stadium, San Francisco"},
  {group:'J',home:'Argentina', away:'Austria',   dateISO:'2026-06-22',time:'1:00 PM',  venue:'AT&T Stadium, Dallas'},
  {group:'J',home:'Jordan',    away:'Algeria',   dateISO:'2026-06-22',time:'11:00 PM', venue:"Levi's Stadium, San Francisco"},
  {group:'J',home:'Algeria',   away:'Austria',   dateISO:'2026-06-27',time:'10:00 PM', venue:'Arrowhead Stadium, Kansas City'},
  {group:'J',home:'Jordan',    away:'Argentina', dateISO:'2026-06-27',time:'10:00 PM', venue:'AT&T Stadium, Dallas'},
  // Group K
  {group:'K',home:'Portugal',   away:'DR Congo',   dateISO:'2026-06-17',time:'1:00 PM',  venue:'NRG Stadium, Houston'},
  {group:'K',home:'Uzbekistan', away:'Colombia',   dateISO:'2026-06-17',time:'10:00 PM', venue:'Estadio Azteca, Mexico City'},
  {group:'K',home:'Portugal',   away:'Uzbekistan', dateISO:'2026-06-23',time:'1:00 PM',  venue:'NRG Stadium, Houston'},
  {group:'K',home:'Colombia',   away:'DR Congo',   dateISO:'2026-06-23',time:'10:00 PM', venue:'Estadio Akron, Guadalajara'},
  {group:'K',home:'Colombia',   away:'Portugal',   dateISO:'2026-06-27',time:'7:30 PM',  venue:'Hard Rock Stadium, Miami'},
  {group:'K',home:'DR Congo',   away:'Uzbekistan', dateISO:'2026-06-27',time:'7:30 PM',  venue:'Mercedes-Benz Stadium, Atlanta'},
  // Group L
  {group:'L',home:'England', away:'Croatia', dateISO:'2026-06-17',time:'4:00 PM', venue:'AT&T Stadium, Dallas'},
  {group:'L',home:'Ghana',   away:'Panama',  dateISO:'2026-06-17',time:'7:00 PM', venue:'BMO Field, Toronto'},
  {group:'L',home:'England', away:'Ghana',   dateISO:'2026-06-23',time:'4:00 PM', venue:'Gillette Stadium, Boston'},
  {group:'L',home:'Panama',  away:'Croatia', dateISO:'2026-06-23',time:'7:00 PM', venue:'BMO Field, Toronto'},
  {group:'L',home:'Panama',  away:'England', dateISO:'2026-06-27',time:'5:00 PM', venue:'MetLife Stadium, New York/NJ'},
  {group:'L',home:'Croatia', away:'Ghana',   dateISO:'2026-06-27',time:'5:00 PM', venue:'Lincoln Financial Field, Philadelphia'},

  // ── Knockout Stage ────────────────────────────────────────
  // Round of 32
  {round:'R32',matchNum:73, home:'2nd Group A',    away:'2nd Group B',        dateISO:'2026-06-28',time:'12:00 PM', venue:'SoFi Stadium, Los Angeles'},
  {round:'R32',matchNum:74, home:'1st Group E',    away:'3rd Grp A/B/C/D/F',  dateISO:'2026-06-29',time:'4:30 PM',  venue:'Gillette Stadium, Boston'},
  {round:'R32',matchNum:75, home:'1st Group F',    away:'2nd Group C',        dateISO:'2026-06-29',time:'7:00 PM',  venue:'Estadio BBVA, Monterrey'},
  {round:'R32',matchNum:76, home:'1st Group C',    away:'2nd Group F',        dateISO:'2026-06-29',time:'12:00 PM', venue:'NRG Stadium, Houston'},
  {round:'R32',matchNum:77, home:'1st Group I',    away:'3rd Grp C/D/F/G/H',  dateISO:'2026-06-30',time:'5:00 PM',  venue:'MetLife Stadium, New York/NJ'},
  {round:'R32',matchNum:78, home:'2nd Group E',    away:'2nd Group I',        dateISO:'2026-06-30',time:'12:00 PM', venue:'AT&T Stadium, Dallas'},
  {round:'R32',matchNum:79, home:'1st Group A',    away:'3rd Grp C/E/F/H/I',  dateISO:'2026-06-30',time:'7:00 PM',  venue:'Estadio Azteca, Mexico City'},
  {round:'R32',matchNum:80, home:'1st Group L',    away:'3rd Grp E/H/I/J/K',  dateISO:'2026-07-01',time:'12:00 PM', venue:'Mercedes-Benz Stadium, Atlanta'},
  {round:'R32',matchNum:81, home:'1st Group D',    away:'3rd Grp B/E/F/I/J',  dateISO:'2026-07-01',time:'1:00 PM',  venue:"Levi's Stadium, San Francisco"},
  {round:'R32',matchNum:82, home:'1st Group G',    away:'3rd Grp A/E/H/I/J',  dateISO:'2026-07-01',time:'1:00 PM',  venue:'Lumen Field, Seattle'},
  {round:'R32',matchNum:83, home:'2nd Group K',    away:'2nd Group L',        dateISO:'2026-07-02',time:'7:00 PM',  venue:'BMO Field, Toronto'},
  {round:'R32',matchNum:84, home:'1st Group H',    away:'2nd Group J',        dateISO:'2026-07-02',time:'12:00 PM', venue:'SoFi Stadium, Los Angeles'},
  {round:'R32',matchNum:85, home:'1st Group B',    away:'3rd Grp E/F/G/I/J',  dateISO:'2026-07-02',time:'8:00 PM',  venue:'BC Place, Vancouver'},
  {round:'R32',matchNum:86, home:'1st Group J',    away:'2nd Group H',        dateISO:'2026-07-03',time:'6:00 PM',  venue:'Hard Rock Stadium, Miami'},
  {round:'R32',matchNum:87, home:'1st Group K',    away:'3rd Grp D/E/I/J/L',  dateISO:'2026-07-03',time:'8:30 PM',  venue:'Arrowhead Stadium, Kansas City'},
  {round:'R32',matchNum:88, home:'2nd Group D',    away:'2nd Group G',        dateISO:'2026-07-03',time:'1:00 PM',  venue:'AT&T Stadium, Dallas'},
  // Round of 16
  {round:'R16',matchNum:89, home:'W Match 74',away:'W Match 77', dateISO:'2026-07-04',time:'5:00 PM',  venue:'Lincoln Financial Field, Philadelphia'},
  {round:'R16',matchNum:90, home:'W Match 73',away:'W Match 75', dateISO:'2026-07-04',time:'12:00 PM', venue:'NRG Stadium, Houston'},
  {round:'R16',matchNum:91, home:'W Match 76',away:'W Match 78', dateISO:'2026-07-05',time:'4:00 PM',  venue:'MetLife Stadium, New York/NJ'},
  {round:'R16',matchNum:92, home:'W Match 79',away:'W Match 80', dateISO:'2026-07-05',time:'6:00 PM',  venue:'Estadio Azteca, Mexico City'},
  {round:'R16',matchNum:93, home:'W Match 83',away:'W Match 84', dateISO:'2026-07-06',time:'2:00 PM',  venue:'AT&T Stadium, Dallas'},
  {round:'R16',matchNum:94, home:'W Match 81',away:'W Match 82', dateISO:'2026-07-06',time:'5:00 PM',  venue:'Lumen Field, Seattle'},
  {round:'R16',matchNum:95, home:'W Match 86',away:'W Match 88', dateISO:'2026-07-07',time:'12:00 PM', venue:'Mercedes-Benz Stadium, Atlanta'},
  {round:'R16',matchNum:96, home:'W Match 85',away:'W Match 87', dateISO:'2026-07-07',time:'1:00 PM',  venue:'BC Place, Vancouver'},
  // Quarter-Finals
  {round:'QF', matchNum:97,  home:'W Match 89',away:'W Match 90',  dateISO:'2026-07-09',time:'4:00 PM',  venue:'Gillette Stadium, Boston'},
  {round:'QF', matchNum:98,  home:'W Match 93',away:'W Match 94',  dateISO:'2026-07-10',time:'12:00 PM', venue:'SoFi Stadium, Los Angeles'},
  {round:'QF', matchNum:99,  home:'W Match 91',away:'W Match 92',  dateISO:'2026-07-11',time:'5:00 PM',  venue:'Hard Rock Stadium, Miami'},
  {round:'QF', matchNum:100, home:'W Match 95',away:'W Match 96',  dateISO:'2026-07-11',time:'8:00 PM',  venue:'Arrowhead Stadium, Kansas City'},
  // Semi-Finals
  {round:'SF',  matchNum:101, home:'W Match 97', away:'W Match 98',  dateISO:'2026-07-14',time:'2:00 PM', venue:'AT&T Stadium, Dallas'},
  {round:'SF',  matchNum:102, home:'W Match 99', away:'W Match 100', dateISO:'2026-07-15',time:'3:00 PM', venue:'Mercedes-Benz Stadium, Atlanta'},
  // 3rd Place
  {round:'3rd', matchNum:103, home:'L Match 101',away:'L Match 102', dateISO:'2026-07-18',time:'5:00 PM', venue:'Hard Rock Stadium, Miami'},
  // Final
  {round:'Final',matchNum:104,home:'W Match 101',away:'W Match 102', dateISO:'2026-07-19',time:'3:00 PM', venue:'MetLife Stadium, New York/NJ'},
];

// ── 7. Bracket structure  (row = vertical slot in bracket view) ──

const BRACKET_NODES = [
  // R32  (rows 0–15)
  {id:74,  round:'R32', row:0,    feeds:89,  home:'1st Group E',    away:'3rd Grp A/B/C/D/F', date:'Jun 29', venue:'Gillette Stadium, Boston'},
  {id:77,  round:'R32', row:1,    feeds:89,  home:'1st Group I',    away:'3rd Grp C/D/F/G/H', date:'Jun 30', venue:'MetLife Stadium, New York/NJ'},
  {id:73,  round:'R32', row:2,    feeds:90,  home:'2nd Group A',    away:'2nd Group B',        date:'Jun 28', venue:'SoFi Stadium, Los Angeles'},
  {id:75,  round:'R32', row:3,    feeds:90,  home:'1st Group F',    away:'2nd Group C',        date:'Jun 29', venue:'Estadio BBVA, Monterrey'},
  {id:83,  round:'R32', row:4,    feeds:93,  home:'2nd Group K',    away:'2nd Group L',        date:'Jul 2',  venue:'BMO Field, Toronto'},
  {id:84,  round:'R32', row:5,    feeds:93,  home:'1st Group H',    away:'2nd Group J',        date:'Jul 2',  venue:'SoFi Stadium, Los Angeles'},
  {id:81,  round:'R32', row:6,    feeds:94,  home:'1st Group D',    away:'3rd Grp B/E/F/I/J',  date:'Jul 1',  venue:"Levi's Stadium, San Francisco"},
  {id:82,  round:'R32', row:7,    feeds:94,  home:'1st Group G',    away:'3rd Grp A/E/H/I/J',  date:'Jul 1',  venue:'Lumen Field, Seattle'},
  {id:76,  round:'R32', row:8,    feeds:91,  home:'1st Group C',    away:'2nd Group F',        date:'Jun 29', venue:'NRG Stadium, Houston'},
  {id:78,  round:'R32', row:9,    feeds:91,  home:'2nd Group E',    away:'2nd Group I',        date:'Jun 30', venue:'AT&T Stadium, Dallas'},
  {id:79,  round:'R32', row:10,   feeds:92,  home:'1st Group A',    away:'3rd Grp C/E/F/H/I',  date:'Jun 30', venue:'Estadio Azteca, Mexico City'},
  {id:80,  round:'R32', row:11,   feeds:92,  home:'1st Group L',    away:'3rd Grp E/H/I/J/K',  date:'Jul 1',  venue:'Mercedes-Benz Stadium, Atlanta'},
  {id:86,  round:'R32', row:12,   feeds:95,  home:'1st Group J',    away:'2nd Group H',        date:'Jul 3',  venue:'Hard Rock Stadium, Miami'},
  {id:88,  round:'R32', row:13,   feeds:95,  home:'2nd Group D',    away:'2nd Group G',        date:'Jul 3',  venue:'AT&T Stadium, Dallas'},
  {id:85,  round:'R32', row:14,   feeds:96,  home:'1st Group B',    away:'3rd Grp E/F/G/I/J',  date:'Jul 2',  venue:'BC Place, Vancouver'},
  {id:87,  round:'R32', row:15,   feeds:96,  home:'1st Group K',    away:'3rd Grp D/E/I/J/L',  date:'Jul 3',  venue:'Arrowhead Stadium, Kansas City'},
  // R16
  {id:89,  round:'R16', row:0.5,  feeds:97,  home:'W Match 74',away:'W Match 77', date:'Jul 4',  venue:'Lincoln Financial Field, Philadelphia'},
  {id:90,  round:'R16', row:2.5,  feeds:97,  home:'W Match 73',away:'W Match 75', date:'Jul 4',  venue:'NRG Stadium, Houston'},
  {id:93,  round:'R16', row:4.5,  feeds:98,  home:'W Match 83',away:'W Match 84', date:'Jul 6',  venue:'AT&T Stadium, Dallas'},
  {id:94,  round:'R16', row:6.5,  feeds:98,  home:'W Match 81',away:'W Match 82', date:'Jul 6',  venue:'Lumen Field, Seattle'},
  {id:91,  round:'R16', row:8.5,  feeds:99,  home:'W Match 76',away:'W Match 78', date:'Jul 5',  venue:'MetLife Stadium, New York/NJ'},
  {id:92,  round:'R16', row:10.5, feeds:99,  home:'W Match 79',away:'W Match 80', date:'Jul 5',  venue:'Estadio Azteca, Mexico City'},
  {id:95,  round:'R16', row:12.5, feeds:100, home:'W Match 86',away:'W Match 88', date:'Jul 7',  venue:'Mercedes-Benz Stadium, Atlanta'},
  {id:96,  round:'R16', row:14.5, feeds:100, home:'W Match 85',away:'W Match 87', date:'Jul 7',  venue:'BC Place, Vancouver'},
  // Quarter-Finals
  {id:97,  round:'QF',  row:1.5,  feeds:101, home:'W Match 89',away:'W Match 90',  date:'Jul 9',  venue:'Gillette Stadium, Boston'},
  {id:98,  round:'QF',  row:5.5,  feeds:101, home:'W Match 93',away:'W Match 94',  date:'Jul 10', venue:'SoFi Stadium, Los Angeles'},
  {id:99,  round:'QF',  row:9.5,  feeds:102, home:'W Match 91',away:'W Match 92',  date:'Jul 11', venue:'Hard Rock Stadium, Miami'},
  {id:100, round:'QF',  row:13.5, feeds:102, home:'W Match 95',away:'W Match 96',  date:'Jul 11', venue:'Arrowhead Stadium, Kansas City'},
  // Semi-Finals
  {id:101, round:'SF',  row:3.5,  feeds:104, home:'W Match 97', away:'W Match 98',  date:'Jul 14', venue:'AT&T Stadium, Dallas'},
  {id:102, round:'SF',  row:11.5, feeds:104, home:'W Match 99', away:'W Match 100', date:'Jul 15', venue:'Mercedes-Benz Stadium, Atlanta'},
  // Final
  {id:104, round:'Final',row:7.5, feeds:null, home:'W Match 101',away:'W Match 102', date:'Jul 19', venue:'MetLife Stadium, New York/NJ'},
  // 3rd Place (rendered separately below the main bracket)
  {id:103, round:'3rd', row:null, feeds:null,  home:'L Match 101',away:'L Match 102', date:'Jul 18', venue:'Hard Rock Stadium, Miami'},
];

// ── 8. Derived counts  (number of matches per city) ───────

const CITY_COUNTS = {};
ALL_MATCHES.forEach(m => {
  const city = m.venue.split(', ').pop();
  CITY_COUNTS[city] = (CITY_COUNTS[city] || 0) + 1;
});
