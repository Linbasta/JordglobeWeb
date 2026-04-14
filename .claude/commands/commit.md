# Commit Changes

Create a git commit for the current changes made during this claude session.

## Commit Message Format

Use this format:
```
<type>: <short description>
```

Types:
- `Add` - New feature or file
- `Fix` - Bug fix
- `Tweak` - Small adjustment or refinement
- `Refactor` - Code restructuring without behavior change
- `Remove` - Removing code or files
- `Update` - Updating dependencies or data

## Rules

1. Keep the first line under 50 characters when possible
2. Use imperative mood ("Add feature" not "Added feature")
3. No period at the end
4. Be specific but concise

## Examples

- `Add: country animation system`
- `Fix: pin placement on rotated globe`
- `Tweak: reduce camera transition speed`
- `Refactor: extract quiz logic to separate module`

Now check git status, review the changes, and create an appropriate commit.

Under no circumstances mention any thinkable author or co-author to the commit.