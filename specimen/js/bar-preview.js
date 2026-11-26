"use strict";

class BarPreview {
  constructor(spec, images, styleProperties) {
    this.spec = spec;
    this.images = images;
    this.styleProperties = styleProperties;
  }

  render(root) {
    for (const bar of root.querySelectorAll('[data-bar-preview="bar"]')) this.renderBar(bar);
    const states = root.querySelector('[data-bar-preview="states"]');
    this.applyStyle(states, states.dataset.barStyle);
    this.renderStates(states);
  }

  applyStyle(element, style) {
    const scope = element.closest(".desktop") ?? element;
    for (const property of this.styleProperties) {
      scope.style.setProperty(`--bar-style-${property}`, `var(--component-bar-style-${style}-${property})`);
    }
  }

  renderBar(element) {
    const { barStyle, barActive, barState } = element.dataset;
    this.applyStyle(element, barStyle);
    const preview = { active: barActive, states: this.moduleStates(barState) };
    const groups = (side) => this.spaced(this.shownGroups(side, barStyle).map((group) => this.group(group, preview)));
    element.replaceChildren(
      this.side("modules-left", groups(this.spec.left)),
      this.side("modules-center", []),
      this.side("modules-right", groups(this.spec.right)),
    );
  }

  spaced(groupElements) {
    for (const element of groupElements.slice(0, -1)) {
      element.style.marginRight = `var(--${element.dataset.spaceAfter.replaceAll(".", "-")})`;
    }
    return groupElements;
  }

  shownGroups(groups, style) {
    return groups.filter((group) => group.styles === undefined || group.styles.includes(style));
  }

  renderStates(element) {
    const samples = [...this.spec.left, ...this.spec.right].flatMap((group) => group.modules).flatMap((module) =>
      (module.stateSamples ?? []).map((sample) => this.stateModule(module, sample)),
    );
    element.replaceChildren(this.side("modules-right", [this.side("module-group", samples)]));
  }

  moduleStates(barState) {
    if (barState === undefined) return {};
    return Object.fromEntries(barState.split(" ").map((entry) => entry.split(":")));
  }

  group(group, { active, states }) {
    const element = this.side("module-group", group.modules.map((module) => this.previewModule(module, active, states[module.name])));
    element.dataset.group = group.name;
    element.dataset.spaceAfter = group.spaceAfter ?? "space.group";
    return element;
  }

  previewModule(module, active, state) {
    const stateSample = state === undefined ? undefined : module.stateSamples?.find((sample) => sample.state === state);
    if (stateSample !== undefined) return this.stateModule(module, stateSample);
    if (active !== undefined && module.sample.items !== undefined) return this.module(module, { ...module.sample, active }, []);
    return this.module(module, module.sample, []);
  }

  stateModule(module, sample) {
    const format = this.sampleFormat(module, sample);
    const classes = [sample.variant, sample.state].filter((name) => name !== undefined);
    return this.module({ ...module, format }, sample, classes);
  }

  sampleFormat(module, sample) {
    if (sample.variant !== undefined) return module.variants[sample.variant];
    return module.states?.[sample.state]?.format ?? module.format;
  }

  module(module, sample, classes) {
    if (module.image !== undefined) return this.image(module);
    if (sample.items !== undefined) return this.workspaces(module, sample);
    const element = document.createElement("span");
    element.classList.add(module.name, "module-text", ...classes);
    element.classList.toggle("module-plain", module.marker === false);
    element.textContent = new WaybarFormat(module.format).render(sample);
    if (module.width !== undefined) {
      element.classList.add("module-fixed", `module-align-${module.align ?? "left"}`);
      element.style.setProperty("--module-width", module.width);
    }
    return element;
  }

  image(module) {
    const element = document.createElement("span");
    element.classList.add(module.name, "module-image");
    const { url, aspectRatio } = this.images[module.image];
    element.style.setProperty("--module-image", `url("${url}")`);
    element.style.setProperty("--module-image-aspect-ratio", aspectRatio);
    return element;
  }

  workspaces(module, sample) {
    const element = document.createElement("span");
    element.classList.add(module.name);
    for (const item of sample.items) {
      const workspace = document.createElement("span");
      workspace.classList.add("workspace");
      workspace.classList.toggle("active", item === sample.active);
      const icon = module.icons?.[item] ?? item;
      workspace.textContent = new WaybarFormat(module.format).render({ values: { name: item, icon } });
      element.append(workspace);
    }
    return element;
  }

  side(className, children) {
    const element = document.createElement("div");
    element.classList.add(className);
    element.append(...children);
    return element;
  }
}
