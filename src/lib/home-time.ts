export function greetingKeyForHour(hour: number): "home.greetingMorning" | "home.greetingAfternoon" | "home.greetingEvening" | "home.greetingNight" {
  if (hour >= 5 && hour < 12) return "home.greetingMorning";
  if (hour >= 12 && hour < 18) return "home.greetingAfternoon";
  if (hour >= 18 && hour < 23) return "home.greetingEvening";
  return "home.greetingNight";
}
