import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function Heart({ color = '#000', filled = false, ...props }: SvgProps & { filled?: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? color : 'none'} {...props}>
      <Path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke={filled ? 'none' : color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

