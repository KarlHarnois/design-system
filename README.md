# Design system

A keyboard first design system with vim bindings and a Swiss grid.
Tokens are in the [DTCG format](https://www.designtokens.org/tr/2025.10/format/).
See [`docs/principles.md`](docs/principles.md) for the rules.

`pnpm build` writes CSS variables, Waybar styles and base16 schemes to `dist/`.

## Develop

You need [Nix](https://nixos.org/download/) and [direnv](https://direnv.net/).

```sh
direnv allow
pnpm install
pnpm build
```

Open `specimen/index.html` to browse the tokens.

## Use with Home Manager

```nix
inputs.design-system.url = "github:KarlHarnois/design-system";

imports = [ inputs.design-system.homeManagerModules.default ];
designSystem.enable = true;
designSystem.accent = "teal";
```

The module installs Iosevka and styles Waybar.
