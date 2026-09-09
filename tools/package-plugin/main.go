// Command package-plugin zips one plugin directory's git-tracked files into
// a distributable <name>-<version>.plugin archive, named from that plugin's
// .claude-plugin/plugin.json. Use it to install a local build in Claude
// Desktop when adding the repo directly as a marketplace doesn't work there.
//
// Usage (run from anywhere inside the repo; this is its own Go module):
//
//	cd tools/package-plugin && go run . [plugin-dir] [output-dir]
//
// plugin-dir is repo-relative and defaults to "plugins/minh-toolkit".
// output-dir defaults to <repo-root>/dist (git-ignored).
package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
)

type pluginManifest struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// defaultPluginDir is used when no plugin directory is given on the
// command line.
const defaultPluginDir = "plugins/minh-toolkit"

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run() error {
	repoRoot, err := gitRoot()
	if err != nil {
		return err
	}

	pluginDir := defaultPluginDir
	if len(os.Args) > 1 {
		pluginDir = os.Args[1]
	}
	pluginDirSlash := strings.Trim(filepath.ToSlash(pluginDir), "/") + "/"

	manifest, err := readManifest(filepath.Join(repoRoot, pluginDir, ".claude-plugin", "plugin.json"))
	if err != nil {
		return err
	}

	files, err := trackedFiles(repoRoot)
	if err != nil {
		return err
	}
	files = filterPluginFiles(files, pluginDirSlash)
	if len(files) == 0 {
		return fmt.Errorf("no plugin files found under %s", pluginDir)
	}

	outDir := filepath.Join(repoRoot, "dist")
	if len(os.Args) > 2 {
		outDir = os.Args[2]
	}
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return fmt.Errorf("create output dir: %w", err)
	}

	outPath := filepath.Join(outDir, fmt.Sprintf("%s-%s.plugin", manifest.Name, manifest.Version))
	if err := writeZip(repoRoot, files, pluginDirSlash, outPath); err != nil {
		return err
	}

	fmt.Printf("Packaged %d files -> %s\n", len(files), outPath)
	return nil
}

func gitRoot() (string, error) {
	out, err := exec.Command("git", "rev-parse", "--show-toplevel").Output()
	if err != nil {
		return "", fmt.Errorf("git rev-parse --show-toplevel: %w", err)
	}
	return strings.TrimSpace(string(out)), nil
}

func readManifest(path string) (pluginManifest, error) {
	var m pluginManifest
	data, err := os.ReadFile(path)
	if err != nil {
		return m, fmt.Errorf("read plugin.json: %w", err)
	}
	if err := json.Unmarshal(data, &m); err != nil {
		return m, fmt.Errorf("parse plugin.json: %w", err)
	}
	if m.Name == "" || m.Version == "" {
		return m, fmt.Errorf("plugin.json missing name or version")
	}
	return m, nil
}

func trackedFiles(repoRoot string) ([]string, error) {
	cmd := exec.Command("git", "ls-files")
	cmd.Dir = repoRoot
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("git ls-files: %w", err)
	}
	var files []string
	for _, l := range strings.Split(strings.TrimRight(string(out), "\n"), "\n") {
		if l != "" {
			files = append(files, l)
		}
	}
	return files, nil
}

// filterPluginFiles keeps only git-tracked files that live under
// pluginDirSlash (a repo-relative prefix ending in "/"), i.e. files that
// are actually part of the given plugin's distributable contents.
func filterPluginFiles(files []string, pluginDirSlash string) []string {
	var kept []string
	for _, f := range files {
		if strings.HasPrefix(filepath.ToSlash(f), pluginDirSlash) {
			kept = append(kept, f)
		}
	}
	return kept
}

func writeZip(repoRoot string, files []string, pluginDirSlash string, outPath string) error {
	out, err := os.Create(outPath)
	if err != nil {
		return fmt.Errorf("create output file: %w", err)
	}
	defer out.Close()

	zw := zip.NewWriter(out)
	defer zw.Close()

	// Claude Code's plugin loader appears to rely on explicit directory
	// entries in the archive to discover paths like skills/ — a zip with
	// file entries alone (no folder entries) loads but reports no skills.
	written := map[string]bool{}
	for _, rel := range files {
		archiveName := strings.TrimPrefix(filepath.ToSlash(rel), pluginDirSlash)
		if err := addDirEntries(zw, archiveName, written); err != nil {
			return err
		}
		if err := addFile(zw, repoRoot, rel, archiveName); err != nil {
			return err
		}
	}
	return nil
}

func addDirEntries(zw *zip.Writer, relSlash string, written map[string]bool) error {
	dir := path.Dir(relSlash)
	if dir == "." || dir == "/" {
		return nil
	}

	var parts []string
	for _, seg := range strings.Split(dir, "/") {
		parts = append(parts, seg)
		dirPath := strings.Join(parts, "/") + "/"
		if written[dirPath] {
			continue
		}
		written[dirPath] = true
		if _, err := zw.Create(dirPath); err != nil {
			return fmt.Errorf("add zip directory entry %s: %w", dirPath, err)
		}
	}
	return nil
}

func addFile(zw *zip.Writer, repoRoot, rel, archiveName string) error {
	full := filepath.Join(repoRoot, rel)
	info, err := os.Stat(full)
	if err != nil {
		return fmt.Errorf("stat %s: %w", rel, err)
	}

	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return fmt.Errorf("build zip header for %s: %w", rel, err)
	}
	// Forward-slash name relative to the plugin dir (not the repo root) so
	// the archive unzips to a flat, portable plugin directory regardless
	// of the host OS.
	header.Name = archiveName
	header.Method = zip.Deflate

	w, err := zw.CreateHeader(header)
	if err != nil {
		return fmt.Errorf("add zip entry %s: %w", rel, err)
	}

	f, err := os.Open(full)
	if err != nil {
		return fmt.Errorf("open %s: %w", rel, err)
	}
	defer f.Close()

	if _, err := io.Copy(w, f); err != nil {
		return fmt.Errorf("write %s into archive: %w", rel, err)
	}
	return nil
}
