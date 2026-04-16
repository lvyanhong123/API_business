---
name: "git-upload"
description: "Uploads code to GitHub with proper workflow. Invoke when user asks to upload/commit code to GitHub."
---

# Git Upload Skill

## Usage Scenario

When user explicitly asks to upload code to GitHub (e.g., "上传代码", "提交到GitHub", "git上传"), use this skill.

## Workflow

### Step 1: Check Status
```bash
git status
```
Check what files have been modified.

### Step 2: Add Files
```bash
git add -A
```
Stage all changes. **Do NOT use `&&` syntax** - PowerShell does not support it.

### Step 3: Commit
```bash
git commit -m "提交信息"
```
Write a concise commit message describing the work completed.

### Step 4: Create Tag
Determine the next version number:
- Current latest tag is displayed
- Increment the last digit by 1 (e.g., v1.2.0 → v1.2.1)
- When last digit reaches 10, it resets to 0 and the middle digit increments (e.g., v1.2.9 → v1.3.0)

```bash
git tag v{x.y.z}
```

### Step 5: Push Code
```bash
git push
```

### Step 6: Push Tag
```bash
git push origin v{x.y.z}
```

### Step 7: Verify
After pushing, verify both commit and tag are synced:
```bash
git log --oneline -3
git tag -l
```

### Step 8: Report
Report to user:
- Version number
- Commit content summary
- Confirm successful upload

## Important Notes

- **Always execute commands separately** - never use `&&` in PowerShell
- **Always verify after pushing** - check git log and git tag to confirm sync
- **If verification fails, retry immediately**
