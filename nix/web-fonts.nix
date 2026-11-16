{
  runCommand,
  python3,
  iosevka-bin,
}:

let
  fonttools = python3.withPackages (packages: [
    packages.fonttools
    packages.brotli
  ]);
  aile = iosevka-bin.override { variant = "Aile"; };
  unicodes = "U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212,U+2500-257F";
  faces = [
    "${iosevka-bin}/share/fonts/truetype/Iosevka-Regular.ttc iosevka-regular"
    "${iosevka-bin}/share/fonts/truetype/Iosevka-Bold.ttc iosevka-bold"
    "${aile}/share/fonts/truetype/IosevkaAile-Regular.ttc iosevka-aile-regular"
    "${aile}/share/fonts/truetype/IosevkaAile-Bold.ttc iosevka-aile-bold"
  ];
in
runCommand "design-system-web-fonts" { nativeBuildInputs = [ fonttools ]; } ''
  mkdir -p $out
  while read -r collection name; do
    pyftsubset "$collection" --font-number=0 --unicodes="${unicodes}" \
      --layout-features='*' --flavor=woff2 --output-file="$out/$name.woff2"
  done <<FACES
  ${builtins.concatStringsSep "\n" faces}
  FACES
''
