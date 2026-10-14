# Visual prototype

Several structurally different variants of one screen, switchable from a floating bar. The user flips between them, picks one or combines parts, and the rest is thrown away.

## Where the variants live

- **Inside an existing screen (preferred).** Render the variants on the screen they belong to, so they sit among the real header, navigation, data and density. Data loading, parameters and access checks stay; only the rendered part swaps. A new section of an existing screen still counts as this case.
- **A new throwaway screen (last resort).** Only when nothing existing could host it. Follow the repo's routing convention and put the word "prototype" in the path. An empty screen hides design problems a populated one would show, so check twice that no host exists.

## Steps

1. **State the plan in one line** at the top of the prototype file: "Three variants of the settings screen, switched by `variant`, on the existing settings route."
2. **Pick N.** Default 3, at most 5; past that they stop being different and become noise.
3. **Draft the variants.** Each uses the screen's real data and the repo's own component library and styling, and exports a clear name (`VariantA`, `VariantB`). They differ in structure: layout, information hierarchy, the primary action. If two come out alike, redo one with an explicit "not that layout" instruction.
4. **Wire one switcher** on the screen: read the current variant from a reload-stable place (a query parameter on a web page, otherwise a flag or setting), default to the first, render that variant.
5. **Build the floating bar** as one shared component:
   - previous and next arrows that wrap around, and a label with the variant key and name;
   - left and right arrow keys also switch, except while focus is in a text field or editable area;
   - switching updates the reload-stable place, so a variant can be shared;
   - visibly not part of the design (a high-contrast pill);
   - hidden in production builds, so a stray merge can't ship it.
6. **Hand over** the address and the variant keys.

## Capture

When a variant wins, write down which and why. Fold the winner into the real screen, rewritten to production standards. Remove the losing variants and the bar from the default branch; the full set goes to the throwaway branch.

## Don't

- Make variants that differ only in color or copy. That's a tweak, not a prototype.
- Share a layout between variants. Shared small parts are fine; a shared layout defeats the point.
- Wire variants to real writes. Point any write at a stub; the question is how it looks.
- Promote a variant directly. It was written without tests or error handling.
