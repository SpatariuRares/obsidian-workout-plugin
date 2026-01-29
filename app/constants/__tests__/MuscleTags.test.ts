import { CONSTANTS } from "@app/constants";
import {
  getAllMuscleGroups,
  isValidMuscleTag,
  isMuscleKeyword,
  tagToMuscleGroup,
} from '../MuscleTags';

describe('MuscleTags', () => {
  describe('CONSTANTS.WORKOUT.MUSCLES.TAGS constant', () => {
    it('should contain all expected muscle tags', () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('chest');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('back');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('legs');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('biceps');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('triceps');
    });

    it('should contain Italian muscle names', () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('petto');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('schiena');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('gambe');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('glutei');
    });

    it('should contain exercise type tags', () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('push');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('pull');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('squat');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain('deadlift');
    });

    it('should have all unique values', () => {
      const uniqueTags = new Set(CONSTANTS.WORKOUT.MUSCLES.TAGS);
      expect(uniqueTags.size).toBe(CONSTANTS.WORKOUT.MUSCLES.TAGS.length);
    });
  });

  describe('CONSTANTS.WORKOUT.MUSCLES.TAG_MAP constant', () => {
    it('should map Italian names to English muscle groups', () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['petto']).toBe('chest');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['schiena']).toBe('back');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['gambe']).toBe('quads');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['glutei']).toBe('glutes');
    });

    it('should map exercise types to muscle groups', () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['push']).toBe('chest');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['pull']).toBe('back');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['squat']).toBe('quads');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['deadlift']).toBe('back');
    });

    it('should map specific muscle variations', () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['pettoralesuperior']).toBe('chest');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['deltoideanteriore']).toBe('shoulders');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['ischiocrurali']).toBe('hamstrings');
    });

    it('should have consistent mapping for same muscle', () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['chest']).toBe('chest');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['petto']).toBe('chest');
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP['pettorale']).toBe('chest');
    });
  });

  describe('CONSTANTS.WORKOUT.MUSCLES.KEYWORDS constant', () => {
    it('should contain main muscle group keywords', () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.KEYWORDS).toContain('chest');
      expect(CONSTANTS.WORKOUT.MUSCLES.KEYWORDS).toContain('back');
      expect(CONSTANTS.WORKOUT.MUSCLES.KEYWORDS).toContain('legs');
      expect(CONSTANTS.WORKOUT.MUSCLES.KEYWORDS).toContain('biceps');
    });

    it('should not contain exercise type keywords', () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.KEYWORDS).not.toContain('push');
      expect(CONSTANTS.WORKOUT.MUSCLES.KEYWORDS).not.toContain('pull');
      expect(CONSTANTS.WORKOUT.MUSCLES.KEYWORDS).not.toContain('squat');
    });

    it('should be a subset of CONSTANTS.WORKOUT.MUSCLES.TAGS', () => {
      CONSTANTS.WORKOUT.MUSCLES.KEYWORDS.forEach((keyword) => {
        expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain(keyword);
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

    it('should match values from CONSTANTS.WORKOUT.MUSCLES.TAG_MAP', () => {
      const result = getAllMuscleGroups();
      const mapValues = Object.values(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP);

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
      expect(isValidMuscleTag(CONSTANTS.WORKOUT.MUSCLES.NAMES.PETTO)).toBe(true);
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
      expect(tagToMuscleGroup(CONSTANTS.WORKOUT.MUSCLES.NAMES.PETTO)).toBe('chest');
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
        expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP[group]).toBeDefined();
      });
    });

    it('should have Italian translations for main groups', () => {
      const italianNames = ['petto', 'schiena', 'spalle', 'bicipiti', 'tricipiti', 'gambe', 'glutei', 'polpacci', 'addominali'];

      italianNames.forEach((name) => {
        expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP[name]).toBeDefined();
      });
    });
  });
});
