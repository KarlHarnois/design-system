{
  lib,
  stdenv,
  fetchFromGitHub,
  rustPlatform,
  cargo,
  rustc,
  knave,
  nodejs_24,
  pnpm_12,
  pnpmConfigHook,
  fetchPnpmDeps,
  callPackage,
}:

let
  knaveLibraries = [
    (fetchFromGitHub {
      owner = "KarlHarnois";
      repo = "knave-grid";
      rev = "3b86e5f8fad790ee4d1a391c1c828abc39147d1d";
      hash = "sha256-mIt2b24vegfjN6C6Sha4aZ6MMZeOxgKRfFMB6TXr0NQ=";
    })
    (fetchFromGitHub {
      owner = "KarlHarnois";
      repo = "knave-preview";
      rev = "3d759e7f9d2c48ed2119b53839c30a228cebd975";
      hash = "sha256-Gpf2uG+NQY1o7yb8EJ8QQgwJW91UBPjKhkaCMuEn1QI=";
    })
  ];
  cachedLibraries = lib.concatMapStrings (library: "cp -r ${library} $XDG_CACHE_HOME/knave/git/${library.rev}\n") knaveLibraries;
  gridCrates = rustPlatform.importCargoLock { lockFile = ../grid/Cargo.lock; };
in
stdenv.mkDerivation (finalAttrs: {
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
      ../grid/project.knv
      ../grid/Cargo.lock
      ../grid/tasks
      ../components
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
    knave
    cargo
    rustc
  ];

  buildPhase = ''
    runHook preBuild
    pnpm exec tz build
    export XDG_CACHE_HOME=$TMPDIR/cache CARGO_HOME=$TMPDIR/cargo CARGO_NET_OFFLINE=true
    mkdir -p $XDG_CACHE_HOME/knave/git $CARGO_HOME
    ${cachedLibraries}
    chmod -R u+w $XDG_CACHE_HOME/knave/git
    printf '[source.crates-io]\nreplace-with = "vendored"\n[source.vendored]\ndirectory = "%s"\n' ${gridCrates} > $CARGO_HOME/config.toml
    rm -rf dist/grid
    (cd grid && knave task build-grid)
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    cp -r dist $out
    cp -r keymap $out/keymap
    cp -r components $out/css/components
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
