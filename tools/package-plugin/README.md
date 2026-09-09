# package-plugin

Zips one plugin directory's git-tracked files into a distributable
`<name>-<version>.plugin` archive, named from that plugin's
`.claude-plugin/plugin.json`. Only files under the given plugin directory
are included (repo-maintenance paths like `.github/`, `.claude/`, `tools/`,
other plugins, and the marketplace-only root `.claude-plugin/marketplace.json`
are naturally excluded since they live outside it).

## Usage

```
cd tools/package-plugin
go run . [plugin-dir] [output-dir]
```

`plugin-dir` is repo-relative and defaults to `plugins/minh-toolkit`.
`output-dir` defaults to `<repo-root>/dist` (git-ignored).

Example, packaging a different plugin:
```
go run . plugins/template-plugin
```

## Known caveat: `claude --plugin-dir <file>.plugin`

Claude Code's CLI can load a `.plugin` zip directly for a single session via
`claude --plugin-dir path/to/file.plugin`, but as of testing (Claude Code
2.1.226) this session-only zip loader reads the manifest but does **not**
discover the plugin's skills — even with an explicit `"skills"` array in
`plugin.json`. Unzipping the same archive to a real directory and pointing
`--plugin-dir` at that directory works correctly and loads every skill.

This is believed to be specific to the CLI's ad-hoc `--plugin-dir` zip
loader, not necessarily how Claude Desktop's "install plugin from file"
handles a `.plugin` archive (which almost certainly extracts it to disk
first, the same way a normal marketplace install does — the code path
already confirmed to work). If installing this package in Desktop still
doesn't surface skills, that would indicate the same limitation applies
there too, and is worth reporting upstream.
