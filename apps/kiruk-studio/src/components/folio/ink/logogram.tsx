/**
 * The kiruk logogram — rigged, never redrawn. Path data copied unchanged from
 * apps/kiruk-studio/public/favicon.svg (Figma "DARK - KIRUK LOGOGRAM", node 44:127):
 * 16 needles on a 15° dial, four spears, four points, a hole at the centre.
 * Filled with the sheet's ink, never filtered (codex rule 9).
 *
 * spec-link: openspec/specs/brand-system/spec.md
 * spec-link: .claude/skills/kiruk-codex/SKILL.md — founder rule 9
 */

export const LOGOGRAM_VIEW = {
  x: 500,
  y: 500,
  size: 1000,
  cx: 1000,
  cy: 1000,
  hole: 60,
  stroke: 10,
} as const;

export const LOGOGRAM_NEEDLES = [
  'M1071.91 1266.79L1051.2 1189.51',
  'M1135 1241.28L1095 1172',
  'M1311.56 1178L1173 1098',
  'M1402.5 1100.94L1190 1044',
  'M927.798 1266.79L948.504 1189.51',
  'M857.707 1236.28L897.707 1167',
  'M687.142 1171L825.706 1091',
  'M597.203 1100.94L809.706 1044',
  'M1071.91 738L1051.2 815.274',
  'M1132 760.503L1092 829.785',
  'M1306.56 822.785L1168 902.785',
  'M1402.5 903.845L1190 960.785',
  'M927.798 738L948.504 815.274',
  'M860.707 762.503L900.707 831.785',
  'M689.142 830.785L827.706 910.785',
  'M597.203 903.845L809.706 960.785',
] as const;

export const LOGOGRAM_FILLS = [
  'M1000 720C1000 720 1003.51 724.58 1004 728C1013.28 792.878 1009.32 840.136 1020 880C1028.71 912.5 1052.18 931.949 1060 940C1067.82 948.051 1088.28 971.5 1120 980C1159.28 990.526 1471.57 995.87 1471.99 995.877L1480 1000H1000V720Z',
  'M1000 720C1000 720 996.489 724.58 996 728C986.717 792.878 990.682 840.136 980 880C971.292 912.5 947.819 931.949 940 940C932.181 948.051 911.722 971.5 880 980C840.718 990.526 528.427 995.87 528.009 995.877L520 1000H1000V720Z',
  'M1000 1280C1000 1280 1003.51 1275.42 1004 1272C1013.28 1207.12 1009.32 1159.86 1020 1120C1028.71 1087.5 1052.18 1068.05 1060 1060C1067.82 1051.95 1088.28 1028.5 1120 1020C1159.31 1009.47 1472 1004 1472 1004L1480 1000H1000V1280Z',
  'M1000 1280C1000 1280 996.489 1275.42 996 1272C986.717 1207.12 990.682 1159.86 980 1120C971.292 1087.5 947.819 1068.05 940 1060C932.181 1051.95 911.722 1028.5 880 1020C840.718 1009.47 528.427 1004.13 528.009 1004.12L520 1000H1000V1280Z',
  'M940 900L870.5 862.5L792.5 784.5C792.5 784.5 786.551 778.168 783.364 781.055C780.07 784.038 785.5 791.5 785.5 791.5L863.5 869.5L900 940C900 940 920.97 939.024 930 930C939.03 920.975 940 900 940 900Z',
  'M1060 900L1129.5 862.199L1207.5 784.199C1207.5 784.199 1213.45 777.868 1216.64 780.754C1219.93 783.737 1214.5 791.199 1214.5 791.199L1136.5 869.199L1100 940C1100 940 1079.03 938.723 1070 929.699C1060.97 920.674 1060 900 1060 900Z',
  'M940 1100L869.5 1139.5L792.5 1216.5C792.5 1216.5 786.551 1222.83 783.364 1219.95C780.07 1216.96 785.5 1209.5 785.5 1209.5L863 1133L900 1061C900 1061 920.97 1061.98 930 1071C939.03 1080.02 940 1100 940 1100Z',
  'M1060.77 1101.5L1130 1140L1208.27 1218.3C1208.27 1218.3 1214.22 1224.63 1217.41 1221.75C1220.7 1218.76 1215.27 1211.3 1215.27 1211.3L1137.27 1133.3L1100.77 1062.5C1100.77 1062.5 1079.8 1063.78 1070.77 1072.8C1061.74 1081.83 1060.77 1101.5 1060.77 1101.5Z',
] as const;

/** One symbol per document; every plate `<use>`s it. */
export function LogogramDefs() {
  const v = LOGOGRAM_VIEW;
  return (
    <>
      <mask
        id="kiruk-logogram-hole"
        maskUnits="userSpaceOnUse"
        x={v.x}
        y={v.y}
        width={v.size}
        height={v.size}
      >
        <rect x={v.x} y={v.y} width={v.size} height={v.size} fill="#fff" />
        <circle cx={v.cx} cy={v.cy} r={v.hole} fill="#000" />
      </mask>
      <symbol id="kiruk-logogram" viewBox={`${v.x} ${v.y} ${v.size} ${v.size}`} overflow="visible">
        <g stroke="currentColor" strokeWidth={v.stroke} strokeLinejoin="bevel" fill="none">
          {LOGOGRAM_NEEDLES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g fill="currentColor" stroke="none" mask="url(#kiruk-logogram-hole)">
          {LOGOGRAM_FILLS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </symbol>
    </>
  );
}

/** The eye on a plate: the logogram centred on (cx, cy), `size` units across. */
export function Eye({
  cx,
  cy,
  size,
  className = 'eye',
  label,
}: {
  cx: number;
  cy: number;
  size: number;
  className?: string;
  label?: string;
}) {
  return (
    <use
      href="#kiruk-logogram"
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      className={className}
      data-eye=""
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  );
}
