export function getNodeColor(state) {
  console.log("getNodeColor state", state)
  if (state) {
    if (state === 'ALIVE') {
      return "#149414";
    } else if (state === 'DEAD') {
      return "#cc0000";
    }
  }
  return "#004999";
}
export function getUniqueColor(index, total) {
  const hue = (index * 137.5) % 360; // Use golden angle for even distribution
  return `hsl(${hue}, 70%, 50%)`;
}
