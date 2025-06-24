import { Component, JSX, mergeProps, splitProps } from "solid-js";

// ✅ 使用正确的 SVG 类型
interface IconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  icon: string;
  size?: number;
  color?: string;
}

const Icon: Component<IconProps> = (props) => {
  const merged = mergeProps({
    size: 24,
    color: 'currentColor',
    class: 'cursor-pointer',
    icon: ''
  }, props);

  const [local, others] = splitProps(merged, ['size', 'color', 'icon']);

  const icons: Record<string, JSX.Element> = {
    back: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={local.size}
        height={local.size}
        viewBox="0 0 512 512"
        style={{ color: local.color }}
        {...others}
      >
        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M244 400L100 256l144-144"></path>
        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M120 256h292"></path>
      </svg>
    ),

    edit: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={local.size}
        height={local.size}
        viewBox="0 0 24 24"
        style={{ color: local.color }}
        {...others}
      >
        <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3"></path>
          <path d="M9 15h3l8.5-8.5a1.5 1.5 0 0 0-3-3L9 12v3"></path>
          <path d="M16 5l3 3"></path>
        </g>
      </svg>
    ),

    copyHtml: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={local.size}
        height={local.size}
        viewBox="0 0 384 512"
        style={{ color: local.color }}
        {...others}
      >
        <path d="M0 32l34.9 395.8L191.5 480l157.6-52.2L384 32H0zm308.2 127.9H124.4l4.1 49.4h175.6l-13.6 148.4l-97.9 27v.3h-1.1l-98.7-27.3l-6-75.8h47.7L138 320l53.5 14.5l53.7-14.5l6-62.2H84.3L71.5 112.2h241.1l-4.4 47.7z" fill="currentColor"></path>
      </svg>
    ),

    copyRaw: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={local.size}
        height={local.size}
        viewBox="0 0 24 24"
        style={{ color: local.color }}
        {...others}
      >
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"></path>
      </svg>
    )
  };

  return icons[local.icon] || null;
};

export default Icon;
