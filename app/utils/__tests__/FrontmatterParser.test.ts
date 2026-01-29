import { CONSTANTS } from "@app/constants";
import { FrontmatterParser } from '@app/utils/FrontmatterParser';

describe('FrontmatterParser', () => {
  const validContent = `---
nome_esercizio: Squat
tags:
  - legs
  - quads
  - glutes
difficulty: hard
---

# Squat

This is the content of the file.`;

  const noFrontmatterContent = `# Squat

This file has no frontmatter.`;

  const noTagsContent = `---
nome_esercizio: Squat
difficulty: hard
---

# Squat

Content without tags.`;

  describe('extractFrontmatter', () => {
    it('should extract frontmatter section', () => {
      const result = FrontmatterParser.extractFrontmatter(validContent);

      expect(result).toContain('nome_esercizio: Squat');
      expect(result).toContain('tags:');
      expect(result).toContain('- legs');
    });

    it('should return null for content without frontmatter', () => {
      const result = FrontmatterParser.extractFrontmatter(noFrontmatterContent);
      expect(result).toBeNull();
    });

    it('should handle frontmatter with extra whitespace', () => {
      const content = `---
nome_esercizio: Squat
---

Content`;
      const result = FrontmatterParser.extractFrontmatter(content);
      expect(result).toContain('nome_esercizio: Squat');
    });
  });

  describe('parseTags', () => {
    it('should parse tags from frontmatter', () => {
      const result = FrontmatterParser.parseTags(validContent);

      expect(result).toEqual(['legs', 'quads', 'glutes']);
    });

    it('should return empty array for content without frontmatter', () => {
      const result = FrontmatterParser.parseTags(noFrontmatterContent);
      expect(result).toEqual([]);
    });

    it('should return empty array for frontmatter without tags', () => {
      const result = FrontmatterParser.parseTags(noTagsContent);
      expect(result).toEqual([]);
    });

    it('should handle tags with extra whitespace', () => {
      const content = `---
tags:
  -   legs
  - quads
  - glutes
---`;
      const result = FrontmatterParser.parseTags(content);

      expect(result).toEqual(['legs', 'quads', 'glutes']);
    });

    it('should filter out empty tags', () => {
      const content = `---
tags:
  - legs
  -
  - quads
---`;
      const result = FrontmatterParser.parseTags(content);

      expect(result).toEqual(['legs', 'quads']);
    });
  });

  describe('hasFrontmatter', () => {
    it('should return true for content with frontmatter', () => {
      const result = FrontmatterParser.hasFrontmatter(validContent);
      expect(result).toBe(true);
    });

    it('should return false for content without frontmatter', () => {
      const result = FrontmatterParser.hasFrontmatter(noFrontmatterContent);
      expect(result).toBe(false);
    });
  });

  describe('hasTags', () => {
    it('should return true for frontmatter with tags', () => {
      const result = FrontmatterParser.hasTags(validContent);
      expect(result).toBe(true);
    });

    it('should return false for frontmatter without tags', () => {
      const result = FrontmatterParser.hasTags(noTagsContent);
      expect(result).toBe(false);
    });

    it('should return false for content without frontmatter', () => {
      const result = FrontmatterParser.hasTags(noFrontmatterContent);
      expect(result).toBe(false);
    });
  });

  describe('parseField', () => {
    it('should parse a specific field from frontmatter', () => {
      const result = FrontmatterParser.parseField(validContent, 'nome_esercizio');
      expect(result).toBe('Squat');
    });

    it('should parse difficulty field', () => {
      const result = FrontmatterParser.parseField(validContent, 'difficulty');
      expect(result).toBe('hard');
    });

    it('should return null for non-existent field', () => {
      const result = FrontmatterParser.parseField(validContent, 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for content without frontmatter', () => {
      const result = FrontmatterParser.parseField(noFrontmatterContent, 'nome_esercizio');
      expect(result).toBeNull();
    });

    it('should be case insensitive', () => {
      const result = FrontmatterParser.parseField(validContent, 'NOME_ESERCIZIO');
      expect(result).toBe('Squat');
    });
  });

  describe('parseAllFields', () => {
    it('should parse all simple fields from frontmatter', () => {
      const result = FrontmatterParser.parseAllFields(validContent);

      expect(result.nome_esercizio).toBe('Squat');
      expect(result.difficulty).toBe('hard');
    });

    it('should return empty object for content without frontmatter', () => {
      const result = FrontmatterParser.parseAllFields(noFrontmatterContent);
      expect(result).toEqual({});
    });

    it('should handle fields with various formats', () => {
      const content = `---
field1: value1
field2: value2
---`;
      const result = FrontmatterParser.parseAllFields(content);

      expect(result.field1).toBe('value1');
      expect(result.field2).toBe('value2');
    });
  });

  describe('validateFrontmatter', () => {
    it('should return empty array for valid frontmatter', () => {
      const result = FrontmatterParser.validateFrontmatter(validContent);
      expect(result).toEqual([]);
    });

    it('should return error for empty content', () => {
      const result = FrontmatterParser.validateFrontmatter('');
      expect(result).toContain(CONSTANTS.WORKOUT.MESSAGES.ERRORS.FILE_EMPTY);
    });

    it('should return error for content without frontmatter', () => {
      const result = FrontmatterParser.validateFrontmatter(noFrontmatterContent);
      expect(result).toContain(CONSTANTS.WORKOUT.MESSAGES.ERRORS.NO_FRONTMATTER);
    });

    it('should return error for frontmatter without tags', () => {
      const result = FrontmatterParser.validateFrontmatter(noTagsContent);
      expect(result).toContain(CONSTANTS.WORKOUT.MESSAGES.ERRORS.NO_TAGS);
    });

    it('should return only one error for whitespace content', () => {
      const result = FrontmatterParser.validateFrontmatter('   \n  \n  ');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(CONSTANTS.WORKOUT.MESSAGES.ERRORS.FILE_EMPTY);
    });
  });
});
