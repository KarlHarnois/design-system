{
  lib,
  stdenvNoCC,
  nodejs_24,
  pnpm_12,
  pnpmConfigHook,
  fetchPnpmDeps,
  callPackage,
}:

stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "design-system";
  version = "0.1.0";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../package.json
      ../pnpm-lock.yaml
      ../tsconfig.json
      ../terrazzo.config.ts
      ../tokens
      ../keymap
      ../bar
      ../build
      ../tests
    ];
  };

  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname version src;
    pnpm = pnpm_12;
    fetcherVersion = 4;
    hash = "sha256-VpNtOf13H2vMSMS0qGd1XTELrJi4upXE0sS/iZEU7i8=";
  };

  env.DESIGN_SYSTEM_WEB_FONTS = callPackage ./web-fonts.nix { };

  nativeBuildInputs = [
    nodejs_24
    pnpm_12
    pnpmConfigHook
  ];

  buildPhase = ''
    runHook preBuild
    pnpm exec tz build
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    cp -r dist $out
    cp -r keymap $out/keymap
    runHook postInstall
  '';

  passthru.tests = finalAttrs.finalPackage.overrideAttrs {
    pname = "design-system-tests";
    buildPhase = ''
      pnpm test
      pnpm typecheck
    '';
    installPhase = "touch $out";
  };
})
