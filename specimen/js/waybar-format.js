"use strict";

class WaybarFormat {
  static DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  static MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  constructor(format) {
    this.format = format;
  }

  render(sample) {
    return this.format.replace(/\{([^}]*)\}/g, (_, field) => this.field(field, sample));
  }

  field(field, sample) {
    if (field.startsWith(":")) return WaybarFormat.strftime(field.slice(1), WaybarFormat.localTime(sample.time));
    const [name, spec] = field.split(":");
    const value = String(sample.values?.[name] ?? "");
    return spec?.startsWith("0") ? value.padStart(Number(spec.slice(1)), "0") : value;
  }

  static localTime(text) {
    const [date, clock] = text.split("T");
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = clock.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }

  static strftime(pattern, time) {
    const twoDigits = (value) => String(value).padStart(2, "0");
    const fields = {
      a: WaybarFormat.DAY_NAMES[time.getDay()],
      b: WaybarFormat.MONTH_NAMES[time.getMonth()],
      d: twoDigits(time.getDate()),
      H: twoDigits(time.getHours()),
      M: twoDigits(time.getMinutes()),
    };
    return pattern.replace(/%([abdHM])/g, (_, letter) => fields[letter]);
  }
}
