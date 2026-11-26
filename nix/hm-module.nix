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
  themeDirectory = "${cfg.package}/waybar/${cfg.theme}/${cfg.waybar.style}";
  hyprlandDirectory = "${cfg.package}/hyprland/${cfg.theme}/${cfg.waybar.style}";
  hyprlandManagedByHomeManager =
    config.wayland.windowManager.hyprland.enable
    && (config.wayland.windowManager.hyprland.configType or "hyprlang") == "lua";
  hyprlandSettings = builtins.fromJSON (builtins.readFile "${hyprlandDirectory}/settings.json");
  isCssGap = attrs: attrs ? top;
  waybarManagedByHomeManager = config.programs.waybar.enable;
  waybarSettings = builtins.fromJSON (builtins.readFile "${themeDirectory}/settings.json");
  glossary = builtins.fromJSON (builtins.readFile "${cfg.package}/glossary/glossary.json");
  colorEntries = builtins.filter (entry: entry.type == "color") glossary;
  themeColors = builtins.listToAttrs (
    map (entry: lib.nameValuePair entry.id entry.values.${cfg.theme}) colorEntries
  );
  waybarColors = themeColors // cfg.waybar.colors;
  gtkColorName = id: builtins.replaceStrings [ "." "-" ] [ "_" "_" ] id;
  waybarColorsCss = lib.concatStrings (
    lib.mapAttrsToList (id: value: "@define-color ${gtkColorName id} ${value};\n") waybarColors
  );
  waybarImages = lib.filterAttrs (name: _: lib.hasSuffix ".svg" name) (builtins.readDir themeDirectory);
  waybarImageFiles = lib.mapAttrs' (
    name: _: lib.nameValuePair "waybar/${name}" { source = "${themeDirectory}/${name}"; }
  ) waybarImages;
  waybarStyleWithoutImport = builtins.replaceStrings [ ''@import "colors.css";'' ] [ "" ] (
    builtins.readFile "${themeDirectory}/style.css"
  );
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

    colors = lib.mkOption {
      type = lib.types.attrsOf lib.types.str;
      readOnly = true;
      default = themeColors;
      defaultText = lib.literalMD "every color token of `theme`, from the built glossary";
      description = "Color tokens of the selected theme, by token id, such as `color.focus`.";
    };

    waybar.colors = lib.mkOption {
      type = lib.types.attrsOf lib.types.str;
      default = { };
      example = {
        "color.focus" = "#d79921";
        "color.surface.base" = "#282828";
      };
      description = ''
        Colors that replace tokens in the Waybar stylesheet, by token id. The bar keeps
        the design system's layout and takes these colors, so another palette can
        reuse it. The stylesheet reads `color.surface.base`, `color.border.default`,
        `color.text.primary`, `color.text.secondary`, `color.text.inverse` and `color.focus`.
      '';
    };

    waybar.enable = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = ''
        Style Waybar with the generated stylesheet. When Home Manager manages Waybar,
        the stylesheet is prepended to `programs.waybar.style`, so your own rules come
        after it. Otherwise it is written to ~/.config/waybar.
      '';
    };

    waybar.style = lib.mkOption {
      type = lib.types.enum [
        "floating"
        "borderless"
      ];
      default = "floating";
      description = ''
        Shape of the bar, which also sets Hyprland's top gap. `floating` sits inside the
        frame with an outline and rounded corners. `borderless` is transparent, with no outline, and aligns its markers with the
        frame like the windows below it.
      '';
    };

    waybar.config.enable = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = ''
        Configure the Waybar bar: modules, formats and margins.
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
        xdg.configFile = waybarImageFiles;
      })
      (lib.mkIf (cfg.waybar.enable && waybarManagedByHomeManager) {
        programs.waybar.style = lib.mkBefore (waybarColorsCss + waybarStyleWithoutImport);
      })
      (lib.mkIf (cfg.waybar.enable && !waybarManagedByHomeManager) {
        xdg.configFile."waybar/style.css".source = "${themeDirectory}/style.css";
        xdg.configFile."waybar/colors.css".text = waybarColorsCss;
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
