# Design system

A keyboard first design system with vim bindings and a Swiss grid.
Tokens are in the [DTCG format](https://www.designtokens.org/tr/2025.10/format/).
See [`docs/principles.md`](docs/principles.md) for the rules.

`pnpm build` writes CSS variables, a [knave-grid](https://github.com/KarlHarnois/knave-grid) baseline grid, Waybar styles and base16 schemes to `dist/`.

## Develop

You need [Nix](https://nixos.org/download/) and [direnv](https://direnv.net/).

```sh
direnv allow
pnpm install
pnpm build
```

Run `pnpm specimen` to browse the tokens in a Chromium window without extensions, so browser vim plugins leave its keys alone.

## Use with Home Manager

```nix
inputs.design-system.url = "github:KarlHarnois/design-system";

imports = [ inputs.design-system.homeManagerModules.default ];
designSystem.enable = true;
designSystem.theme = "light";
```

The module installs Iosevka, writes a Waybar config and stylesheet, and writes a Hyprland theme.

To keep the bar layout with another palette, set `designSystem.waybar.colors` by token id:

```nix
designSystem.waybar.colors."color.focus" = "#d79921";
```

`designSystem.colors` holds every color token of the selected theme, by token id.
