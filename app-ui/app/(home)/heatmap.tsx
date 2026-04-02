// heatmap
import React from "react";
import Svg, { Circle, Defs, G, Mask, Path, RadialGradient, Rect, Stop } from "react-native-svg"; // use svg for image

type HeatmapProps = {
  averages: number[]; // input [toe, arch, heel]
  userWeight: number; // lb
};

// functional component
const Heatmap: React.FC<HeatmapProps> = ({ averages, userWeight }) => {
  if (!averages || averages.length !== 3) return null;

  // invert pressure values
  const p0 = 1023 - averages[0];
  const p1 = 1023 - averages[1];
  const p2 = 1023 - averages[2];

  // calculate total pressure
  const totalPressure = p0 + p1 + p2;

  // color mapping
  const getColor = (invertedValue: number) => {
    // pressure = 0 (max) => intensity = 1 (high/red).
    // pressure = 1023 (none) => intensity = 0 (low/yellow).
   
    const intensity = invertedValue / totalPressure;

    // intensity => hue
    // hue 0 = red (high pressure)
    // hue 60 = yellow (low pressure)
    let hue: number;

  if (intensity < 0.1) {
    // green -> yellow 
    hue = 120 - (intensity / 0.1) * (120 - 60);
  } else if (intensity < 0.4) {
    // yellow -> orange
    hue = 60 - ((intensity - 0.1) / 0.3) * (60 - 30);
  } else if (intensity < 0.7) {
    // orange -> red
    hue = 30 - ((intensity - 0.4) / 0.3) * (30 - 0);
  } else {
    hue = 0; // full red
  }

    return `hsl(${hue}, 100%, 50%)`;
  };

  // convert each region
  const toeColor = getColor(p0);
  const sideColor = getColor(p2);
  const heelColor = getColor(p1);

  // svg path (mask heatmap, draw outline)
  const footPaths = [
    "M154.13 274.39c-79.17-8.33-65.87-131.13-2.09-164.58 42.26-22.161 99.31-21.193 137.5-6.25 72.44 28.35 91.669 64.58 102.09 135.42 10.413 70.83-24.49 258.2-108.34 279.16-75 18.75-103.94-17.6-95.83-52.08 8.33-35.42 49.41-81.29 52.08-112.5 6.25-72.92-85.41-79.17-85.41-79.17",
    "M13.06 101.5c21.21 30.8 61.45 39.9 89.88 20.33 28.43-19.58 34.29-60.414 13.08-91.214S54.58-9.282 26.14 10.293C-2.28 29.868-8.14 70.705 13.06 101.5",
    "M176.55 82.105c18.15 3.09 35.28-8.655 38.28-26.236 2.99-17.581-8.59-44.006-26.74-47.096-18.15-3.092-35.29 8.655-38.28 26.236-3 17.581 8.59 44.005 26.74 47.096",
    "M235.4 69.41c10.28 14.576 25.34 17.381 40.38 6.774 15.05-10.607 18.59-40.858 8.31-55.435-10.28-14.575-25.33-17.38-40.38-6.773s-18.59 40.858-8.31 55.434",
    "M298.25 80.36c3.16 15.209 18.957 24.79 35.293 21.4 16.336-3.392 29.616-26.456 26.459-41.665s-18.958-24.79-35.293-21.399C308.37 42.087 295.09 65.151 298.25 80.36",
    "M364.611 102.14c-9.291 13.86-7.525 31.32 3.943 39.01s28.296 2.69 37.587-11.17c9.29-13.86 7.524-31.323-3.944-39.011s-28.296-2.688-37.586 11.171"
  ];

  return (
    <Svg 
        width="95%" 
        height="95%" 
        viewBox="0 0 412 523" 
        preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <RadialGradient id="heelGradient" cx="50%" cy="50%" r="75%">
          <Stop offset="0%" stopColor={heelColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={heelColor} stopOpacity="0"  />
        </RadialGradient>

        <RadialGradient id="archGradient"cx="50%" cy="50%" r="75%">
          <Stop offset="0%" stopColor={sideColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={sideColor} stopOpacity="0"  />
        </RadialGradient>

        <RadialGradient id="toeGradient" cx="50%" cy="50%" r="75%">
          <Stop offset="0%" stopColor={toeColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={toeColor} stopOpacity="0"  />
        </RadialGradient>
      </Defs>

      <Mask id="footMask">
          <G fill="white">
            {footPaths.map((d, i) => (
              <Path key={`mask-${i}`} d={d} />
            ))}
          </G>
      </Mask>

      <Rect // heatmap rect clipped by mask (restricted to foot outline)
        x="0"
        y="0"
        width="412"
        height="523"
        fill="url(#heatGradient)"
        mask="url(#footMask)"
      />

      <G mask="url(#footMask)">
        {/* heel */}
        <Circle
          cx={270}
          cy={440}
          r={80}
          fill="url(#heelGradient)"
        />

        {/* arch */}
        <Circle
          cx={300}
          cy={200}
          r={80}
          fill="url(#archGradient)"
        />

        {/* toe */}
        <Circle
          cx={180}
          cy={200}
          r={80}
          fill="url(#toeGradient)"
        />
      </G>

      <G fill="none" stroke="#ffffff" strokeWidth="2" opacity={0.3}>
        {footPaths.map((d, i) => (
          <Path key={`outline-${i}`} d={d} />
        ))}
      </G>

    </Svg>
  );

};

export default Heatmap;


