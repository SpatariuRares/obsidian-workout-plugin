import {
  MUSCLE_TAGS,
  TAG_MUSCLE_MAP,
  MUSCLE_KEYWORDS,
  getAllMuscleGroups,
  isValidMuscleTag,
  isMuscleKeyword,
  tagToMuscleGroup,
} from '../MuscleTags';

describe('MuscleTags', () => {
  describe('MUSCLE_TAGS constant', () => {
    it('should contain all expected muscle tags', () => {
      expect(MUSCLE_TAGS).toContain('chest');
      expect(MUSCLE_TAGS).toContain('back');
      expect(MUSCLE_TAGS).toContain('legs');
      expect(MUSCLE_TAGS).toContain('biceps');
      expect(MUSCLE_TAGS).toContain('triceps');
    });

    it('should contain Italian muscle names', () => {
      expect(MUSCLE_TAGS).toContain('petto');
      expect(MUSCLE_TAGS).toContain('schiena');
      expect(MUSCLE_TAGS).toContain('gambe');
      expect(MUSCLE_TAGS).toContain('glutei');
    });

    it('should contain exercise type tags', () => {
      expect(MUSCLE_TAGS).toContain('push');
      expect(MUSCLE_TAGS).toContain('pull');
      expect(MUSCLE_TAGS).toContain('squat');
      expect(MUSCLE_TAGS).toContain('deadlift');
    });

    it('should have all unique values', () => {
      const uniqueTags = new Set(MUSCLE_TAGS);
      expect(uniqueTags.size).toBe(MUSCLE_TAGS.length);
    });
  });

  describe('TAG_MUSCLE_MAP constant', () => {
    it('should map Italian names to English muscle groups', () => {
      expect(TAG_MUSCLE_MAP['petto']).toBe('chest');
      expect(TAG_MUSCLE_MAP['schiena']).toBe('back');
      expect(TAG_MUSCLE_MAP['gambe']).toBe('quads');
      expect(TAG_MUSCLE_MAP['glutei']).toBe('glutes');
    });

    it('should map exercise types to muscle groups', () => {
      expect(TAG_MUSCLE_MAP['push']).toBe('chest');
      expect(TAG_MUSCLE_MAP['pull']).toBe('back');
      expect(TAG_MUSCLE_MAP['squat']).toBe('quads');
      expect(TAG_MUSCLE_MAP['deadlift']).toBe('back');
    });

    it('should map specific muscle variations', () => {
      expect(TAG_MUSCLE_MAP['pettoralesuperior']).toBe('chest');
      expect(TAG_MUSCLE_MAP['deltoideanteriore']).toBe('shoulders');
      expect(TAG_MUSCLE_MAP['ischiocrurali']).toBe('hamstrings');
    });

    it('should have consistent mapping for same muscle', () => {
      expect(TAG_MUSCLE_MAP['chest']).toBe('chest');
      expect(TAG_MUSCLE_MAP['petto']).toBe('chest');
      expect(TAG_MUSCLE_MAP['pettorale']).toBe('chest');
    });
  });

  describe('MUSCLE_KEYWORDS constant', () => {
    it('should contain main muscle group keywords', () => {
      expect(MUSCLE_KEYWORDS).toContain('chest');
      expect(MUSCLE_KEYWORDS).toContain('back');
      expect(MUSCLE_KEYWORDS).toContain('legs');
      expect(MUSCLE_KEYWORDS).toContain('biceps');
    });

    it('should not contain exercise type keywords', () => {
      expect(MUSCLE_KEYWORDS).not.toContain('push');
      expect(MUSCLE_KEYWORDS).not.toContain('pull');
      expect(MUSCLE_KEYWORDS).not.toContain('squat');
    });

    it('should be a subset of MUSCLE_TAGS', () => {
      MUSCLE_KEYWORDS.forEach((keyword) => {
        expect(MUSCLE_TAGS).toContain(keyword);
      });
    });
  });

  describe('getAllMuscleGroups', () => {
    it('should return a Set of unique muscle groups', () => {
      const result = getAllMuscleGroups();

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should contain normalized muscle group names', () => {
      const result = getAllMuscleGroups();

      expect(result.has('chest')).toBe(true);
      expect(result.has('back')).toBe(true);
      expect(result.has('shoulders')).toBe(true);
      expect(result.has('biceps')).toBe(true);
      expect(result.has('triceps')).toBe(true);
      expect(result.has('quads')).toBe(true);
      expect(result.has('hamstrings')).toBe(true);
      expect(result.has('glutes')).toBe(true);
    });

    it('should not contain duplicate values', () => {
      const result = getAllMuscleGroups();
      const asArray = Array.from(result);

      expect(asArray.length).toBe(result.size);
    });

    it('should match values from TAG_MUSCLE_MAP', () => {
      const result = getAllMuscleGroups();
      const mapValues = Object.values(TAG_MUSCLE_MAP);

      mapValues.forEach((value) => {
        expect(result.has(value)).toBe(true);
      });
    });
  });

  describe('isValidMuscleTag', () => {
    it('should return true for valid tags', () => {
      expect(isValidMuscleTag('chest')).toBe(true);
      expect(isValidMuscleTag('petto')).toBe(true);
      expect(isValidMuscleTag('squat')).toBe(true);
    });

    it('should return false for invalid tags', () => {
      expect(isValidMuscleTag('invalid')).toBe(false);
      expect(isValidMuscleTag('random')).toBe(false);
      expect(isValidMuscleTag('')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidMuscleTag('CHEST')).toBe(true);
      expect(isValidMuscleTag('ChEsT')).toBe(true);
      expect(isValidMuscleTag('Petto')).toBe(true);
    });

    it('should handle tags with whitespace', () => {
      expect(isValidMuscleTag('  chest  ')).toBe(true);
      expect(isValidMuscleTag(' petto ')).toBe(true);
    });
  });

  describe('isMuscleKeyword', () => {
    it('should return true for muscle keyword tags', () => {
      expect(isMuscleKeyword('chest')).toBe(true);
      expect(isMuscleKeyword('petto')).toBe(true);
      expect(isMuscleKeyword('biceps')).toBe(true);
    });

    it('should return false for exercise type tags', () => {
      expect(isMuscleKeyword('push')).toBe(false);
      expect(isMuscleKeyword('pull')).toBe(false);
      expect(isMuscleKeyword('squat')).toBe(false);
    });

    it('should handle partial matches', () => {
      expect(isMuscleKeyword('upper chest')).toBe(true); // Contains 'chest'
      expect(isMuscleKeyword('big biceps')).toBe(true); // Contains 'biceps'
    });

    it('should be case insensitive', () => {
      expect(isMuscleKeyword('CHEST')).toBe(true);
      expect(isMuscleKeyword('Biceps')).toBe(true);
    });

    it('should handle whitespace', () => {
      expect(isMuscleKeyword('  chest  ')).toBe(true);
    });
  });

  describe('tagToMuscleGroup', () => {
    it('should map tags to normalized muscle groups', () => {
      expect(tagToMuscleGroup('chest')).toBe('chest');
      expect(tagToMuscleGroup('petto')).toBe('chest');
      expect(tagToMuscleGroup('schiena')).toBe('back');
      expect(tagToMuscleGroup('glutei')).toBe('glutes');
    });

    it('should map exercise types to muscle groups', () => {
      expect(tagToMuscleGroup('push')).toBe('chest');
      expect(tagToMuscleGroup('pull')).toBe('back');
      expect(tagToMuscleGroup('squat')).toBe('quads');
    });

    it('should return undefined for invalid tags', () => {
      expect(tagToMuscleGroup('invalid')).toBeUndefined();
      expect(tagToMuscleGroup('random')).toBeUndefined();
      expect(tagToMuscleGroup('')).toBeUndefined();
    });

    it('should be case insensitive', () => {
      expect(tagToMuscleGroup('CHEST')).toBe('chest');
      expect(tagToMuscleGroup('Petto')).toBe('chest');
      expect(tagToMuscleGroup('SQUAT')).toBe('quads');
    });

    it('should handle whitespace', () => {
      expect(tagToMuscleGroup('  chest  ')).toBe('chest');
      expect(tagToMuscleGroup(' petto ')).toBe('chest');
    });
  });

  describe('Tag completeness', () => {
    it('should have mappings for all main muscle groups', () => {
      const mainGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs'];

      mainGroups.forEach((group) => {
        expect(TAG_MUSCLE_MAP[group]).toBeDefined();
      });
    });

    it('should have Italian translations for main groups', () => {
      const italianNames = ['petto', 'schiena', 'spalle', 'bicipiti', 'tricipiti', 'gambe', 'glutei', 'polpacci', 'addominali'];

      italianNames.forEach((name) => {
        expect(TAG_MUSCLE_MAP[name]).toBeDefined();
      });
    });
  });
});
