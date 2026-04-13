---
name: "spec-kit"
description: "Installs and configures GitHub spec-kit for Spec-Driven Development. Invoke when user wants to set up or use spec-kit in their project."
---

# GitHub Spec-Kit

Spec-Driven Development flips the script on traditional software development. Specifications become executable, directly generating working implementations rather than just guiding them.

## Installation

### Option 1: Persistent Installation (Recommended)

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z
```

Replace `vX.Y.Z` with the latest release tag.

### Option 2: One-time Usage

```bash
uvx --from git+https://github.com/github/spec-kit.git@vX.Y.Z specify init <PROJECT_NAME>
```

## Workflow

1. **Initialize Project**
   ```bash
   specify init <PROJECT_NAME>
   # or for existing project
   specify init . --ai claude
   specify init --here --ai claude
   ```

2. **Establish Project Principles**
   Use `/speckit.constitution` to create governing principles and development guidelines

3. **Create the Spec**
   Use `/speckit.specify` to describe what to build - focus on the what and why, not the tech stack

4. **Create Technical Implementation Plan**
   Use `/speckit.plan` to provide tech stack and architecture choices

5. **Break Down into Tasks**
   Use `/speckit.tasks` to create actionable task list

6. **Execute Implementation**
   Use `/speckit.implement` to execute all tasks

## Verify Installation

```bash
specify check
```

## Upgrade

```bash
uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git@vX.Y.Z
```

## Key Concepts

- **Spec-Driven Development**: Specifications are executable and generate implementations
- **Constitution**: Project principles and development guidelines
- **Specify**: Describe what to build, not how
- **Plan**: Define tech stack and architecture
- **Tasks**: Break down into actionable items
- **Implement**: Execute and build according to plan

## Check Installed Tools

```bash
specify check
```
