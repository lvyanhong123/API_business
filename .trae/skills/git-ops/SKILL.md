---
name: "git-ops"
description: "Git operations workflow including upload and fetch. Invoke when user asks to upload/commit/fetch/pull code to/from GitHub."
---

# Git Ops Skill

## Usage Scenario

When user asks to perform Git operations (e.g., "上传代码", "拉取代码", "提交到GitHub", "git上传", "git拉取", "下载版本").

## Pull/Fetch Workflow

When user asks to fetch/pull a version, branch, or any content from GitHub:

### Step 1: Sync Remote First
```bash
git fetch --tags origin
git fetch origin
```
**Always sync remote references first** - do NOT check local status before fetching.

### Step 2: Check Existence
After syncing, verify the requested version/branch exists on remote:
```bash
git tag -l        # check tags
git branch -a     # check branches
```

### Step 3: Checkout/Fetch
If version exists, then checkout or pull:
```bash
git checkout <version>    # for tags
git checkout -b <branch> origin/<branch>  # for branches
```

### Step 4: Verify
Verify content is correctly fetched:
```bash
git log --oneline -3
git status
```

## Upload Workflow

When user asks to upload/commit code to GitHub:

### Step 0: Record Discussion Summary (First!)
Before committing, record discussion summary to `docs/discussions/YYYY-MM-DD-主题.md`:
- Discussed decisions and conclusions
- Rules added/modified
- Skills added/modified
- Other important context

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
git push --force
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

- **Always use --force when pushing** - user treats GitHub as cloud backup, local is always latest
- **Always execute commands separately** - never use `&&` in PowerShell
- **Always verify after pushing** - check git log and git tag to confirm sync
- **If verification fails, retry immediately**
