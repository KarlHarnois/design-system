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
  themeDirectory = "${cfg.package}/waybar/${cfg.theme}";
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
      type = lib.types.enum [
        "dark"
        "light"
      ];
      default = "dark";
      description = "Theme to apply to every styled target.";
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
