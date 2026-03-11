# Skills Directory

This repository keeps installable agent skills under `skills/`.

## Conventions

- Put each skill in `skills/<skill-name>/`
- Each skill directory must contain `SKILL.md`
- The `name` in `SKILL.md` should match the parent directory name
- Keep only skill source files here, such as `SKILL.md`, `references/`, `templates/`, and `examples/`
- Do not place monorepo source code, package manifests, tests, release checklists, or local agent install artifacts in a skill directory

## Installation

Browse all skills in the repository and choose interactively:

```bash
npx skills add https://github.com/whjstc/browsecraft
```

Install a specific skill by name:

```bash
npx skills add https://github.com/whjstc/browsecraft --skill browsecraft
```
