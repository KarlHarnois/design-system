# Design system

A keyboard first design system for the web and the Linux desktop.
Tokens follow the [DTCG format](https://www.designtokens.org/tr/2025.10/format/), and bindings follow vim grammar.
Layout follows a Swiss grid built on the [Iosevka](https://typeof.net/Iosevka/) character cell.
The rules are in [`docs/principles.md`](docs/principles.md), and the reasons behind them are in [`docs/decisions/`](docs/decisions/).

## What the build produces

| Output | Path in `dist/` | Consumer |
| --- | --- | --- |
| CSS custom properties, dark on `:root`, light on `[data-theme="light"]` | `css/tokens.css` | websites, the specimen page |
| GTK3 color palette and base stylesheet per theme | `waybar/<theme>/` | Waybar |
| base16 scheme per theme | `base16/<theme>.yaml` | [Stylix](https://github.com/nix-community/stylix) and other base16 tools |

The Nix package also ships `keymap/keymap.json`, the vim bindings every target reads.

## Set up the development shell

You need [Nix](https://nixos.org/download/) with flakes enabled, [direnv](https://direnv.net/), and [nix-direnv](https://github.com/nix-community/nix-direnv).

1. Run `direnv allow` in the repository root. Expect direnv to load a shell with Node.js and pnpm.
2. Run `pnpm install`.
3. Run `pnpm build`. Expect the outputs in `dist/`. If Terrazzo reports a lint error, fix the token file it names and rerun.

## Commands

| Command | Effect |
| --- | --- |
| `pnpm build` | Lints the tokens and writes `dist/` |
| `pnpm lint` | Lints the tokens without writing files |
| `pnpm test` | Runs the plugin and keymap tests |
| `pnpm typecheck` | Typechecks the build plugins and tests |
| `nix build` | Builds the package into `result/` |
| `nix flake check` | Runs the tests and the typecheck in the Nix sandbox |

If you change a dependency, `nix build` fails with a hash mismatch. Copy the `got:` hash into `pnpmDeps.hash` in `nix/package.nix` and rerun.

## View the specimen page

Run `pnpm build`, then open `specimen/index.html` in a browser.
The page lists every token and works without a mouse.
The key list is at the top of the page.

## Use it from a NixOS configuration

1. Add the repository as a flake input:

   ```nix
   inputs.design-system.url = "git+ssh://git@github.com/<owner>/design-system";
   ```

   For a local checkout, use `path:/absolute/path/to/design-system` instead.

2. Import the [Home Manager](https://github.com/nix-community/home-manager) module and enable it:

   ```nix
   imports = [ inputs.design-system.homeManagerModules.default ];
   designSystem.enable = true;
   designSystem.theme = "dark";
   ```

   The module installs Iosevka and Iosevka Aile and makes them the default monospace and sans serif fonts.
   It also writes `~/.config/waybar/style.css` and `colors.css`.
   If Home Manager reports a conflict on `waybar/style.css`, remove `programs.waybar.style` from your configuration or set `designSystem.waybar.enable = false`.

3. To theme other apps through Stylix, point it at the base16 scheme:

   ```nix
   stylix.base16Scheme = "${inputs.design-system.packages.${pkgs.stdenv.hostPlatform.system}.default}/base16/dark.yaml";
   ```

## Repository layout

| Path | Contents |
| --- | --- |
| `tokens/` | DTCG source: `primitive/`, `semantic/`, `theme/`, and `resolver.json` |
| `keymap/` | Vim keymap and its JSON Schema |
| `build/plugins/` | Terrazzo plugins for Waybar and base16 |
| `terrazzo.config.ts` | Build configuration |
| `nix/` | Nix package and Home Manager module |
| `specimen/` | Token specimen page |
| `tests/` | Vitest suite and fixture tokens |
