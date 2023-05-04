/* The following code is taken from https://github.com/cs5041/p4/blob/main/interaction/index.js, by CS5041 (probably Xue Zhu). Accessed 03/05/2023. */
export default function scale(fromRange, toRange) {
    const d = (toRange[1] - toRange[0]) / (fromRange[1] - fromRange[0]);
    return from => (from - fromRange[0]) * d + toRange[0];
}
/* End of adapted code. */