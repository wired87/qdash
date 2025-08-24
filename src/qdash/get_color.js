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

export function getEdgeColor() {
  console.log("getEdgeColor")
  return "#ffffff";
}
