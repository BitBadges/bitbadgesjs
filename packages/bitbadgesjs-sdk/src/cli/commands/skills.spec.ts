import { skillsCommand } from './skills.js';
import { getAllSkillInstructions, getSkillInstructions } from '../../builder/resources/skillInstructions.js';

jest.mock('../utils/docs-cache.js', () => ({
  loadDocs: jest.fn(() => {
    throw new Error('Network documentation must not be needed');
  })
}));

describe('installed skill discovery', () => {
  let output: string;
  beforeEach(() => {
    output = '';
    jest.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
      output += String(chunk);
      return true;
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('lists every installed skill without loading remote documentation', async () => {
    await skillsCommand.parseAsync([], { from: 'user' });
    const result = JSON.parse(output);
    expect(result.ok).toBe(true);
    expect(result.data.map((skill: any) => skill.id)).toEqual(getAllSkillInstructions().map((skill) => skill.id));
    expect(result.data.every((skill: any) => skill.description && !skill.instructions)).toBe(true);
  });

  it('returns the canonical instructions for a selected skill', async () => {
    await skillsCommand.parseAsync(['payment-obligations'], { from: 'user' });
    expect(JSON.parse(output).data).toEqual(getSkillInstructions('payment-obligations'));
  });

  it('reports an unknown skill with a nonzero exit and recovery hint', async () => {
    jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    await expect(skillsCommand.parseAsync(['nonexistent-skill'], { from: 'user' })).rejects.toThrow('exit');
    const result = JSON.parse(output);
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('invalid_input');
    expect(result.hint).toContain('bb dev skills');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
