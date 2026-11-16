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
  themeDirectory = "${cfg.package}/waybar/${cfg.theme}";
  hyprlandDirectory = "${cfg.package}/hyprland/${cfg.theme}";
  hyprlandManagedByHomeManager =
    config.wayland.windowManager.hyprland.enable
    && (config.wayland.windowManager.hyprland.configType or "hyprlang") == "lua";
  hyprlandSettings = builtins.fromJSON (builtins.readFile "${hyprlandDirectory}/settings.json");
  isCssGap = attrs: attrs ? top;
  waybarManagedByHomeManager = config.programs.waybar.enable;
  waybarSettings = builtins.fromJSON (builtins.readFile "${themeDirectory}/settings.json");
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

    waybar.enable = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = "Write the generated Waybar stylesheet to ~/.config/waybar.";
    };

    waybar.config.enable = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = ''
        Configure the floating Waybar bar: modules, formats and margins.
        When Home Manager manages Waybar, the config is merged into
        `programs.waybar.settings.mainBar` as defaults, so your own settings win.
        Otherwise it is written to ~/.config/waybar/config.jsonc.
        Turn this off to keep your own Waybar config.
      '';
    };

    hyprland.enable = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = ''
        Write the generated Hyprland theme to ~/.config/hypr/design-system.lua.
        When Home Manager manages Hyprland with a Lua config, the theme is also merged
        into `wayland.windowManager.hyprland.settings` as defaults, so your own settings win.
        Otherwise, add `dofile(os.getenv("HOME") .. "/.config/hypr/design-system.lua")`
        to your hyprland.lua yourself.
      '';
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
      (lib.mkIf (cfg.waybar.config.enable && waybarManagedByHomeManager) {
        programs.waybar.settings.mainBar = lib.mapAttrsRecursive (_: lib.mkDefault) waybarSettings;
      })
      (lib.mkIf (cfg.waybar.config.enable && !waybarManagedByHomeManager) {
        xdg.configFile."waybar/config.jsonc".source = "${themeDirectory}/config.jsonc";
      })
      (lib.mkIf cfg.hyprland.enable {
        xdg.configFile."hypr/design-system.lua".source = "${hyprlandDirectory}/theme.lua";
      })
      (lib.mkIf (cfg.hyprland.enable && hyprlandManagedByHomeManager) {
        wayland.windowManager.hyprland.settings = lib.mapAttrsRecursiveCond (attrs: !(isCssGap attrs)) (
          _: lib.mkDefault
        ) hyprlandSettings;
      })
    ]
  );
}
