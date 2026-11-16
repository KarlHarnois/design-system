{
  description = "Keyboard first design system: DTCG tokens, vim keymap, and builds for web and the Linux desktop";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forEachSystem = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      packages = forEachSystem (pkgs: {
        default = pkgs.callPackage ./nix/package.nix { };
      });

      checks = forEachSystem (pkgs: {
        tests = self.packages.${pkgs.stdenv.hostPlatform.system}.default.tests;
      });

      devShells = forEachSystem (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_24
            pkgs.pnpm_12
          ];
        };
      });

      homeManagerModules.default = import ./nix/hm-module.nix self;

      formatter = forEachSystem (pkgs: pkgs.nixfmt);
    };
}
