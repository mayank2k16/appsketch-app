import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function Category({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 6h16M4 12h16M4 18h16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

