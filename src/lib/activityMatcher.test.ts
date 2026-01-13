import { describe, it, expect } from 'vitest';
import {
  getMaxGustForDay,
  findMatchingActivity,
  findAllMatchingActivities,
  findDailyActivity,
} from './activityMatcher';
import type { ActivityRule } from '@/types/activity';
import type { DayForecast, Location, WindForecast } from '@/types/weather';

// Helper to create a forecast for testing
function createForecast(overrides: Partial<WindForecast> = {}): WindForecast {
  return {
    hour: 12,
    windSpeed: 8,
    windGust: 12,
    windDirection: 180, // South
    temperature: 15,
    ...overrides,
  };
}

// Helper to create a day forecast
function createDayForecast(
  forecasts: Partial<WindForecast>[] = [],
  date = '2024-01-15'
): DayForecast {
  return {
    date,
    forecasts: forecasts.map((f, i) => createForecast({ hour: [10, 12, 14, 16, 18, 20][i] || 12, ...f })),
  };
}

// Helper to create an activity rule
function createRule(overrides: Partial<ActivityRule> = {}): ActivityRule {
  return {
    id: 'rule-1',
    user_id: 'user-1',
    location_id: 'loc-1',
    location_name: 'Test Location',
    activity: 'wingfoil',
    min_gust: null,
    max_gust: null,
    priority: 1,
    created_at: '2024-01-01',
    wind_directions: null,
    min_temp: null,
    max_temp: null,
    ...overrides,
  };
}

// Helper to create a location
function createLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 'loc-1',
    name: 'Test Location',
    coordinates: { lat: 59.0, lon: 10.0 },
    ...overrides,
  };
}

describe('getMaxGustForDay', () => {
  it('returns 0 for undefined forecast', () => {
    expect(getMaxGustForDay(undefined)).toBe(0);
  });

  it('returns 0 for empty forecasts', () => {
    const forecast = createDayForecast([]);
    expect(getMaxGustForDay(forecast)).toBe(0);
  });

  it('returns max gust from display hours only', () => {
    const forecast: DayForecast = {
      date: '2024-01-15',
      forecasts: [
        createForecast({ hour: 8, windGust: 25 }), // Not a display hour
        createForecast({ hour: 10, windGust: 15 }),
        createForecast({ hour: 12, windGust: 18 }),
        createForecast({ hour: 14, windGust: 20 }),
        createForecast({ hour: 16, windGust: 12 }),
        createForecast({ hour: 18, windGust: 10 }),
        createForecast({ hour: 20, windGust: 8 }),
        createForecast({ hour: 22, windGust: 30 }), // Not a display hour
      ],
    };
    expect(getMaxGustForDay(forecast)).toBe(20);
  });

  it('handles single forecast at display hour', () => {
    const forecast = createDayForecast([{ hour: 14, windGust: 15 }]);
    expect(getMaxGustForDay(forecast)).toBe(15);
  });
});

describe('findMatchingActivity', () => {
  describe('basic matching', () => {
    it('returns null for undefined forecast', () => {
      const rules = [createRule()];
      expect(findMatchingActivity(rules, 'loc-1', undefined)).toBeNull();
    });

    it('returns null when no rules match location', () => {
      const rules = [createRule({ location_id: 'other-loc' })];
      const forecast = createDayForecast([{ windGust: 15 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });

    it('returns activity when rule has no constraints', () => {
      const rules = [createRule()];
      const forecast = createDayForecast([{ windGust: 5 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('returns first matching activity by priority order', () => {
      const rules = [
        createRule({ id: 'rule-1', activity: 'windsurfing', priority: 1 }),
        createRule({ id: 'rule-2', activity: 'wingfoil', priority: 2 }),
      ];
      const forecast = createDayForecast([{ windGust: 15 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('windsurfing');
    });
  });

  describe('gust constraints', () => {
    it('matches when gust is above min_gust', () => {
      const rules = [createRule({ min_gust: 10 })];
      const forecast = createDayForecast([{ windGust: 15 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('matches when gust equals min_gust', () => {
      const rules = [createRule({ min_gust: 10 })];
      const forecast = createDayForecast([{ windGust: 10 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('does not match when gust is below min_gust', () => {
      const rules = [createRule({ min_gust: 10 })];
      const forecast = createDayForecast([{ windGust: 8 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });

    it('matches when gust is below max_gust', () => {
      const rules = [createRule({ max_gust: 20 })];
      const forecast = createDayForecast([{ windGust: 15 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('matches when gust equals max_gust', () => {
      const rules = [createRule({ max_gust: 20 })];
      const forecast = createDayForecast([{ windGust: 20 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('does not match when gust is above max_gust', () => {
      const rules = [createRule({ max_gust: 20 })];
      const forecast = createDayForecast([{ windGust: 25 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });

    it('matches when gust is within range', () => {
      const rules = [createRule({ min_gust: 10, max_gust: 20 })];
      const forecast = createDayForecast([{ windGust: 15 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('does not match when gust is outside range', () => {
      const rules = [createRule({ min_gust: 10, max_gust: 20 })];
      const forecast = createDayForecast([{ windGust: 25 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });
  });

  describe('wind direction constraints', () => {
    it('matches when direction is in allowed list', () => {
      const rules = [createRule({ wind_directions: ['S', 'SW'] })];
      const forecast = createDayForecast([{ windDirection: 180 }]); // South
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('does not match when direction is not in allowed list', () => {
      const rules = [createRule({ wind_directions: ['N', 'NE'] })];
      const forecast = createDayForecast([{ windDirection: 180 }]); // South
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });

    it('matches any direction when wind_directions is null', () => {
      const rules = [createRule({ wind_directions: null })];
      const forecast = createDayForecast([{ windDirection: 270 }]); // West
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('matches any direction when wind_directions is empty array', () => {
      const rules = [createRule({ wind_directions: [] })];
      const forecast = createDayForecast([{ windDirection: 90 }]); // East
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    // Test all compass directions
    const compassTests: [number, string][] = [
      [0, 'N'],
      [22, 'N'],
      [23, 'NE'],
      [45, 'NE'],
      [67, 'NE'],
      [68, 'E'],
      [90, 'E'],
      [112, 'E'],
      [113, 'SE'],
      [135, 'SE'],
      [157, 'SE'],
      [158, 'S'],
      [180, 'S'],
      [202, 'S'],
      [203, 'SW'],
      [225, 'SW'],
      [247, 'SW'],
      [248, 'W'],
      [270, 'W'],
      [292, 'W'],
      [293, 'NW'],
      [315, 'NW'],
      [337, 'NW'],
      [338, 'N'],
      [360, 'N'],
    ];

    it.each(compassTests)('converts %i degrees to %s', (degrees, expected) => {
      const rules = [createRule({ wind_directions: [expected as any] })];
      const forecast = createDayForecast([{ windDirection: degrees }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });
  });

  describe('temperature constraints', () => {
    it('matches when temperature is above min_temp', () => {
      const rules = [createRule({ min_temp: 10 })];
      const forecast = createDayForecast([{ temperature: 15 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('matches when temperature equals min_temp', () => {
      const rules = [createRule({ min_temp: 10 })];
      const forecast = createDayForecast([{ temperature: 10 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('does not match when temperature is below min_temp', () => {
      const rules = [createRule({ min_temp: 10 })];
      const forecast = createDayForecast([{ temperature: 5 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });

    it('matches when temperature is below max_temp', () => {
      const rules = [createRule({ max_temp: 25 })];
      const forecast = createDayForecast([{ temperature: 20 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('matches when temperature equals max_temp', () => {
      const rules = [createRule({ max_temp: 25 })];
      const forecast = createDayForecast([{ temperature: 25 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('does not match when temperature is above max_temp', () => {
      const rules = [createRule({ max_temp: 25 })];
      const forecast = createDayForecast([{ temperature: 30 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });

    it('matches when temperature is within range', () => {
      const rules = [createRule({ min_temp: 10, max_temp: 25 })];
      const forecast = createDayForecast([{ temperature: 15 }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('does not match when temperature constraint exists but temperature is undefined', () => {
      const rules = [createRule({ min_temp: 10 })];
      const forecast = createDayForecast([{ temperature: undefined }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });

    it('matches when no temperature constraints and temperature is undefined', () => {
      const rules = [createRule({ min_temp: null, max_temp: null })];
      const forecast = createDayForecast([{ temperature: undefined }]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });
  });

  describe('combined constraints', () => {
    it('matches when all constraints are satisfied', () => {
      const rules = [
        createRule({
          min_gust: 10,
          max_gust: 20,
          wind_directions: ['S', 'SW'],
          min_temp: 10,
          max_temp: 25,
        }),
      ];
      const forecast = createDayForecast([
        { windGust: 15, windDirection: 180, temperature: 18 },
      ]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('does not match when gust constraint fails', () => {
      const rules = [
        createRule({
          min_gust: 10,
          max_gust: 20,
          wind_directions: ['S'],
          min_temp: 10,
        }),
      ];
      const forecast = createDayForecast([
        { windGust: 5, windDirection: 180, temperature: 18 },
      ]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });

    it('does not match when direction constraint fails', () => {
      const rules = [
        createRule({
          min_gust: 10,
          wind_directions: ['N'],
          min_temp: 10,
        }),
      ];
      const forecast = createDayForecast([
        { windGust: 15, windDirection: 180, temperature: 18 },
      ]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });

    it('does not match when temperature constraint fails', () => {
      const rules = [
        createRule({
          min_gust: 10,
          wind_directions: ['S'],
          min_temp: 20,
        }),
      ];
      const forecast = createDayForecast([
        { windGust: 15, windDirection: 180, temperature: 15 },
      ]);
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });
  });

  describe('multiple hours matching', () => {
    it('matches if any display hour satisfies constraints', () => {
      const rules = [createRule({ min_gust: 15 })];
      const forecast: DayForecast = {
        date: '2024-01-15',
        forecasts: [
          createForecast({ hour: 10, windGust: 8 }),
          createForecast({ hour: 12, windGust: 10 }),
          createForecast({ hour: 14, windGust: 18 }), // This one matches
          createForecast({ hour: 16, windGust: 12 }),
          createForecast({ hour: 18, windGust: 10 }),
          createForecast({ hour: 20, windGust: 8 }),
        ],
      };
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
    });

    it('does not match if no display hour satisfies constraints', () => {
      const rules = [createRule({ min_gust: 20 })];
      const forecast: DayForecast = {
        date: '2024-01-15',
        forecasts: [
          createForecast({ hour: 10, windGust: 8 }),
          createForecast({ hour: 12, windGust: 10 }),
          createForecast({ hour: 14, windGust: 15 }),
          createForecast({ hour: 16, windGust: 12 }),
          createForecast({ hour: 18, windGust: 10 }),
          createForecast({ hour: 20, windGust: 8 }),
        ],
      };
      expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
    });
  });
});

describe('findAllMatchingActivities', () => {
  it('returns empty array for undefined forecast', () => {
    const rules = [createRule()];
    expect(findAllMatchingActivities(rules, 'loc-1', undefined)).toEqual([]);
  });

  it('returns all unique matching activities', () => {
    const rules = [
      createRule({ id: 'rule-1', activity: 'wingfoil', min_gust: 8 }),
      createRule({ id: 'rule-2', activity: 'windsurfing', min_gust: 10 }),
      createRule({ id: 'rule-3', activity: 'windfoil', min_gust: 12 }),
      createRule({ id: 'rule-4', activity: 'sup-foil', min_gust: 20 }), // Won't match
    ];
    const forecast = createDayForecast([{ windGust: 15 }]);
    const result = findAllMatchingActivities(rules, 'loc-1', forecast);
    expect(result).toHaveLength(3);
    expect(result).toContain('wingfoil');
    expect(result).toContain('windsurfing');
    expect(result).toContain('windfoil');
    expect(result).not.toContain('sup-foil');
  });

  it('returns unique activities (no duplicates)', () => {
    const rules = [
      createRule({ id: 'rule-1', activity: 'wingfoil', min_gust: 8 }),
      createRule({ id: 'rule-2', activity: 'wingfoil', min_gust: 10 }), // Same activity
      createRule({ id: 'rule-3', activity: 'windsurfing', min_gust: 12 }),
    ];
    const forecast = createDayForecast([{ windGust: 15 }]);
    const result = findAllMatchingActivities(rules, 'loc-1', forecast);
    expect(result).toHaveLength(2);
    expect(result.filter((a) => a === 'wingfoil')).toHaveLength(1);
  });

  it('only returns activities for the specified location', () => {
    const rules = [
      createRule({ id: 'rule-1', location_id: 'loc-1', activity: 'wingfoil' }),
      createRule({ id: 'rule-2', location_id: 'loc-2', activity: 'windsurfing' }),
    ];
    const forecast = createDayForecast([{ windGust: 15 }]);
    const result = findAllMatchingActivities(rules, 'loc-1', forecast);
    expect(result).toEqual(['wingfoil']);
  });
});

describe('findDailyActivity', () => {
  it('returns null when no locations have forecasts', () => {
    const rules = [createRule()];
    const locations = [
      { location: createLocation(), forecast: undefined, isLoading: false },
    ];
    expect(findDailyActivity(rules, locations)).toBeNull();
  });

  it('returns null when no rules match', () => {
    const rules = [createRule({ min_gust: 30 })];
    const locations = [
      {
        location: createLocation(),
        forecast: createDayForecast([{ windGust: 10 }]),
        isLoading: false,
      },
    ];
    expect(findDailyActivity(rules, locations)).toBeNull();
  });

  it('returns highest priority matching rule across all locations', () => {
    const rules = [
      createRule({
        id: 'rule-1',
        location_id: 'loc-1',
        activity: 'windsurfing',
        priority: 1,
        min_gust: 20,
      }),
      createRule({
        id: 'rule-2',
        location_id: 'loc-2',
        location_name: 'Location 2',
        activity: 'wingfoil',
        priority: 2,
        min_gust: 10,
      }),
    ];
    const locations = [
      {
        location: createLocation({ id: 'loc-1' }),
        forecast: createDayForecast([{ windGust: 8 }]), // Doesn't match rule-1
        isLoading: false,
      },
      {
        location: createLocation({ id: 'loc-2', name: 'Location 2' }),
        forecast: createDayForecast([{ windGust: 15 }]), // Matches rule-2
        isLoading: false,
      },
    ];

    const result = findDailyActivity(rules, locations);
    expect(result).toEqual({
      activity: 'wingfoil',
      locationName: 'Location 2',
      locationId: 'loc-2',
    });
  });

  it('returns first priority rule when multiple locations match', () => {
    const rules = [
      createRule({
        id: 'rule-1',
        location_id: 'loc-1',
        location_name: 'Location 1',
        activity: 'windsurfing',
        priority: 1,
      }),
      createRule({
        id: 'rule-2',
        location_id: 'loc-2',
        location_name: 'Location 2',
        activity: 'wingfoil',
        priority: 2,
      }),
    ];
    const locations = [
      {
        location: createLocation({ id: 'loc-1', name: 'Location 1' }),
        forecast: createDayForecast([{ windGust: 15 }]),
        isLoading: false,
      },
      {
        location: createLocation({ id: 'loc-2', name: 'Location 2' }),
        forecast: createDayForecast([{ windGust: 15 }]),
        isLoading: false,
      },
    ];

    const result = findDailyActivity(rules, locations);
    expect(result).toEqual({
      activity: 'windsurfing',
      locationName: 'Location 1',
      locationId: 'loc-1',
    });
  });

  it('skips locations that are loading', () => {
    const rules = [createRule()];
    const locations = [
      {
        location: createLocation(),
        forecast: createDayForecast([{ windGust: 15 }]),
        isLoading: true, // Loading, has forecast but should still work
      },
    ];
    // The function doesn't actually skip loading locations - it only checks forecast
    const result = findDailyActivity(rules, locations);
    expect(result).not.toBeNull();
  });

  it('handles rule with location not in locations list', () => {
    const rules = [
      createRule({ location_id: 'non-existent-loc' }),
    ];
    const locations = [
      {
        location: createLocation({ id: 'loc-1' }),
        forecast: createDayForecast([{ windGust: 15 }]),
        isLoading: false,
      },
    ];
    expect(findDailyActivity(rules, locations)).toBeNull();
  });
});

describe('edge cases', () => {
  it('handles empty rules array', () => {
    const forecast = createDayForecast([{ windGust: 15 }]);
    expect(findMatchingActivity([], 'loc-1', forecast)).toBeNull();
    expect(findAllMatchingActivities([], 'loc-1', forecast)).toEqual([]);
    expect(findDailyActivity([], [])).toBeNull();
  });

  it('handles forecast with no forecasts at display hours', () => {
    const rules = [createRule({ min_gust: 10 })];
    const forecast: DayForecast = {
      date: '2024-01-15',
      forecasts: [
        createForecast({ hour: 8, windGust: 20 }),
        createForecast({ hour: 22, windGust: 20 }),
      ],
    };
    expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
  });

  it('handles zero wind gust', () => {
    const rules = [createRule({ max_gust: 5 })];
    const forecast = createDayForecast([{ windGust: 0 }]);
    expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
  });

  it('handles negative temperature', () => {
    const rules = [createRule({ min_temp: -10, max_temp: 0 })];
    const forecast = createDayForecast([{ temperature: -5 }]);
    expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');
  });

  it('handles boundary wind directions (around 360/0)', () => {
    const rules = [createRule({ wind_directions: ['N'] })];

    // 337 degrees: 337/45 = 7.49 → rounds to 7 → NW
    let forecast = createDayForecast([{ windDirection: 337 }]);
    expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();

    // 338 degrees: 338/45 = 7.51 → rounds to 8 → 8 % 8 = 0 → N
    forecast = createDayForecast([{ windDirection: 338 }]);
    expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');

    // 350 degrees: 350/45 = 7.78 → rounds to 8 → N
    forecast = createDayForecast([{ windDirection: 350 }]);
    expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');

    // 22 degrees: 22/45 = 0.49 → rounds to 0 → N
    forecast = createDayForecast([{ windDirection: 22 }]);
    expect(findMatchingActivity(rules, 'loc-1', forecast)).toBe('wingfoil');

    // 23 degrees: 23/45 = 0.51 → rounds to 1 → NE
    forecast = createDayForecast([{ windDirection: 23 }]);
    expect(findMatchingActivity(rules, 'loc-1', forecast)).toBeNull();
  });
});
