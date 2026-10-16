# Rung recipes

Worked examples use Go, but every recipe is language-neutral. Each example below was run before it was written down, with `go version go1.26.3 windows/amd64`. Treat the quoted output as that environment's result and re-run before reusing an example in a session.

## Contents

- Preparing a rung
- Hint tiers
- Predict recipe and example
- Review and fix recipe and example
- Write small recipe and example
- Version-specific rung example
- Ledger row example

## Preparing a rung

Do this before the learner sees anything.

1. Write the code exactly as the learner will see it.
2. Run it. Record the command and the real output.
3. For a bug rung, also run the fixed version and a minimal variant that changes the cause.
4. If the behavior varies between runs, drop the rung or run it repeatedly and describe it as "can happen".
5. Open the primary source for any "why" you will explain. Note its name and the sentence you will quote.
6. Only then show the exercise. Keep the output hidden until the learner commits.

## Hint tiers

1. **Direction.** Point at where to look, without naming the fix. "The problem has two parts. Which part does the failing case exercise?"
2. **Concept or tool name.** "Look at what `len` counts for a string."
3. **One-line sample.** Only after the learner has failed twice. A single line that shows the idea on different data, never the learner's solution.

Run every hint's sample too.

## Predict recipe and example

Show a short snippet with a real trap and an observable result. Ask: "Write one line: what happens when this runs?"

```go
func main() {
	var counts map[string]int
	counts["go"]++
	fmt.Println(counts)
}
```

Verified: `go run .` prints `panic: assignment to entry in nil map` (then a goroutine trace). Explain why from the language specification or the official docs for maps, quoting the sentence you opened, and add the minimal variant that changes the cause: `counts := make(map[string]int)` runs without panic.

## Review and fix recipe and example

The learner states the offending line and cause in one sentence, then makes the smallest change.

```go
func CountLetters(s string) map[rune]int {
	counts := make(map[rune]int)
	for i := 0; i < len(s); i++ {
		counts[rune(s[i])]++
	}
	return counts
}
```

Test cases: `"aab"`, `""`, and `"é"` (want `map[rune]int{'é': 1}`).

Verified: `go test` fails with `CountLetters("é") = map[169:1 195:1], want map[233:1]`. Note that `fmt` prints map keys in sorted order, so quote the output exactly as run. After replacing the loop header with `for _, r := range s {` and the body with `counts[r]++`, `go test` prints `PASS`. The cause in one sentence: indexing a string reads bytes, and `é` is two bytes.

Variant without a visible failing test: remove the `"é"` case from the visible tests and keep it as a hidden case, so the code passes what the learner can see and is still wrong.

## Write small recipe and example

Give a signature, a behavior description and tests. About ten lines, one new concept, one edge case.

```go
// Unique returns the distinct elements of xs in order of first appearance.
func Unique(xs []string) []string
```

Tests: `nil` in gives `[]string{}`; `["a","b","a"]` gives `["a","b"]`; `["b","a","b","c"]` gives `["b","a","c"]`.

Verified: a reference solution that starts with `result := []string{}` passes (`PASS`). Replacing that line with `var result []string` fails the first case: `Unique([]) = []string(nil), want []string{}`. So the nil-versus-empty edge case is real.

## Version-specific rung example

Language behavior can depend on project config, not only the installed tool.

```go
var fs []func()
for i := 0; i < 3; i++ {
	fs = append(fs, func() { fmt.Print(i, " ") })
}
for _, f := range fs {
	f()
}
```

<!-- safety-ok: unlisted-url official Go blog, the primary source opened to verify this claim -->
Verified with the same toolchain: with `go 1.21` in `go.mod` it prints `3 3 3`; with `go 1.22` it prints `0 1 2`. The [Go blog post on loop variable scoping](https://go.dev/blog/loopvar-preview) says the per-iteration semantics apply to modules that declare `go 1.22` or later. Before using this rung, check the `go` line of the learner's `go.mod`, not only `go version`.

## Ledger row example

A template with placeholders, not a record:

```markdown
| <date> | Predict: <topic> | pass or fail | <hints used> | <what the learner can now do> | `<command run>` printed "<real output>"; <source name>, "<quoted line>" |
```

Only rows with a real command in `Verified by` are allowed. Write the source part only for a source you actually opened in that session.
