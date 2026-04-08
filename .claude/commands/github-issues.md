You are managing GitHub issues for this repository using the `gh` CLI. Determine the operation from ARGUMENTS and execute it.

## Operations

### List issues

If ARGUMENTS contains "list" or no operation is specified:

```
gh issue list --state open --limit 50
```

Display results as a numbered table with: issue number, title, labels, creation date.

### Read an issue

If ARGUMENTS contains a number (e.g. "read 42" or just "42"):

```
gh issue view [number]
```

Display the full issue: title, body, labels, comments. Summarize what it is asking for.

### Create an issue

If ARGUMENTS contains "create" or a title to create:

1. Determine title and body from ARGUMENTS. If ARGUMENTS is a roadmap item or brief description, expand it into a well-structured issue body using this template:

```
## Context
[Why this matters — problem being solved]

## Acceptance Criteria
- [ ] [specific, testable criterion]
- [ ] [specific, testable criterion]

## Notes
[Implementation hints, links to related decisions or sessions, harness dimension if applicable]
```

2. Identify appropriate labels from what exists in the repo:

```
gh label list
```

3. Create the issue:

```
gh issue create --title "[title]" --body "$(cat <<'EOF'
[body]
EOF
)" --label "[label]"
```

4. Confirm the issue URL and number after creation.

### Close an issue

If ARGUMENTS contains "close [number]":

```
gh issue close [number] --comment "[reason]"
```

### Add a comment

If ARGUMENTS contains "comment [number] [text]":

```
gh issue comment [number] --body "[text]"
```

## After any write operation

Print the issue URL so the user can verify it.

## Repo context

- Repo: atniptw/probable-computing-machine
- Use `gh` CLI — it is authenticated in this environment.
- All issues should be scoped to this repo (no `--repo` flag needed if already in the repo directory).
