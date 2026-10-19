---
name: dependency-upgrade
description: "Move a dependency, runtime or toolchain to a newer version, such as bump X to 5, upgrade the runtime, or clear the outdated packages. Reads the breaking changes first."
---

# Dependency upgrade

review: panel for a major version or a risk area; own-read otherwise

Read what changed upstream before changing anything. One upgrade per run.

1. Read the changes
   Done: the upstream changelog and breaking changes for the whole version range are read (sources cited by link or file), and the ones that touch this repo are listed with `file:line` of the affected uses.
2. Baseline
   Done: the verify keys for the touched change types pass before the bump, so a later failure is yours.
3. Bump
   Done: the version is changed in the manifest and lockfile with the repo's own tool, and nothing else changed.
4. Mechanical changes (apply **build-the-lever**)
   Done: each mechanical breaking change is handled by a codemod or script that reproduces a hand edit on one unit with an empty diff; **sweep** fans it out when the call sites partition into disjoint slices. Changes that need judgment are listed and done by you or a coder.
5. **verify**
   Done: the verify key for each touched change type passes on the combined tree, logged.
6. **blast-radius** (majors)
   Done: for a major version, the risks beyond the diff (behavior defaults, data formats, config, transitive bumps) are cited and the one safety fact is proven; a minor or patch bump is `skip: not a major`.
7. **review**
   Done: Act-on findings are fixed and re-verified, or declined with a reason.
8. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** the version range, the breaking changes that applied, the lever and its proof, the verify evidence, and the risks left.
