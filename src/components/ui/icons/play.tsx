import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

export function Play({ color = '#FFF', size = 32, ...props }: SvgProps & { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M8 5v14l11-7L8 5z"
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  );
}
