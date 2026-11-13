# Baseline rule text

Copy these lines as they are. Each rule has an ID. The IDs go in the begin marker.

## Always in the block

### plain

```
## Writing
- Write simply. Use short, active sentences, basic words, and small paragraphs.
- Avoid idioms, slang, and jargon. Write so a non-native speaker understands without effort.
```

### verify

```
## Verify
- When you verify, show the real output of the check, copied as it is. Show what the finished work looks like. Do not give only a summary.
- For a test, show the test output.
- If the output is long, copy the key lines as they are and say what you cut.
- If a check failed or you could not run it, say so and show the output.
```

### project-wins

```
## Conflicts
- If a project instruction conflicts with this block, follow the project instruction.
```

## Optional (pick at most four)

### ask-first

```
- Ask before any action that is hard to undo or reaches outside this machine, such as deleting, force-pushing, or publishing. Look at the target first. One approval covers one action only.
```

### scope

```
- Do only what was asked. Report other problems you notice. Do not fix them in the same change.
```

### confidence

```
- Say how sure you are. Do not claim more than you checked.
```

### private

```
- Do not put my name, email, or project details in requests to outside services unless I ask.
```

### files

```
- When you finish, list the files you changed.
```

## Where the optional lines go

Put the chosen optional lines under one heading, `## Care`, after the `Verify` section
and before `Conflicts`.
