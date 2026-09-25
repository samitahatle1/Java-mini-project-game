// Theme data architecture for "Find Your Bestfriend"
// Fully data-driven per §5 and §9.5 of specification

export const THEMES = [
  {
    id: 'nature',
    name: 'Enchanted Forest & Glade',
    tagline: 'Sunlit groves, whispering willow trees, and stepping stone creeks',
    isHorror: false,
    hud: {
      motif: 'leaf-vine',
      cardBorder: 'rounded-3xl border-2 border-emerald-200/80 shadow-emerald-100/50',
      accentColor: '#DFF7EA', // mint
      secondaryColor: '#FFF4D6', // buttercream
      textColor: '#2D3A30',
      badgeBg: 'bg-emerald-100/80 text-emerald-800',
      iconStyle: 'leaf'
    },
    lighting: {
      vignette: 'radial-gradient(ellipse at center, rgba(223, 247, 234, 0.25) 0%, rgba(167, 243, 208, 0.4) 100%)',
      mood: 'warm golden sunlight and drifting fireflies'
    },
    world: {
      width: 2400,
      height: 1800,
      tileType: 'grass-clover',
      tileColorA: '#A8E6CF',
      tileColorB: '#B3EED7',
      pathColor: '#F5E6CA',
      ambientParticles: 'leaves-fireflies',
      rooms: [
        { id: 'r1', name: 'Whispering Willow Grove', x: 200, y: 300, w: 600, h: 500 },
        { id: 'r2', name: 'Sunbeam Flower Meadow', x: 900, y: 250, w: 650, h: 550 },
        { id: 'r3', name: 'Pebblebrook Waterfalls', x: 1650, y: 350, w: 600, h: 500 },
        { id: 'r4', name: 'Mossy Stone Sanctuary', x: 500, y: 950, w: 650, h: 600 },
        { id: 'r5', name: 'Friendship Tree Clearing', x: 1300, y: 1000, w: 800, h: 650 }
      ],
      obstacles: [
        { type: 'tree', x: 450, y: 400, r: 40, label: 'Grand Willow' },
        { type: 'boulder', x: 1100, y: 380, r: 35, label: 'Moss Rock' },
        { type: 'pond', x: 1850, y: 550, r: 65, label: 'Crystal Spring' },
        { type: 'tree', x: 750, y: 1150, r: 45, label: 'Ancient Oak' },
        { type: 'boulder', x: 1550, y: 1250, r: 35, label: 'Sun Boulder' }
      ]
    }
  },
  {
    id: 'school',
    name: 'Sunny Campus & Academy',
    tagline: 'Locker-lined corridors, cozy library nooks, and rooftop views',
    isHorror: false,
    hud: {
      motif: 'notebook-ruled',
      cardBorder: 'rounded-2xl border-2 border-sky-200/90 shadow-sky-100/60',
      accentColor: '#DCEEFF', // sky blue
      secondaryColor: '#E7DFFF', // lavender
      textColor: '#2C3545',
      badgeBg: 'bg-sky-100/90 text-sky-800',
      iconStyle: 'chalk'
    },
    lighting: {
      vignette: 'radial-gradient(ellipse at center, rgba(220, 238, 255, 0.25) 0%, rgba(186, 215, 248, 0.35) 100%)',
      mood: 'bright classroom sunlight and gentle chalk dust'
    },
    world: {
      width: 2400,
      height: 1800,
      tileType: 'parquet-tile',
      tileColorA: '#E8EDF2',
      tileColorB: '#DFE7EE',
      pathColor: '#CFDCE8',
      ambientParticles: 'paper-planes-dust',
      rooms: [
        { id: 'r1', name: 'Bright Homeroom 104', x: 200, y: 300, w: 600, h: 500 },
        { id: 'r2', name: 'Grand Oak Library', x: 900, y: 250, w: 650, h: 550 },
        { id: 'r3', name: 'Locker Hallway East', x: 1650, y: 350, w: 600, h: 500 },
        { id: 'r4', name: 'Art Studio & Gallery', x: 500, y: 950, w: 650, h: 600 },
        { id: 'r5', name: 'Sunny Rooftop Garden', x: 1300, y: 1000, w: 800, h: 650 }
      ],
      obstacles: [
        { type: 'desk', x: 420, y: 460, r: 35, label: 'Study Table' },
        { type: 'bookshelf', x: 1200, y: 420, r: 45, label: 'Tall Bookshelf' },
        { type: 'lockers', x: 1800, y: 480, r: 40, label: 'Locker Row' },
        { type: 'easel', x: 720, y: 1180, r: 35, label: 'Paint Easel' },
        { type: 'bench', x: 1600, y: 1200, r: 35, label: 'Rooftop Bench' }
      ]
    }
  },
  {
    id: 'cartoon',
    name: 'Candy Cloud Cartoon World',
    tagline: 'Bouncy lollipop hills, sugar rainbows, and floating star lanterns',
    isHorror: false,
    hud: {
      motif: 'bubble-scallop',
      cardBorder: 'rounded-3xl border-4 border-pink-200/90 shadow-pink-100/70',
      accentColor: '#FFE3EC', // blush pink
      secondaryColor: '#FFF4D6', // buttercream
      textColor: '#422B38',
      badgeBg: 'bg-pink-100 text-pink-700',
      iconStyle: 'starburst'
    },
    lighting: {
      vignette: 'radial-gradient(ellipse at center, rgba(255, 227, 236, 0.3) 0%, rgba(255, 198, 218, 0.4) 100%)',
      mood: 'saturated pastel cotton candy glow with bouncing glitter'
    },
    world: {
      width: 2400,
      height: 1800,
      tileType: 'bubble-grid',
      tileColorA: '#FFD6E8',
      tileColorB: '#FFC8E0',
      pathColor: '#FFF0D0',
      ambientParticles: 'sparkling-stars-bubbles',
      rooms: [
        { id: 'r1', name: 'Cotton Candy Square', x: 200, y: 300, w: 600, h: 500 },
        { id: 'r2', name: 'Lollipop Swirl Meadow', x: 900, y: 250, w: 650, h: 550 },
        { id: 'r3', name: 'Marshmallow Bouncy Peak', x: 1650, y: 350, w: 600, h: 500 },
        { id: 'r4', name: 'Bubble Tea Lagoon', x: 500, y: 950, w: 650, h: 600 },
        { id: 'r5', name: 'Starlight Ferris Wheel', x: 1300, y: 1000, w: 800, h: 650 }
      ],
      obstacles: [
        { type: 'lollipop', x: 440, y: 440, r: 40, label: 'Giant Lollipop' },
        { type: 'cloud', x: 1150, y: 400, r: 45, label: 'Bouncy Cloud' },
        { type: 'gumball', x: 1820, y: 510, r: 40, label: 'Gumball Tower' },
        { type: 'cupcake', x: 740, y: 1160, r: 40, label: 'Cupcake House' },
        { type: 'rainbow', x: 1580, y: 1220, r: 50, label: 'Rainbow Gate' }
      ]
    }
  },
  {
    id: 'bighouse',
    name: 'The Cozy Grand Estate',
    tagline: 'Warm fireplaces, vintage parlor rugs, and attic stargazing domes',
    isHorror: false,
    hud: {
      motif: 'wood-frame',
      cardBorder: 'rounded-2xl border-2 border-amber-200/90 shadow-amber-100/60',
      accentColor: '#FFF4D6', // buttercream
      secondaryColor: '#E7DFFF', // lavender
      textColor: '#3E342B',
      badgeBg: 'bg-amber-100 text-amber-800',
      iconStyle: 'keyhole'
    },
    lighting: {
      vignette: 'radial-gradient(ellipse at center, rgba(255, 244, 214, 0.28) 0%, rgba(246, 217, 168, 0.38) 100%)',
      mood: 'cozy amber hearth glow and ticking grandfather clock echoes'
    },
    world: {
      width: 2400,
      height: 1800,
      tileType: 'parquet-rug',
      tileColorA: '#F3E5D8',
      tileColorB: '#E8D5C4',
      pathColor: '#EFE0D0',
      ambientParticles: 'warm-sparks-clockticks',
      rooms: [
        { id: 'r1', name: 'Grand Foyer & Chandelier', x: 200, y: 300, w: 600, h: 500 },
        { id: 'r2', name: 'Fireplace Library & Lounge', x: 900, y: 250, w: 650, h: 550 },
        { id: 'r3', name: 'Gourmet Chef Kitchen', x: 1650, y: 350, w: 600, h: 500 },
        { id: 'r4', name: 'Secret Conservatory Garden', x: 500, y: 950, w: 650, h: 600 },
        { id: 'r5', name: 'Attic Planetarium Lounge', x: 1300, y: 1000, w: 800, h: 650 }
      ],
      obstacles: [
        { type: 'sofa', x: 450, y: 450, r: 40, label: 'Velvet Sofa' },
        { type: 'fireplace', x: 1180, y: 380, r: 45, label: 'Stone Hearth' },
        { type: 'piano', x: 1840, y: 490, r: 45, label: 'Grand Piano' },
        { type: 'fountain', x: 750, y: 1170, r: 40, label: 'Indoor Fountain' },
        { type: 'telescope', x: 1620, y: 1220, r: 35, label: 'Brass Telescope' }
      ]
    }
  },
  {
    id: 'warfield',
    name: 'Frontier Outpost Expedition',
    tagline: 'Tactical basecamp, gentle watchtowers, and radar signals',
    isHorror: false,
    hud: {
      motif: 'stencil-bracket',
      cardBorder: 'rounded-2xl border-2 border-indigo-200/80 shadow-indigo-100/50',
      accentColor: '#E7DFFF', // soft lavender
      secondaryColor: '#DCEEFF', // sky
      textColor: '#2E3244',
      badgeBg: 'bg-indigo-100 text-indigo-800',
      iconStyle: 'compass'
    },
    lighting: {
      vignette: 'radial-gradient(ellipse at center, rgba(231, 223, 255, 0.22) 0%, rgba(199, 196, 230, 0.35) 100%)',
      mood: 'calm desert horizon with gentle radio beacon blips'
    },
    world: {
      width: 2400,
      height: 1800,
      tileType: 'tactical-grid',
      tileColorA: '#DDDCE6',
      tileColorB: '#D2D1DD',
      pathColor: '#E8E7EF',
      ambientParticles: 'beacon-blips-dust',
      rooms: [
        { id: 'r1', name: 'Command & Dispatch Tent', x: 200, y: 300, w: 600, h: 500 },
        { id: 'r2', name: 'Supply Depot & Radio Tower', x: 900, y: 250, w: 650, h: 550 },
        { id: 'r3', name: 'Observation Ridge East', x: 1650, y: 350, w: 600, h: 500 },
        { id: 'r4', name: 'Repair Bay & Hangar', x: 500, y: 950, w: 650, h: 600 },
        { id: 'r5', name: 'Central Signal Beacon', x: 1300, y: 1000, w: 800, h: 650 }
      ],
      obstacles: [
        { type: 'crates', x: 440, y: 460, r: 40, label: 'Supply Crates' },
        { type: 'antenna', x: 1160, y: 400, r: 45, label: 'Radio Antenna' },
        { type: 'sandbags', x: 1800, y: 500, r: 40, label: 'Sandbag Perimeter' },
        { type: 'jeep', x: 730, y: 1180, r: 45, label: 'Expedition Rover' },
        { type: 'radar', x: 1600, y: 1240, r: 40, label: 'Radar Dish' }
      ]
    }
  },
  {
    id: 'supermarket',
    name: 'Midnight Mega-Mart',
    tagline: 'Candy aisles, glowing neon signs, and shopping cart joyrides',
    isHorror: false,
    hud: {
      motif: 'barcode-accent',
      cardBorder: 'rounded-2xl border-2 border-rose-200/90 shadow-rose-100/60',
      accentColor: '#FFE3EC', // blush pink
      secondaryColor: '#DCEEFF', // sky
      textColor: '#3A2E36',
      badgeBg: 'bg-rose-100 text-rose-800',
      iconStyle: 'pricetag'
    },
    lighting: {
      vignette: 'radial-gradient(ellipse at center, rgba(255, 238, 245, 0.25) 0%, rgba(255, 210, 226, 0.35) 100%)',
      mood: 'gleaming tile reflections, soft neon pink and turquoise hues'
    },
    world: {
      width: 2400,
      height: 1800,
      tileType: 'checker-linoleum',
      tileColorA: '#FAF0F5',
      tileColorB: '#F1E4EC',
      pathColor: '#EBE0E8',
      ambientParticles: 'sparkling-gleams-cartwheels',
      rooms: [
        { id: 'r1', name: 'Fresh Bakery & Pastry Aisle', x: 200, y: 300, w: 600, h: 500 },
        { id: 'r2', name: 'Neon Snack & Soda Haven', x: 900, y: 250, w: 650, h: 550 },
        { id: 'r3', name: 'Frozen Delights Freezer Hall', x: 1650, y: 350, w: 600, h: 500 },
        { id: 'r4', name: 'Toy & Novelty Treasure Row', x: 500, y: 950, w: 650, h: 600 },
        { id: 'r5', name: 'Express Checkout Gateway', x: 1300, y: 1000, w: 800, h: 650 }
      ],
      obstacles: [
        { type: 'shelf', x: 450, y: 440, r: 40, label: 'Pastry Showcase' },
        { type: 'cart', x: 1170, y: 410, r: 35, label: 'Shopping Cart Line' },
        { type: 'freezer', x: 1820, y: 490, r: 45, label: 'Ice Cream Freezer' },
        { type: 'display', x: 740, y: 1190, r: 40, label: 'Plushie Pyramids' },
        { type: 'register', x: 1610, y: 1210, r: 40, label: 'Scanner Register' }
      ]
    }
  },
  {
    id: 'horror',
    name: 'The Whispering Realm (Midnight Echoes)',
    tagline: 'Gothic ruined arches, moonlit mist, and wandering will-o-wisps',
    isHorror: true,
    hud: {
      motif: 'candlelight-glow',
      cardBorder: 'rounded-2xl border-2 border-indigo-400/40 shadow-indigo-950/70 bg-slate-900/90 backdrop-blur-md',
      accentColor: '#373449', // desaturated gothic night
      secondaryColor: '#938BA8', // pale mist lavender
      textColor: '#EAE6F2',
      badgeBg: 'bg-indigo-900/80 text-indigo-200 border border-indigo-700/50',
      iconStyle: 'flicker-flame'
    },
    lighting: {
      vignette: 'radial-gradient(ellipse at center, rgba(30, 27, 46, 0.45) 0%, rgba(10, 8, 20, 0.85) 100%)',
      mood: 'cold moonlit blue-grey fog with gentle flickering lantern embers'
    },
    world: {
      width: 2400,
      height: 1800,
      tileType: 'gothic-cobble',
      tileColorA: '#252331',
      tileColorB: '#1E1B29',
      pathColor: '#2F2B3E',
      ambientParticles: 'drifting-fog-ghostwisps',
      rooms: [
        { id: 'r1', name: 'Haunted Mansion Vestibule', x: 200, y: 300, w: 600, h: 500 },
        { id: 'r2', name: 'The Lost Clocktower Courtyard', x: 900, y: 250, w: 650, h: 550 },
        { id: 'r3', name: 'Submerged Seascape Ruins', x: 1650, y: 350, w: 600, h: 500 },
        { id: 'r4', name: 'Eerie Bamboo Swamp', x: 500, y: 950, w: 650, h: 600 },
        { id: 'r5', name: 'The Midnight Mirror Sanctum', x: 1300, y: 1000, w: 800, h: 650 }
      ],
      obstacles: [
        { type: 'gargoyle', x: 440, y: 450, r: 40, label: 'Stone Gargoyle' },
        { type: 'tombstone', x: 1180, y: 400, r: 35, label: 'Ancient Obelisk' },
        { type: 'statue', x: 1830, y: 500, r: 45, label: 'Weeping Statue' },
        { type: 'cauldron', x: 740, y: 1180, r: 40, label: 'Smoking Cauldron' },
        { type: 'portal', x: 1620, y: 1230, r: 45, label: 'Ethereal Gateway' }
      ]
    }
  }
];

export function getThemeById(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

// Generate waypoints with coordinates and distractor options
export function generateThemeWaypoints(themeId, difficulty = 'easy', questions = []) {
  const theme = getThemeById(themeId);
  
  // Coordinate distribution across the rooms to ensure natural exploration
  const baseWaypoints = [
    { x: 380, y: 420, room: theme.world.rooms[0].name },
    { x: 540, y: 560, room: theme.world.rooms[0].name },
    { x: 1050, y: 390, room: theme.world.rooms[1].name },
    { x: 1280, y: 510, room: theme.world.rooms[1].name },
    { x: 1780, y: 460, room: theme.world.rooms[2].name },
    { x: 1950, y: 620, room: theme.world.rooms[2].name },
    { x: 680, y: 1100, room: theme.world.rooms[3].name },
    { x: 880, y: 1280, room: theme.world.rooms[3].name },
    { x: 1450, y: 1150, room: theme.world.rooms[4].name },
    { x: 1750, y: 1350, room: theme.world.rooms[4].name }
  ];

  // Depending on difficulty, jitter positions or hide hints:
  const waypoints = questions.map((q, idx) => {
    const base = baseWaypoints[idx] || { x: 500 + idx * 120, y: 500 + (idx % 3) * 150, room: 'Expedition Path' };
    let jitter = 0;
    if (difficulty === 'medium') jitter = (Math.random() - 0.5) * 60;
    if (difficulty === 'hard') jitter = (Math.random() - 0.5) * 120;

    return {
      index: idx,
      questionId: q.id,
      prompt: q.prompt,
      category: q.category,
      categoryIcon: q.categoryIcon,
      room: base.room,
      x: Math.round(base.x + jitter),
      y: Math.round(base.y + jitter),
      radius: difficulty === 'easy' ? 48 : difficulty === 'medium' ? 40 : 32,
      isAnswered: false,
      isCorrect: null,
      selectedAnswer: null
    };
  });

  return waypoints;
}
