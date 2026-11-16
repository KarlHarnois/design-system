# 0001. Author tokens in DTCG and build them with Terrazzo

## Status
Accepted

## Context
Tokens must reach CSS, GTK3 CSS for Waybar, QML for Quickshell, and Rust for Knave.
A single source format that every tool understands keeps the targets in sync.

## Decision
Author tokens in the DTCG 2025.10 format, with a resolver file for themes.
Build them with Terrazzo, which supports DTCG and resolvers natively and accepts
custom plugins for targets it does not cover.

## Consequences
Each new target is a Terrazzo plugin in `build/plugins/`. Style Dictionary is not used.
