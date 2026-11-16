self:
{
  config,
  lib,
  pkgs,
  ...
}:

let
  cfg = config.designSystem;
  system = pkgs.stdenv.hostPlatform.system;
  modifiers = (builtins.fromJSON (builtins.readFile ../tokens/resolver.json)).modifiers;
  themeDirectory = "${cfg.package}/waybar/${cfg.theme}/${cfg.accent}";
in
{
  options.designSystem = {
    enable = lib.mkEnableOption "the design system fonts and desktop styling";

    package = lib.mkOption {
      type = lib.types.package;
      default = self.packages.${system}.default;
      description = "Built tokens to style the desktop with.";
    };

    theme = lib.mkOption {
      type = lib.types.enum (builtins.attrNames modifiers.theme.contexts);
      default = modifiers.theme.default;
      description = "Theme to apply to every styled target.";
    };

    accent = lib.mkOption {
      type = lib.types.enum (builtins.attrNames modifiers.accent.contexts);
      default = modifiers.accent.default;
      description = "Accent color, chosen from the fixed accent menu.";
    };

    waybar.enable = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = "Write the generated Waybar stylesheet to ~/.config/waybar.";
    };
  };

  config = lib.mkIf cfg.enable (
    lib.mkMerge [
      {
        home.packages = [
          pkgs.iosevka-bin
          (pkgs.iosevka-bin.override { variant = "Aile"; })
        ];
        fonts.fontconfig = {
          enable = true;
          defaultFonts = {
            monospace = [ "Iosevka" ];
            sansSerif = [ "Iosevka Aile" ];
          };
        };
      }
      (lib.mkIf cfg.waybar.enable {
        xdg.configFile."waybar/style.css".source = "${themeDirectory}/style.css";
        xdg.configFile."waybar/colors.css".source = "${themeDirectory}/colors.css";
      })
    ]
  );
}
