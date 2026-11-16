"use strict";

class Command {
  constructor(keys, name, description, run) {
    this.keys = keys;
    this.name = name;
    this.description = description;
    this.run = run;
  }

  matches(query) {
    return `${this.name} ${this.description}`.toLowerCase().includes(query.toLowerCase());
  }
}
