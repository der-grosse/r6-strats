# Rainbow Six Siege Strat Organizer and Editor

This is a web application to create and share strategies for Rainbow Six Siege. It is specifically designed to be used by the IGL during a match to display the currently played strat to the entire team. You can assign operators, set gadget positions, what should be reinforced and more. The strats can be shared with your team and filtered by for your currrent map, site and banend operators.
You can use the tool for free at [r6-strats.com](https://r6-strats.com).

## Planned Features

### Bugs

- editor saving and collaboration bugs

### Strat Attributes Editor

- strat position change position when selecting different positions
- Make current google drawing integration more generic to work with other editors

### Drag and Drop Strat Editor

#### Saving and Collaboration

- fix saving
- fix collaboration issues -> use convex?

#### Selection and Manipulation

- menu can clip outside of screen when element is close to top/side border
- scrubbing for selecting mulptiple elements at once
- CTRL+D to duplicate selected elements
- CTRL+C and CTRL+V to copy and paste selected elements
- edit attributes of all selected multiple assets at once
- make asset ordering consistent
  - bring to front / send to back for selected elements
- arrow keys for fine adjustment of selected elements

#### Feature Additions

- Textbox Asset
- Arrow Asset
- Embed images -> via external link
- variable width barricades
- change between rotation and reinforcement for walls in asset menu
- change between barricade, castle in asset menu
- add selector for current player in sidebar -> this player gets assigned all new added assets
- add new map blueprints
  - clubhouse 1f windows missing / wrong asset
- add different stages for round -> fallback positions or strat alternatives
- add bombsite indicator

#### Map View

- you can add multiple reinforcement above each other when clicking hatches (might even be when right clicking?)
- add toggle for floors of map
- operator icons with small rectangle shapes clip outside
- zoom slider
- scroll bars when zoomed in
- click an drag to pan map

### Misc

- duplicate strat
- add landing page
- add default strats
- add link sharing for active strat
- rework strat filter in sidebar?
